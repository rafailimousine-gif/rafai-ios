package com.rafailimousine.driver

import android.Manifest
import android.annotation.SuppressLint
import android.content.ActivityNotFoundException
import android.content.ClipboardManager
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Looper
import android.provider.Settings
import android.view.WindowManager
import android.webkit.JavascriptInterface
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.ComponentActivity
import androidx.activity.OnBackPressedCallback
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import androidx.webkit.WebViewCompat
import androidx.webkit.WebViewFeature
import com.google.android.gms.location.LocationCallback
import com.google.android.gms.location.LocationRequest
import com.google.android.gms.location.LocationResult
import com.google.android.gms.location.LocationServices
import com.google.android.gms.location.Priority
import com.google.firebase.messaging.FirebaseMessaging
import org.json.JSONObject

/**
 * RL Driver (Android) : la page chauffeur en plein écran. La page dialogue avec l'appli comme avec l'appli iPhone
 * (window.webkit.messageHandlers.rn → RNA.post) : GPS de la course, position, notifications, coller le lien, liens externes.
 */
class MainActivity : ComponentActivity() {
    private lateinit var web: WebView
    private var ready = false
    private var docStart = false
    private var watchCb: LocationCallback? = null
    private var fileCb: ValueCallback<Array<Uri>>? = null
    private val fused by lazy { LocationServices.getFusedLocationProviderClient(this) }
    private val waitingLoc = mutableListOf<Pair<() -> Unit, () -> Unit>>()

    private val locPerm = registerForActivityResult(ActivityResultContracts.RequestMultiplePermissions()) {
        val ok = hasLocation()
        val w = waitingLoc.toList()
        waitingLoc.clear()
        w.forEach { if (ok) it.first() else it.second() }
    }
    private val notifPerm = registerForActivityResult(ActivityResultContracts.RequestPermission()) {
        DriverApp.prefs(this).edit().putBoolean("notif_asked", true).apply()
        fetchToken()
        sendPushState()
    }
    private val filePick = registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { r ->
        fileCb?.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(r.resultCode, r.data))
        fileCb = null
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        instance = this
        web = WebView(this)
        setContentView(web)
        with(web.settings) {
            javaScriptEnabled = true
            domStorageEnabled = true
            mediaPlaybackRequiresUserGesture = false
            setSupportMultipleWindows(false)
            userAgentString = "$userAgentString RLDriverAndroid/1"
        }
        web.addJavascriptInterface(Bridge(), "RNA")
        if (WebViewFeature.isFeatureSupported(WebViewFeature.DOCUMENT_START_SCRIPT)) {
            WebViewCompat.addDocumentStartJavaScript(web, START_JS, setOf("https://$HOST"))
            docStart = true
        }
        web.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView, req: WebResourceRequest): Boolean = route(req.url)

            override fun onPageStarted(view: WebView, url: String?, favicon: Bitmap?) {
                ready = false
                if (!docStart) view.evaluateJavascript(START_JS, null)
            }

            override fun onReceivedError(view: WebView, req: WebResourceRequest, err: WebResourceError) {
                if (req.isForMainFrame) showOffline()
            }
        }
        web.webChromeClient = object : WebChromeClient() {
            override fun onShowFileChooser(v: WebView, cb: ValueCallback<Array<Uri>>, p: FileChooserParams): Boolean {
                fileCb?.onReceiveValue(null)
                fileCb = cb
                return try { filePick.launch(p.createIntent()); true } catch (e: Exception) { fileCb = null; false }
            }
        }
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (web.canGoBack()) web.goBack() else finish()
            }
        })
        GpsService.listener = { l -> if (DriverApp.foreground) sendLoc(l.latitude, l.longitude, l.accuracy) }
        web.loadUrl(startUrl(intent) ?: HOME)
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        startUrl(intent)?.let { web.loadUrl(it) }
    }

    override fun onResume() {
        super.onResume()
        DriverApp.foreground = true
        if (ready) {
            sendPushState()
            sendBg()
            GpsService.last?.let { sendLoc(it.latitude, it.longitude, it.accuracy) }
        }
    }

    override fun onPause() {
        DriverApp.foreground = false
        super.onPause()
    }

    override fun onDestroy() {
        stopWatch()
        if (instance === this) instance = null
        GpsService.listener = null
        super.onDestroy()
    }

    /** lien personnel (ouvert depuis SMS, WhatsApp, e-mail) ou page d'une notification */
    private fun startUrl(i: Intent?): String? {
        i ?: return null
        i.data?.let { u -> if (u.host == HOST) return u.toString() }
        val s = i.getStringExtra("url")
        if (!s.isNullOrEmpty() && Uri.parse(s).host == HOST) return s
        return null
    }

    /** liens : la page chauffeur reste dans l'appli ; appels, Waze, Plans, WhatsApp et autres sites s'ouvrent à part */
    private fun route(u: Uri): Boolean {
        val scheme = (u.scheme ?: "").lowercase()
        if ((scheme == "https" || scheme == "http") && u.host == HOST) return false
        try {
            val intent = if (scheme == "intent") Intent.parseUri(u.toString(), Intent.URI_INTENT_SCHEME) else Intent(Intent.ACTION_VIEW, u)
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            startActivity(intent)
        } catch (e: ActivityNotFoundException) {
        } catch (e: Exception) {
        }
        return true
    }

    private fun showOffline() {
        val html = """
            <html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head>
            <body style="margin:0;background:#111113;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;text-align:center">
            <div style="padding:28px;max-width:420px">
            <h2 style="margin:0 0 10px">Pas de connexion internet</h2>
            <p style="color:#C9C2B8;margin:0 0 22px">Vos missions s’afficheront dès que le réseau revient. En cas d’urgence, appelez Rafai Limousine.</p>
            <a href="$HOME" style="display:block;background:#C9A063;color:#111113;font-weight:700;padding:16px;border-radius:16px;text-decoration:none;margin-bottom:12px">Réessayer</a>
            <a href="tel:+33667099494" style="display:block;border:1px solid #444;color:#fff;padding:16px;border-radius:16px;text-decoration:none">Appeler Rafai Limousine</a>
            </div></body></html>
        """.trimIndent()
        web.loadDataWithBaseURL("https://$HOST/hors-ligne", html, "text/html", "utf-8", null)
    }

    // ---------------- messages de la page ----------------

    inner class Bridge {
        @JavascriptInterface
        fun post(json: String) {
            runOnUiThread {
                if (Uri.parse(web.url ?: "").host != HOST) return@runOnUiThread
                try { handle(JSONObject(json)) } catch (e: Exception) {}
            }
        }
    }

    private fun handle(m: JSONObject) {
        when (m.optString("t")) {
            "ready" -> {
                ready = true
                sendPushState()
                sendBg()
            }
            "gps" -> {
                val on = m.optBoolean("on")
                val ref = m.optString("ref"); val k = m.optString("k"); val api = m.optString("api")
                if (on && ref.isNotEmpty() && k.isNotEmpty() && api.isNotEmpty()) {
                    withLocation({ GpsService.start(this, ref, k, api) }, {})
                    window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
                } else {
                    GpsService.stop(this)
                    window.clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
                }
            }
            "watch" -> if (m.optBoolean("on")) withLocation({ startWatch() }, {}) else stopWatch()
            "geo" -> {
                val id = m.optInt("id")
                withLocation({ oneShot(id) }, { js("window.RN&&RN.geo($id,false,{code:1})") })
            }
            "push" -> requestPush()
            "settings" -> openNotifSettings()
            "paste" -> {
                val cm = getSystemService(ClipboardManager::class.java)
                val s = try { cm?.primaryClip?.getItemAt(0)?.coerceToText(this)?.toString() ?: "" } catch (e: Exception) { "" }
                js("window.RN&&RN.pasted(${JSONObject.quote(s)})")
            }
            "open" -> {
                val s = m.optString("url")
                if (s.isNotEmpty()) {
                    val u = Uri.parse(s)
                    if (!route(u)) web.loadUrl(s)
                }
            }
        }
    }

    private fun js(code: String) {
        if (::web.isInitialized) web.evaluateJavascript(code, null)
    }

    // ---------------- position ----------------

    private fun hasLocation(): Boolean =
        ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED ||
            ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED

    private fun withLocation(ok: () -> Unit, ko: () -> Unit) {
        if (hasLocation()) { ok(); return }
        waitingLoc.add(ok to ko)
        if (waitingLoc.size == 1) {
            locPerm.launch(arrayOf(Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION))
        }
    }

    @SuppressLint("MissingPermission")
    private fun oneShot(id: Int) {
        try {
            fused.getCurrentLocation(Priority.PRIORITY_HIGH_ACCURACY, null)
                .addOnSuccessListener { l ->
                    if (l != null) js("window.RN&&RN.geo($id,true,${locJson(l.latitude, l.longitude, l.accuracy)})")
                    else js("window.RN&&RN.geo($id,false,{code:2})")
                }
                .addOnFailureListener { js("window.RN&&RN.geo($id,false,{code:2})") }
        } catch (e: SecurityException) {
            js("window.RN&&RN.geo($id,false,{code:1})")
        }
    }

    @SuppressLint("MissingPermission")
    private fun startWatch() {
        if (watchCb != null) return
        val cb = object : LocationCallback() {
            override fun onLocationResult(r: LocationResult) {
                r.lastLocation?.let { sendLoc(it.latitude, it.longitude, it.accuracy) }
            }
        }
        val req = LocationRequest.Builder(Priority.PRIORITY_HIGH_ACCURACY, 5000L).setMinUpdateDistanceMeters(10f).build()
        try {
            fused.requestLocationUpdates(req, cb, Looper.getMainLooper())
            watchCb = cb
        } catch (e: SecurityException) {
        }
    }

    private fun stopWatch() {
        watchCb?.let { try { fused.removeLocationUpdates(it) } catch (e: Exception) {} }
        watchCb = null
    }

    private fun locJson(lat: Double, lng: Double, acc: Float) =
        JSONObject().put("lat", lat).put("lng", lng).put("acc", Math.round(acc.coerceAtLeast(0f))).toString()

    private fun sendLoc(lat: Double, lng: Double, acc: Float) {
        if (ready) js("window.RN&&RN.loc&&RN.loc(${locJson(lat, lng, acc)})")
    }

    /** statut de la course renvoyé par le serveur pendant que l'appli était en arrière-plan */
    private fun sendBg() {
        val s = DriverApp.prefs(this).getString("bg_status", null) ?: return
        js("window.RN&&RN.bg&&RN.bg($s)")
    }

    // ---------------- notifications ----------------

    private fun pushState(): String {
        val enabled = NotificationManagerCompat.from(this).areNotificationsEnabled()
        if (Build.VERSION.SDK_INT >= 33) {
            val granted = ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED
            if (granted && enabled) return "granted"
            return if (DriverApp.prefs(this).getBoolean("notif_asked", false)) "denied" else "default"
        }
        return if (enabled) "granted" else "denied"
    }

    private fun requestPush() {
        if (Build.VERSION.SDK_INT >= 33 &&
            ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED &&
            !DriverApp.prefs(this).getBoolean("notif_asked", false)
        ) {
            notifPerm.launch(Manifest.permission.POST_NOTIFICATIONS)
            return
        }
        if (pushState() == "denied") { openNotifSettings(); return }
        fetchToken()
        sendPushState()
    }

    private fun fetchToken() {
        if (!DriverApp.firebaseReady(this)) return
        try {
            FirebaseMessaging.getInstance().token.addOnSuccessListener { t ->
                if (!t.isNullOrEmpty()) {
                    DriverApp.prefs(this).edit().putString("fcm", t).apply()
                    sendPushState()
                }
            }
        } catch (e: Exception) {
        }
    }

    fun sendPushState() {
        if (!ready) return
        val st = pushState()
        if (st == "granted" && DriverApp.prefs(this).getString("fcm", null) == null) fetchToken()
        val o = JSONObject().put("s", st)
        DriverApp.prefs(this).getString("fcm", null)?.let { if (st == "granted") o.put("tok", it) }
        js("window.RN&&RN.push($o)")
    }

    fun pushReceived() {
        js("window.RN&&RN.pushed&&RN.pushed()")
    }

    private fun openNotifSettings() {
        val i = Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS).putExtra(Settings.EXTRA_APP_PACKAGE, packageName)
        try { startActivity(i) } catch (e: Exception) {
            try { startActivity(Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:$packageName"))) } catch (x: Exception) {}
        }
    }

    companion object {
        const val HOST = "team.rafai-limousine.com"
        const val HOME = "https://team.rafai-limousine.com/chauffeur/"
        @Volatile var instance: MainActivity? = null

        /** injecté au tout début de chaque page : la page sait qu'elle est dans l'appli (comme sur iPhone) */
        const val START_JS = "(function(){if(location.hostname!=='team.rafai-limousine.com')return;window.__rlNative='android';" +
            "try{Object.defineProperty(navigator,'standalone',{get:function(){return true},configurable:true})}catch(e){}" +
            "window.webkit={messageHandlers:{rn:{postMessage:function(m){try{RNA.post(JSON.stringify(m))}catch(e){}}}}};})();"
    }
}
