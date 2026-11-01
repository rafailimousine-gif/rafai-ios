package com.rafailimousine.driver

import android.app.Application
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.os.Build
import com.google.firebase.FirebaseApp

/** Canaux de notification : missions (alertes sonores) et course en cours (GPS, discret). */
class DriverApp : Application() {
    override fun onCreate() {
        super.onCreate()
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val nm = getSystemService(NotificationManager::class.java)
            nm.createNotificationChannel(
                NotificationChannel("missions", "Missions", NotificationManager.IMPORTANCE_HIGH).apply {
                    description = "Nouvelle course, modification, annulation, message de l’équipe"
                }
            )
            nm.createNotificationChannel(
                NotificationChannel("trip", "Course en cours", NotificationManager.IMPORTANCE_LOW).apply {
                    description = "Position partagée avec le client pendant la course"
                }
            )
        }
    }

    companion object {
        /** l'appli est-elle à l'écran ? (le GPS n'envoie lui-même la position que lorsqu'elle ne l'est pas) */
        @Volatile var foreground = false

        fun firebaseReady(ctx: Context): Boolean =
            try { FirebaseApp.getApps(ctx).isNotEmpty() } catch (e: Throwable) { false }

        fun prefs(ctx: Context) = ctx.getSharedPreferences("rl", Context.MODE_PRIVATE)
    }
}
