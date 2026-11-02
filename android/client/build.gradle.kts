// Appli Android Rafai Limousine : Trusted Web Activity du site de réservation (Chrome affiche le site en plein écran,
// avec la connexion Google, les clés d'accès, les notifications et le paiement Stripe du site).
plugins {
    id("com.android.application")
}

val ks = rootProject.file("release.jks")

android {
    namespace = "com.rafailimousine.client"
    compileSdk = 36

    defaultConfig {
        applicationId = "com.rafailimousine.client"
        minSdk = 24
        targetSdk = 36
        versionCode = (System.getenv("VERSION_CODE") ?: "1").toInt()
        versionName = "1.0"
    }

    signingConfigs {
        create("release") {
            if (ks.exists()) {
                storeFile = ks
                storePassword = System.getenv("ANDROID_KEY_PASS")
                keyAlias = System.getenv("ANDROID_KEY_ALIAS") ?: "rafai"
                keyPassword = System.getenv("ANDROID_KEY_PASS")
            }
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            signingConfig = if (ks.exists()) signingConfigs.getByName("release") else signingConfigs.getByName("debug")
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}

dependencies {
    implementation("com.google.androidbrowserhelper:androidbrowserhelper:2.5.0")
}
