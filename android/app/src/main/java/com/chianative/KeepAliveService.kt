package com.chianative

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.IBinder

/**
 * Foreground service de tipo dataSync: es lo que hace que Android no congele
 * ni mate el proceso mientras el agente hace peticiones al LLM y ejecuta
 * comandos por SSH con la app en segundo plano o la pantalla apagada.
 */
class KeepAliveService : Service() {

  override fun onBind(intent: Intent?): IBinder? = null

  override fun onCreate() {
    super.onCreate()
    val channel = NotificationChannel(
      CHANNEL_ID,
      "Agente trabajando",
      NotificationManager.IMPORTANCE_LOW,
    )
    channel.setShowBadge(false)
    getSystemService(NotificationManager::class.java).createNotificationChannel(channel)
  }

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    val notification = buildNotification()
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
      startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC)
    }
    else {
      startForeground(NOTIFICATION_ID, notification)
    }
    return START_NOT_STICKY
  }

  private fun buildNotification(): Notification {
    val open = PendingIntent.getActivity(
      this,
      0,
      Intent(this, MainActivity::class.java)
        .addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP),
      PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT,
    )
    return Notification.Builder(this, CHANNEL_ID)
      .setContentTitle("ChiaNative")
      .setContentText("El agente sigue trabajando")
      .setSmallIcon(android.R.drawable.stat_notify_sync)
      .setOngoing(true)
      .setOnlyAlertOnce(true)
      .setContentIntent(open)
      .build()
  }

  override fun onDestroy() {
    super.onDestroy()
    stopForeground(STOP_FOREGROUND_REMOVE)
  }

  private companion object {
    const val CHANNEL_ID = "chia_agent"
    const val NOTIFICATION_ID = 4700
  }
}
