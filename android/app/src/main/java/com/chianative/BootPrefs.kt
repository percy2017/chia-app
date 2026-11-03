package com.chianative

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent

/**
 * Flag de "abrir la app al arrancar Android". Vive en SharedPreferences y no en
 * SQLite porque lo lee [BootReceiver] cuando el proceso de React Native todavia
 * no existe; el store JS lo empuja al hidratar y en cada cambio.
 */
object BootPrefs {

  private const val PREFS = "chia_boot"
  private const val KEY_ENABLED = "start_on_boot"
  private const val CHANNEL_ID = "chia_boot"
  private const val NOTIFICATION_ID = 4701

  /** Por defecto activo: es lo que pidio el dueno del telefono. */
  fun isEnabled(ctx: Context): Boolean {
    return try {
      ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        .getBoolean(KEY_ENABLED, true)
    }
    catch (_: Throwable) {
      true
    }
  }

  fun setEnabled(ctx: Context, enabled: Boolean) {
    ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
      .edit()
      .putBoolean(KEY_ENABLED, enabled)
      .apply()
  }

  /**
   * Si el sistema bloquea la apertura en segundo plano (Android 10+ en algunos
   * OEM), se deja una notificacion para que el usuario abra la app con un toque.
   */
  fun notifyFallback(ctx: Context) {
    try {
      val manager = ctx.getSystemService(NotificationManager::class.java) ?: return
      val channel = NotificationChannel(
        CHANNEL_ID,
        "Arranque",
        NotificationManager.IMPORTANCE_DEFAULT,
      )
      channel.setShowBadge(false)
      manager.createNotificationChannel(channel)
      val open = PendingIntent.getActivity(
        ctx,
        0,
        Intent(ctx, MainActivity::class.java)
          .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP),
        PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT,
      )
      val notification = Notification.Builder(ctx, CHANNEL_ID)
        .setContentTitle("ChiaNative")
        .setContentText("Toca para abrir el agente")
        .setSmallIcon(android.R.drawable.stat_notify_sync)
        .setAutoCancel(true)
        .setContentIntent(open)
        .build()
      manager.notify(NOTIFICATION_ID, notification)
    }
    catch (_: Throwable) {
    }
  }
}
