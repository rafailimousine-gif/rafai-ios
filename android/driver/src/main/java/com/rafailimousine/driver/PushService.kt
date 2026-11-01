package com.rafailimousine.driver

import android.app.PendingIntent
import android.content.Intent
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage

/** Notifications de mission (Firebase Cloud Messaging). Appli fermée : Android les affiche lui-même. */
class PushService : FirebaseMessagingService() {
    override fun onNewToken(token: String) {
        DriverApp.prefs(this).edit().putString("fcm", token).apply()
        ContextCompat.getMainExecutor(this).execute { MainActivity.instance?.sendPushState() }
    }

    override fun onMessageReceived(m: RemoteMessage) {
        val title = m.notification?.title ?: m.data["title"] ?: "RL Driver"
        val body = m.notification?.body ?: m.data["body"] ?: ""
        val url = m.data["url"] ?: m.data["link"]
        val open = PendingIntent.getActivity(
            this, (System.currentTimeMillis() % 100000).toInt(),
            Intent(this, MainActivity::class.java).putExtra("url", url).addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        val n = NotificationCompat.Builder(this, "missions")
            .setSmallIcon(R.drawable.ic_notification)
            .setColor(ContextCompat.getColor(this, R.color.gold))
            .setContentTitle(title)
            .setContentText(body)
            .setStyle(NotificationCompat.BigTextStyle().bigText(body))
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true)
            .setContentIntent(open)
            .build()
        try { NotificationManagerCompat.from(this).notify((System.currentTimeMillis() % 100000).toInt(), n) } catch (e: SecurityException) {}
        ContextCompat.getMainExecutor(this).execute { MainActivity.instance?.pushReceived() }
    }
}
