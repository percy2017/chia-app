package com.chianative

import android.Manifest
import android.app.Activity
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.PowerManager
import android.provider.Settings
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

/**
 * Mantiene el proceso vivo mientras el agente trabaja:
 *  - foreground service con notificacion (Android no lo congela ni lo mata)
 *  - PARTIAL_WAKE_LOCK (la CPU sigue con la pantalla apagada)
 *
 * Lo llama el controller al empezar y al cerrar cada turno (src/agent/keepAlive.ts).
 */
class KeepAliveModule(private val ctx: ReactApplicationContext) :
  ReactContextBaseJavaModule(ctx) {

  private var lock: PowerManager.WakeLock? = null
  private var running = false

  override fun getName(): String = "KeepAlive"

  @ReactMethod
  fun start() {
    if (running) {
      return
    }
    running = true
    acquireLock()
    try {
      ctx.startForegroundService(Intent(ctx, KeepAliveService::class.java))
    }
    catch (_: Throwable) {
      // Algun OEM bloquea el FGS: el wakelock sigue sosteniendo la CPU.
    }
    askNotificationPermission()
    askIgnoreBatteryOptimizations()
  }

  @ReactMethod
  fun stop() {
    running = false
    releaseLock()
    try {
      ctx.stopService(Intent(ctx, KeepAliveService::class.java))
    }
    catch (_: Throwable) {
    }
  }

  private fun acquireLock() {
    try {
      val pm = ctx.getSystemService(Context.POWER_SERVICE) as PowerManager
      val wakelock = lock
        ?: pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "ChiaNative:agent").also {
          it.setReferenceCounted(false)
          lock = it
        }
      if (!wakelock.isHeld) {
        wakelock.acquire(12L * 60L * 60L * 1000L)
      }
    }
    catch (_: Throwable) {
    }
  }

  private fun releaseLock() {
    try {
      val wakelock = lock
      if (wakelock?.isHeld == true) {
        wakelock.release()
      }
    }
    catch (_: Throwable) {
    }
  }

  /** Android 13+ oculta la notificacion del FGS si no hay POST_NOTIFICATIONS. */
  private fun askNotificationPermission() {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) {
      return
    }
    val activity: Activity = ctx.currentActivity ?: return
    if (
      activity.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS)
      == PackageManager.PERMISSION_GRANTED
    ) {
      return
    }
    activity.requestPermissions(
      arrayOf(Manifest.permission.POST_NOTIFICATIONS),
      NOTIFICATION_REQUEST,
    )
  }

  /**
   * Doze (pantalla apagada y quieto) puede congelar la red aunque haya FGS:
   * se pide la excepcion de bateria una sola vez.
   */
  private fun askIgnoreBatteryOptimizations() {
    try {
      val pm = ctx.getSystemService(Context.POWER_SERVICE) as PowerManager
      if (pm.isIgnoringBatteryOptimizations(ctx.packageName)) {
        return
      }
      val prefs = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
      if (prefs.getBoolean(KEY_ASKED, false)) {
        return
      }
      prefs.edit().putBoolean(KEY_ASKED, true).apply()
      val intent = Intent(
        Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS,
        Uri.parse("package:${ctx.packageName}"),
      ).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      ctx.startActivity(intent)
    }
    catch (_: Throwable) {
    }
  }

  private companion object {
    const val NOTIFICATION_REQUEST = 4711
    const val PREFS = "chia_keepalive"
    const val KEY_ASKED = "battery_asked"
  }
}
