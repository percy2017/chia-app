package com.chianative

import android.app.Notification
import android.os.Bundle
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import java.util.concurrent.ConcurrentHashMap

/**
 * Lee la barra de notificaciones del telefono para la tool `phone`
 * (acciones `notifications.list` / `notifications.settings`).
 *
 * Mismo patron que NotiNative: siembra las notificaciones activas al conectar,
 * captura cada `onNotificationPosted` y marca `removed_at` en
 * `onNotificationRemoved`; todo va a SQLite ([ChiaNotifStore]) aunque la app
 * este cerrada. Android no deja habilitar el acceso por codigo: sin el permiso
 * el modulo devuelve `enabled:false` y `notifications.settings` abre Ajustes.
 */
class ChiaNotifyListener : NotificationListenerService() {

  private val labels = ConcurrentHashMap<String, String>()

  private fun textOf(value: CharSequence?): String = value?.toString()?.trim().orEmpty()

  /** Cuerpo: big text, texto normal o lineas, el primero que traiga algo. */
  private fun bodyOf(extras: Bundle): String {
    val big = textOf(extras.getCharSequence(Notification.EXTRA_BIG_TEXT))
    if (big.isNotEmpty()) {
      return big
    }
    val text = textOf(extras.getCharSequence(Notification.EXTRA_TEXT))
    if (text.isNotEmpty()) {
      return text
    }
    return extras.getCharSequenceArray(Notification.EXTRA_TEXT_LINES)
      ?.joinToString("\n") { it.toString().trim() }
      ?.trim()
      .orEmpty()
  }

  private fun labelFor(pkg: String): String = labels.getOrPut(pkg) {
    runCatching {
      val info = packageManager.getApplicationInfo(pkg, 0)
      packageManager.getApplicationLabel(info).toString()
    }.getOrDefault(pkg)
  }

  private val store: ChiaNotifStore
    get() = ChiaNotifStore.get(applicationContext)

  override fun onCreate() {
    super.onCreate()
    instance = this
  }

  override fun onDestroy() {
    if (instance === this) {
      instance = null
    }
    super.onDestroy()
  }

  override fun onListenerConnected() {
    super.onListenerConnected()
    instance = this
    val self = packageName
    runCatching {
      activeNotifications?.forEach { sbn ->
        if (sbn.packageName != self) {
          // Siembra del historial al conectar.
          capture(sbn)
        }
      }
    }
  }

  override fun onNotificationPosted(sbn: StatusBarNotification?) {
    if (sbn == null || sbn.packageName == packageName) {
      return
    }
    capture(sbn)
  }

  override fun onNotificationRemoved(sbn: StatusBarNotification?) {
    if (sbn == null || sbn.packageName == packageName) {
      return
    }
    store.markRemoved(sbn.key)
  }

  private fun capture(sbn: StatusBarNotification) {
    val notification = sbn.notification ?: return
    val extras = notification.extras ?: Bundle.EMPTY
    val title = textOf(extras.getCharSequence(Notification.EXTRA_TITLE))
    val body = bodyOf(extras)
    if (title.isEmpty() && body.isEmpty()) {
      return
    }
    val group = notification.group != null ||
      (notification.flags and Notification.FLAG_GROUP_SUMMARY) != 0
    val row = ChiaNotifRow(
      id = 0,
      sbnKey = sbn.key ?: "${sbn.packageName}:${sbn.id}",
      pkg = sbn.packageName,
      appLabel = labelFor(sbn.packageName),
      title = title,
      body = body,
      subText = textOf(extras.getCharSequence(Notification.EXTRA_SUB_TEXT)),
      category = notification.category ?: "",
      channel = notification.channelId ?: "",
      postedAt = if (sbn.postTime > 0) sbn.postTime else System.currentTimeMillis(),
      isOngoing = notification.flags and Notification.FLAG_ONGOING_EVENT != 0,
      isGroup = group,
      isClearable = sbn.isClearable,
      removedAt = null,
    )
    store.insert(row)
  }

  companion object {
    /** Servicio enlazado por el sistema (null = sin acceso a notificaciones). */
    @Volatile
    var instance: ChiaNotifyListener? = null
      private set

    /** Descartar una notificacion de la barra (no borra el historial). */
    fun cancel(key: String): Boolean {
      val service = instance ?: return false
      return runCatching { service.cancelNotification(key) }.isSuccess
    }
  }
}
