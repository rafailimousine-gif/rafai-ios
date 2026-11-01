package com.rafailimousine.driver

import android.annotation.SuppressLint
import android.app.Notification
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.location.Location
import android.net.Uri
import android.os.Build
import android.os.IBinder
import android.os.Looper
import androidx.core.app.NotificationCompat
import androidx.core.content.ContextCompat
import com.google.android.gms.location.LocationCallback
import com.google.android.gms.location.LocationRequest
import com.google.android.gms.location.LocationResult
import com.google.android.gms.location.LocationServices
import com.google.android.gms.location.Priority
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.util.concurrent.Executors

/**
 * GPS de la course : tourne au premier plan (notification « Course en cours ») tant que la course n'est pas terminée,
 * même sur Waze ou écran verrouillé. Quand l'appli n'est pas à l'écran, il envoie lui-même la position au serveur
 * toutes les 12 s environ (route « drvtrk », action « ping »), comme l'appli iPhone.
 */
class GpsService : Service() {
    private val client by lazy { LocationServices.getFusedLocationProviderClient(this) }
    private val io = Executors.newSingleThreadExecutor()
    private var ref = ""
    private var key = ""
    private var api = ""
    private var lastPing = 0L
    @Volatile private var pinging = false
    private var running = false

    private val callback = object : LocationCallback() {
        override fun onLocationResult(r: LocationResult) {
            val l = r.lastLocation ?: return
            last = l
            listener?.invoke(l)
            pingIfNeeded(l)
        }
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (intent?.action == ACTION_STOP) { stopTrip(); return START_NOT_STICKY }
        val p = DriverApp.prefs(this)
        ref = intent?.getStringExtra("ref") ?: p.getString("trip_ref", "") ?: ""
        key = intent?.getStringExtra("k") ?: p.getString("trip_k", "") ?: ""
        api = intent?.getStringExtra("api") ?: p.getString("trip_api", "") ?: ""
        if (ref.isEmpty() || key.isEmpty() || api.isEmpty()) { stopSelf(); return START_NOT_STICKY }
        p.edit().putString("trip_ref", ref).putString("trip_k", key).putString("trip_api", api).apply()
        val n = notification()
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                startForeground(1, n, ServiceInfo.FOREGROUND_SERVICE_TYPE_LOCATION)
            } else {
                startForeground(1, n)
            }
        } catch (e: Exception) {
            stopSelf(); return START_NOT_STICKY
        }
        startUpdates()
        return START_REDELIVER_INTENT
    }

    private fun notification(): Notification {
        val open = PendingIntent.getActivity(
            this, 0, Intent(this, MainActivity::class.java).addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        return NotificationCompat.Builder(this, "trip")
            .setSmallIcon(R.drawable.ic_notification)
            .setColor(ContextCompat.getColor(this, R.color.gold))
            .setContentTitle("Course en cours · $ref")
            .setContentText("Votre position est partagée avec le client jusqu’à la fin de la course.")
            .setOngoing(true)
            .setContentIntent(open)
            .build()
    }

    @SuppressLint("MissingPermission")
    private fun startUpdates() {
        if (running) return
        val req = LocationRequest.Builder(Priority.PRIORITY_HIGH_ACCURACY, 5000L)
            .setMinUpdateDistanceMeters(15f)
            .setMinUpdateIntervalMillis(3000L)
            .build()
        try {
            client.requestLocationUpdates(req, callback, Looper.getMainLooper())
            running = true
        } catch (e: SecurityException) {
            stopSelf()
        }
    }

    private fun pingIfNeeded(l: Location) {
        if (DriverApp.foreground || pinging) return
        val now = System.currentTimeMillis()
        if (now - lastPing < 12_000) return
        pinging = true
        lastPing = now
        val d = JSONObject().put("lat", l.latitude).put("lng", l.longitude).put("acc", Math.round(l.accuracy.coerceAtLeast(0f)))
        val u = Uri.parse(api).buildUpon()
            .appendQueryParameter("app", "drvtrk")
            .appendQueryParameter("ref", ref)
            .appendQueryParameter("k", key)
            .appendQueryParameter("a", "ping")
            .appendQueryParameter("d", d.toString())
            .appendQueryParameter("_", now.toString())
            .build().toString()
        io.execute {
            var status: JSONObject? = null
            try {
                val c = URL(u).openConnection() as HttpURLConnection
                c.connectTimeout = 20_000
                c.readTimeout = 20_000
                c.instanceFollowRedirects = true
                c.useCaches = false
                val body = c.inputStream.bufferedReader().use { it.readText() }
                val j = JSONObject(body)
                if (j.optBoolean("ok")) status = j.optJSONObject("s")
            } catch (e: Exception) {
            }
            pinging = false
            status?.let { s ->
                DriverApp.prefs(this).edit().putString("bg_status", s.toString()).apply()
                if (s.optString("st") == "Terminée") ContextCompat.getMainExecutor(this).execute { stopTrip() }
            }
        }
    }

    private fun stopTrip() {
        try { client.removeLocationUpdates(callback) } catch (e: Exception) {}
        running = false
        DriverApp.prefs(this).edit().remove("trip_ref").remove("trip_k").remove("trip_api").apply()
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) stopForeground(STOP_FOREGROUND_REMOVE) else @Suppress("DEPRECATION") stopForeground(true)
        stopSelf()
    }

    override fun onDestroy() {
        try { client.removeLocationUpdates(callback) } catch (e: Exception) {}
        io.shutdown()
        super.onDestroy()
    }

    companion object {
        const val ACTION_STOP = "stop"
        @Volatile var last: Location? = null
        /** position transmise à la page quand l'appli est à l'écran */
        var listener: ((Location) -> Unit)? = null

        fun start(ctx: Context, ref: String, k: String, api: String) {
            val i = Intent(ctx, GpsService::class.java).putExtra("ref", ref).putExtra("k", k).putExtra("api", api)
            ContextCompat.startForegroundService(ctx, i)
        }

        fun stop(ctx: Context) {
            if (DriverApp.prefs(ctx).getString("trip_ref", "").isNullOrEmpty()) return
            try { ctx.startService(Intent(ctx, GpsService::class.java).setAction(ACTION_STOP)) } catch (e: Exception) {}
        }
    }
}
