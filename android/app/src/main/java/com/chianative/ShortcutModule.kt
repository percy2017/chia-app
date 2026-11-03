package com.chianative

import android.content.Context
import android.content.Intent
import androidx.core.content.pm.ShortcutInfoCompat
import androidx.core.content.pm.ShortcutManagerCompat
import androidx.core.graphics.drawable.IconCompat
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

/**
 * Acceso directo en la pantalla de inicio (src/boot/shortcut.ts).
 *
 * Android no deja crear iconos sin permiso del usuario ni en el momento de
 * instalar el APK: desde Android 8 el unico camino es requestPinShortcut, que
 * abre el dialogo del sistema "agregar a pantalla de inicio". Se pide una sola
 * vez (chia_shortcut/asked) para no repetir el dialogo en cada arranque.
 */
class ShortcutModule(private val ctx: ReactApplicationContext) :
  ReactContextBaseJavaModule(ctx) {

  override fun getName(): String = "Shortcut"

  @ReactMethod
  fun ensure(promise: Promise) {
    try {
      promise.resolve(pin())
    }
    catch (t: Throwable) {
      promise.reject("shortcut_pin", t.message, t)
    }
  }

  private fun prefs() =
    ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE)

  private fun pinned(): Boolean =
    ShortcutManagerCompat.getShortcuts(ctx, ShortcutManagerCompat.FLAG_MATCH_PINNED)
      .any { it.id == ID }

  private fun pin(): Boolean {
    if (pinned()) {
      return true
    }
    if (prefs().getBoolean(KEY_ASKED, false)) {
      return false
    }
    if (!ShortcutManagerCompat.isRequestPinShortcutSupported(ctx)) {
      return false
    }
    val intent = Intent(ctx, MainActivity::class.java).apply {
      action = Intent.ACTION_MAIN
      addCategory(Intent.CATEGORY_LAUNCHER)
      flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
    }
    val shortcut = ShortcutInfoCompat.Builder(ctx, ID)
      .setShortLabel(label())
      .setLongLabel(label())
      .setIcon(IconCompat.createWithResource(ctx, R.mipmap.ic_launcher))
      .setIntent(intent)
      .build()
    val pinnedNow = ShortcutManagerCompat.requestPinShortcut(ctx, shortcut, null)
    if (pinnedNow) {
      prefs().edit().putBoolean(KEY_ASKED, true).apply()
    }
    return pinnedNow
  }

  private fun label(): String =
    runCatching { ctx.getString(R.string.app_name) }.getOrDefault("ChiaNative")

  private companion object {
    const val ID = "chia-chat"
    const val PREFS = "chia_shortcut"
    const val KEY_ASKED = "asked"
  }
}
