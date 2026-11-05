// Appli Android RL Driver : la page chauffeur dans une WebView, avec le GPS de la course en arrière-plan
// (service au premier plan) et les notifications de mission (Firebase Cloud Messaging).
plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}
// fichier de configuration Firebase écrit par la compilation (secret GitHub) ; sans lui, l'appli se compile sans notifications
if (file("google-services.json").exists()) {
    apply(plugin = "com.google.gms.google-services")
}

val ks = rootProject.file("release.jks")

android {
    namespace = "com.rafailimousine.driver"
    compileSdk = 36

    defaultConfig {
        applicationId = "com.rafailimousine.driver"
        minSdk = 26
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

    buildFeatures {
        buildConfig = true
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.13.1")
    implementation("androidx.activity:activity-ktx:1.9.3")
    implementation("androidx.fragment:fragment-ktx:1.8.5")
    implementation("androidx.webkit:webkit:1.12.1")
    implementation("com.google.android.gms:play-services-location:21.3.0")
    implementation(platform("com.google.firebase:firebase-bom:33.5.1"))
    implementation("com.google.firebase:firebase-messaging")
}
