package com.chianative

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

/**
 * Abre la app cuando Android termina de arrancar. El flag esta en
 * SharedPreferences ([BootPrefs]) porque aqui todavia no hay puente JS.
 */
class BootReceiver : BroadcastReceiver() {

  override fun onReceive(context: Context, intent: Intent?) {
    val action = intent?.action ?: return
    if (action != Intent.ACTION_BOOT_COMPLETED && action != QUICKBOOT_POWERON) {
      return
    }
    if (!BootPrefs.isEnabled(context)) {
      return
    }
    try {
      // BOOT_COMPLETED es una de las excepciones al bloqueo de inicio de
      // actividades en segundo plano, pero algunos fabricantes lo ignoran.
      context.startActivity(
        Intent(context, MainActivity::class.java)
          .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP),
      )
    }
    catch (_: Throwable) {
      BootPrefs.notifyFallback(context)
    }
  }

  private companion object {
    const val QUICKBOOT_POWERON = "android.intent.action.QUICKBOOT_POWERON"
  }
}
