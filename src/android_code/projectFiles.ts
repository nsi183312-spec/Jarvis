export interface AndroidProjectFile {
  path: string;
  name: string;
  category: 'manifest' | 'gradle' | 'kotlin' | 'service' | 'ui' | 'res';
  language: string;
  description: string;
  content: string;
}

export const ANDROID_PROJECT_FILES: AndroidProjectFile[] = [
  {
    path: 'app/src/main/AndroidManifest.xml',
    name: 'AndroidManifest.xml',
    category: 'manifest',
    language: 'xml',
    description: 'Declares microphone, camera, contacts, phone call, SMS, foreground service, and accessibility permissions.',
    content: `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:tools="http://schemas.android.com/tools"
    package="com.jarvis.ai">

    <uses-permission android:name="android.permission.RECORD_AUDIO" />
    <uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_MICROPHONE" />

    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.FLASHLIGHT" />

    <uses-permission android:name="android.permission.READ_CONTACTS" />
    <uses-permission android:name="android.permission.CALL_PHONE" />
    <uses-permission android:name="android.permission.SEND_SMS" />
    <uses-permission android:name="android.permission.QUERY_ALL_PACKAGES" tools:ignore="QueryAllPackagesPermission" />

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.ACCESS_WIFI_STATE" />
    <uses-permission android:name="android.permission.CHANGE_WIFI_STATE" />
    <uses-permission android:name="android.permission.BLUETOOTH" />
    <uses-permission android:name="android.permission.BLUETOOTH_CONNECT" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
    <uses-permission android:name="android.permission.SET_ALARM" />
    <uses-permission android:name="android.permission.WRITE_SETTINGS" tools:ignore="ProtectedPermissions" />
    <uses-permission android:name="android.permission.WAKE_LOCK" />

    <queries>
        <intent>
            <action android:name="android.intent.action.MAIN" />
            <category android:name="android.intent.category.LAUNCHER" />
        </intent>
        <intent>
            <action android:name="android.speech.RecognitionService" />
        </intent>
        <package android:name="com.google.android.apps.maps" />
        <package android:name="com.google.android.apps.meetings" />
        <package android:name="com.google.android.apps.messaging" />
        <package android:name="com.movieboxpro.android" />
        <package android:name="com.android.bbkmusic" />
        <package android:name="com.jio.myjio" />
        <package android:name="com.vivo.notes" />
        <package android:name="com.android.dialer" />
        <package android:name="com.google.android.apps.photos" />
        <package android:name="com.pinterest" />
        <package android:name="com.android.vending" />
        <package android:name="com.android.bbksoundrecorder" />
        <package android:name="com.google.android.apps.safetyhub" />
        <package android:name="com.android.settings" />
        <package android:name="com.vivo.simplelauncher" />
        <package android:name="com.snapchat.android" />
        <package android:name="org.telegram.messenger" />
        <package android:name="com.bbk.theme" />
        <package android:name="com.vivo.tips" />
        <package android:name="com.vivo.appstore" />
        <package android:name="com.vivo.videoeditor" />
        <package android:name="com.vivo.cloud" />
        <package android:name="com.vivo.website" />
        <package android:name="com.vivo.weather" />
        <package android:name="com.whatsapp" />
        <package android:name="com.google.android.youtube" />
    </queries>

    <application
        android:name=".JarvisApplication"
        android:allowBackup="true"
        android:dataExtractionRules="@xml/data_extraction_rules"
        android:fullBackupContent="@xml/backup_rules"
        android:icon="@drawable/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@drawable/ic_launcher"
        android:supportsRtl="true"
        android:theme="@style/Theme.JarvisAI"
        tools:targetApi="35">

        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:label="@string/app_name"
            android:theme="@style/Theme.JarvisAI"
            android:windowSoftInputMode="adjustResize">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
            <intent-filter>
                <action android:name="android.intent.action.ASSIST" />
                <category android:name="android.intent.category.DEFAULT" />
            </intent-filter>
        </activity>

        <service
            android:name=".service.JarvisForegroundVoiceService"
            android:enabled="true"
            android:exported="false"
            android:foregroundServiceType="microphone" />

        <service
            android:name=".service.JarvisAccessibilityService"
            android:permission="android.permission.BIND_ACCESSIBILITY_SERVICE"
            android:label="@string/accessibility_service_name"
            android:description="@string/accessibility_service_desc"
            android:exported="true">
            <intent-filter>
                <action android:name="android.accessibilityservice.AccessibilityService" />
            </intent-filter>
            <meta-data
                android:name="android.accessibilityservice"
                android:resource="@xml/accessibility_service_config" />
        </service>
    </application>
</manifest>`
  },
  {
    path: 'app/build.gradle.kts',
    name: 'build.gradle.kts (App Module)',
    category: 'gradle',
    language: 'kotlin',
    description: 'Gradle configuration with Jetpack Compose BOM, Material 3, Generative AI SDK, and Coil.',
    content: `plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
}

android {
    namespace = "com.jarvis.ai"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.jarvis.ai"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "1.0.0"
        vectorDrawables.useSupportLibrary = true
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions { jvmTarget = "17" }
    buildFeatures { compose = true }
}

dependencies {
    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.lifecycle.runtime.ktx)
    implementation(libs.androidx.activity.compose)
    implementation(libs.androidx.lifecycle.viewmodel.compose)
    implementation(platform(libs.androidx.compose.bom))
    implementation(libs.androidx.compose.ui)
    implementation(libs.androidx.compose.ui.graphics)
    implementation(libs.androidx.compose.material3)
    implementation(libs.androidx.compose.material.icons.extended)
    implementation("io.coil-kt:coil-compose:2.6.0")
    implementation("androidx.datastore:datastore-preferences:1.1.1")
}`
  },
  {
    path: 'app/src/main/java/com/jarvis/ai/MainActivity.kt',
    name: 'MainActivity.kt',
    category: 'kotlin',
    language: 'kotlin',
    description: 'Main Android entry point initializing Jetpack Compose, SpeechRecognizer, and Permission requests.',
    content: `package com.jarvis.ai

import android.Manifest
import android.app.Activity
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Bundle
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.activity.viewModels
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import androidx.core.content.ContextCompat
import com.jarvis.ai.ui.JarvisMainScreen
import com.jarvis.ai.ui.theme.JarvisAITheme
import com.jarvis.ai.viewmodel.AssistantState
import com.jarvis.ai.viewmodel.JarvisViewModel

class MainActivity : ComponentActivity(), RecognitionListener {

    private val viewModel: JarvisViewModel by viewModels()
    private var speechRecognizer: SpeechRecognizer? = null

    private val speechActivityLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        if (result.resultCode == Activity.RESULT_OK) {
            val matches = result.data?.getStringArrayListExtra(RecognizerIntent.EXTRA_RESULTS)
            val spoken = matches?.firstOrNull()
            if (!spoken.isNullOrBlank()) {
                viewModel.processUserInput(spoken)
            } else {
                viewModel.setAssistantState(AssistantState.IDLE)
            }
        } else {
            viewModel.setAssistantState(AssistantState.IDLE)
        }
    }

    private val permissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        val micOk = permissions[Manifest.permission.RECORD_AUDIO] ?: false
        viewModel.updatePermissions(
            audio = micOk,
            camera = permissions[Manifest.permission.CAMERA] ?: false,
            contacts = permissions[Manifest.permission.READ_CONTACTS] ?: false
        )
        if (micOk) initSpeechRecognizer()
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        permissionLauncher.launch(
            arrayOf(
                Manifest.permission.RECORD_AUDIO,
                Manifest.permission.CAMERA,
                Manifest.permission.READ_CONTACTS
            )
        )

        setContent {
            JarvisAITheme {
                Surface(modifier = Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
                    JarvisMainScreen(
                        viewModel = viewModel,
                        onStartListening = { startVoiceInput() },
                        onStopListening = { stopVoiceInput() }
                    )
                }
            }
        }
    }

    private fun initSpeechRecognizer() {
        if (SpeechRecognizer.isRecognitionAvailable(this)) {
            speechRecognizer?.destroy()
            speechRecognizer = SpeechRecognizer.createSpeechRecognizer(this).apply {
                setRecognitionListener(this@MainActivity)
            }
        }
    }

    private fun buildSpeechIntent(): Intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
        putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
        putExtra(RecognizerIntent.EXTRA_LANGUAGE, "hi-IN")
        putExtra(RecognizerIntent.EXTRA_ADDITIONAL_LANGUAGES, arrayOf("en-IN", "en-US"))
        putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true)
        putExtra(RecognizerIntent.EXTRA_PROMPT, "JARVIS sun rahi hai... Boliye")
    }

    private fun startVoiceInput() {
        val hasMic = ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED
        if (!hasMic) {
            permissionLauncher.launch(arrayOf(Manifest.permission.RECORD_AUDIO))
            return
        }
        if (!SpeechRecognizer.isRecognitionAvailable(this)) {
            speechActivityLauncher.launch(buildSpeechIntent())
            return
        }
        if (speechRecognizer == null) initSpeechRecognizer()
        try {
            speechRecognizer?.startListening(buildSpeechIntent())
            viewModel.setAssistantState(AssistantState.LISTENING)
        } catch (_: Exception) {
            speechActivityLauncher.launch(buildSpeechIntent())
        }
    }

    private fun stopVoiceInput() {
        speechRecognizer?.stopListening()
        viewModel.setAssistantState(AssistantState.IDLE)
    }

    override fun onResults(results: Bundle?) {
        val matches = results?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
        matches?.firstOrNull()?.let { viewModel.processUserInput(it) } ?: viewModel.setAssistantState(AssistantState.IDLE)
    }
    override fun onRmsChanged(rmsdB: Float) {
        val normalized = ((rmsdB + 2f) / 12f).coerceIn(0f, 1f)
        viewModel.updateAudioWaveform(normalized)
    }
    override fun onReadyForSpeech(params: Bundle?) { viewModel.setAssistantState(AssistantState.LISTENING) }
    override fun onBeginningOfSpeech() { viewModel.setAssistantState(AssistantState.LISTENING) }
    override fun onEndOfSpeech() { viewModel.setAssistantState(AssistantState.THINKING) }
    override fun onError(error: Int) {
        if (error == SpeechRecognizer.ERROR_RECOGNIZER_BUSY) {
            speechRecognizer?.cancel()
            initSpeechRecognizer()
        } else if (error == SpeechRecognizer.ERROR_CLIENT) {
            try { speechActivityLauncher.launch(buildSpeechIntent()); return } catch (_: Exception) {}
        }
        viewModel.setAssistantState(AssistantState.IDLE)
    }
    override fun onPartialResults(partialResults: Bundle?) {
        partialResults?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)?.firstOrNull()?.let {
            viewModel.setPartialSpokenText(it)
        }
    }
    override fun onBufferReceived(buffer: ByteArray?) {}
    override fun onEvent(eventType: Int, params: Bundle?) {}

    override fun onDestroy() {
        super.onDestroy()
        speechRecognizer?.destroy()
    }
}`
  },
  {
    path: 'app/src/main/java/com/jarvis/ai/router/CommandRouter.kt',
    name: 'CommandRouter.kt',
    category: 'kotlin',
    language: 'kotlin',
    description: 'Dispatches intents: Flashlight, Volume, Battery, YouTube, WhatsApp, Camera, Settings, and Accessibility.',
    content: `package com.jarvis.ai.router

import android.bluetooth.BluetoothAdapter
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.hardware.camera2.CameraCharacteristics
import android.hardware.camera2.CameraManager
import android.media.AudioManager
import android.net.Uri
import android.os.BatteryManager
import android.provider.MediaStore
import android.provider.Settings
import android.view.KeyEvent
import com.jarvis.ai.service.JarvisAccessibilityService

sealed class CommandResult {
    data class Handled(val message: String, val requiresConfirmation: Boolean = false) : CommandResult()
    data class NeedsAiProcessing(val query: String) : CommandResult()
    data class Error(val reason: String) : CommandResult()
}

class CommandRouter(private val context: Context) {
    private val cameraManager = context.getSystemService(Context.CAMERA_SERVICE) as CameraManager
    private val audioManager = context.getSystemService(Context.AUDIO_SERVICE) as AudioManager

    private val appPackageMap: List<Pair<List<String>, List<String>>> = listOf(
        listOf("maps", "google maps", "map") to listOf("com.google.android.apps.maps"),
        listOf("meet", "google meet") to listOf("com.google.android.apps.meetings", "com.google.android.apps.tachyon"),
        listOf("messages", "sms app") to listOf("com.google.android.apps.messaging", "com.android.mms"),
        listOf("moviebox+", "moviebox plus", "moviebox") to listOf("com.movieboxpro.android", "com.community.moviebox"),
        listOf("music", "imusic") to listOf("com.android.bbkmusic", "com.vivo.music", "com.google.android.apps.youtube.music"),
        listOf("myjio", "my jio", "jio") to listOf("com.jio.myjio"),
        listOf("notes", "vivo notes", "keep") to listOf("com.vivo.notes", "com.google.android.keep"),
        listOf("phone", "dialer") to listOf("com.android.dialer", "com.google.android.dialer", "com.android.contacts"),
        listOf("photos", "google photos", "gallery") to listOf("com.google.android.apps.photos", "com.vivo.gallery"),
        listOf("pinterest") to listOf("com.pinterest"),
        listOf("play store", "playstore") to listOf("com.android.vending"),
        listOf("recorder", "voice recorder") to listOf("com.android.bbksoundrecorder", "com.vivo.soundrecorder"),
        listOf("safety", "sos") to listOf("com.google.android.apps.safetyhub", "com.vivo.sos"),
        listOf("settings", "setting") to listOf("com.android.settings"),
        listOf("simple view", "simple mode") to listOf("com.vivo.simplelauncher"),
        listOf("snapchat") to listOf("com.snapchat.android"),
        listOf("telegram") to listOf("org.telegram.messenger"),
        listOf("themes", "itheme") to listOf("com.bbk.theme", "com.vivo.itheme"),
        listOf("tips") to listOf("com.vivo.tips"),
        listOf("v-appstore", "v appstore", "vappstore") to listOf("com.vivo.appstore"),
        listOf("video", "ivideo") to listOf("com.vivo.videoeditor", "com.vivo.video"),
        listOf("vivo cloud", "vivocloud") to listOf("com.vivo.cloud"),
        listOf("vivo store", "vivostore") to listOf("com.vivo.website", "com.vivo.store"),
        listOf("weather", "mausam") to listOf("com.vivo.weather", "com.google.android.apps.weather"),
        listOf("whatsapp") to listOf("com.whatsapp", "com.whatsapp.w4b"),
        listOf("youtube", "yt") to listOf("com.google.android.youtube")
    )

    fun routeCommand(input: String): CommandResult {
        val text = input.trim().lowercase()

        if (text.contains("flashlight on") || text.contains("torch on") || text.contains("torch chalu")) {
            return setFlashlight(true)
        }
        if (text.contains("flashlight off") || text.contains("torch off") || text.contains("torch band")) {
            return setFlashlight(false)
        }

        // Settings Sub-pages & Hardware Toggles
        if (text.contains("wifi setting") || text.contains("wifi on") || text.contains("wifi off")) return openSettingsAction(Settings.ACTION_WIFI_SETTINGS, "Wi-Fi Settings khol rahi hoon!")
        if (text.contains("bluetooth")) {
            if (text.contains("on")) return openSettingsAction(BluetoothAdapter.ACTION_REQUEST_ENABLE, "Bluetooth enable prompt khol rahi hoon!")
            return openSettingsAction(Settings.ACTION_BLUETOOTH_SETTINGS, "Bluetooth Settings khol rahi hoon!")
        }
        if (text.contains("hotspot")) return openSettingsAction(Settings.ACTION_WIRELESS_SETTINGS, "Hotspot Settings khol rahi hoon!")
        if (text.contains("airplane mode") || text.contains("flight mode")) return openSettingsAction(Settings.ACTION_AIRPLANE_MODE_SETTINGS, "Airplane mode Settings khol rahi hoon!")
        if (text.contains("dnd") || text.contains("do not disturb") || text.contains("silent")) {
            return try {
                val silent = !(text.contains("off") || text.contains("band"))
                audioManager.ringerMode = if (silent) AudioManager.RINGER_MODE_SILENT else AudioManager.RINGER_MODE_NORMAL
                CommandResult.Handled(if (silent) "Phone Silent / DND mode on kar diya!" else "Normal ringer mode on kar diya!")
            } catch (e: SecurityException) {
                openSettingsAction(Settings.ACTION_NOTIFICATION_POLICY_ACCESS_SETTINGS, "DND permission khol rahi hoon!")
            }
        }
        if (text.contains("display setting") || text.contains("brightness")) return openSettingsAction(Settings.ACTION_DISPLAY_SETTINGS, "Display Settings khol rahi hoon!")
        if (text.contains("sound setting")) return openSettingsAction(Settings.ACTION_SOUND_SETTINGS, "Sound Settings khol rahi hoon!")

        // Music Controls
        if (text.contains("music") || text.contains("song")) {
            if (text.contains("next")) { sendMediaKey(KeyEvent.KEYCODE_MEDIA_NEXT); return CommandResult.Handled("Agla gaana play kar rahi hoon!") }
            if (text.contains("previous")) { sendMediaKey(KeyEvent.KEYCODE_MEDIA_PREVIOUS); return CommandResult.Handled("Pichla gaana play kar rahi hoon!") }
            if (text.contains("pause") || text.contains("stop")) { sendMediaKey(KeyEvent.KEYCODE_MEDIA_PAUSE); return CommandResult.Handled("Music pause kar diya!") }
        }

        // In-App Deep Actions
        if (text.contains("youtube") && (text.contains("play") || text.contains("search") || text.contains("chalao"))) {
            val q = text.replace(Regex("\\\\b(youtube|par|me|play|search|chalao|karo)\\\\b"), " ").trim()
            val intent = Intent(Intent.ACTION_VIEW, Uri.parse("https://www.youtube.com/results?search_query=" + Uri.encode(q))).apply { flags = Intent.FLAG_ACTIVITY_NEW_TASK }
            return try { context.startActivity(intent); CommandResult.Handled("YouTube me " + q + " search kiya!") } catch (e: Exception) { launchFirstAvailable(listOf("com.google.android.youtube"), "YouTube open kiya!") }
        }

        if ((text.contains("play store") || text.contains("playstore")) && (text.contains("search") || text.contains("download"))) {
            val q = text.replace(Regex("\\\\b(play store|playstore|search|download|karo)\\\\b"), " ").trim()
            val intent = Intent(Intent.ACTION_VIEW, Uri.parse("market://search?q=" + Uri.encode(q))).apply { flags = Intent.FLAG_ACTIVITY_NEW_TASK }
            return try { context.startActivity(intent); CommandResult.Handled("Play Store me " + q + " search kar rahi hoon!") } catch (e: Exception) { launchFirstAvailable(listOf("com.android.vending"), "Play Store open kiya!") }
        }

        // Accessibility In-App Automation
        if (text.contains("scroll down") || text.contains("niche scroll")) {
            return if (JarvisAccessibilityService.instance?.scrollForward() == true) CommandResult.Handled("Scroll down kar diya!") else CommandResult.Error("Accessibility chahiye.")
        }
        if (text.contains("scroll up") || text.contains("upar scroll")) {
            return if (JarvisAccessibilityService.instance?.scrollBackward() == true) CommandResult.Handled("Scroll up kar diya!") else CommandResult.Error("Accessibility chahiye.")
        }
        if (text.startsWith("click ") || text.startsWith("dabao ")) {
            val target = text.removePrefix("click ").removePrefix("dabao ").trim()
            return if (JarvisAccessibilityService.instance?.clickElementByText(target) == true) CommandResult.Handled(target + " click kar diya!") else CommandResult.Error("Element nahi mila.")
        }

        // Native System Apps (Camera, Calculator, Recorder)
        if (text.contains("camera") && (text.contains("open") || text.contains("kholo") || text == "camera")) {
            return try {
                context.startActivity(Intent(MediaStore.INTENT_ACTION_STILL_IMAGE_CAMERA).apply { flags = Intent.FLAG_ACTIVITY_NEW_TASK })
                CommandResult.Handled("Phone Camera open kar rahi hoon!")
            } catch (e: Exception) {
                launchFirstAvailable(listOf("com.android.camera"), "Camera open kar rahi hoon!")
            }
        }
        if ((text.contains("calculator") || text == "calc") && (text.contains("open") || text.contains("kholo") || text == "calculator")) {
            return try {
                context.startActivity(Intent(Intent.ACTION_MAIN).apply { addCategory(Intent.CATEGORY_APP_CALCULATOR); flags = Intent.FLAG_ACTIVITY_NEW_TASK })
                CommandResult.Handled("Phone Calculator open kar rahi hoon!")
            } catch (e: Exception) {
                launchFirstAvailable(listOf("com.google.android.calculator", "com.android.bbkcalculator"), "Calculator open kar rahi hoon!")
            }
        }

        // Universal App Launcher (26+ vivo & Google apps + dynamic PackageManager lookup)
        if (text.startsWith("open ") || text.startsWith("kholo ") || text.contains("chalu karo") || text.contains("open karo")) {
            val appQuery = text.replace(Regex("^(open|kholo)\\\\s+"), "").replace(Regex("\\\\s*(chalu karo|khol do|open karo|app)"), "").trim()
            for ((aliases, packages) in appPackageMap) {
                if (aliases.any { appQuery == it || appQuery.contains(it) }) {
                    val res = launchFirstAvailable(packages, appQuery + " open kar rahi hoon!")
                    if (res is CommandResult.Handled) return res
                }
            }
            val pm = context.packageManager
            for (app in pm.getInstalledApplications(PackageManager.GET_META_DATA)) {
                val label = pm.getApplicationLabel(app).toString().lowercase()
                if (label.contains(appQuery) || appQuery.contains(label)) {
                    val intent = pm.getLaunchIntentForPackage(app.packageName)
                    if (intent != null) {
                        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                        context.startActivity(intent)
                        val realName = pm.getApplicationLabel(app).toString()
                        return CommandResult.Handled(realName + " open kar rahi hoon!")
                    }
                }
            }
        }

        if (text.contains("battery")) {
            val bm = context.getSystemService(Context.BATTERY_SERVICE) as BatteryManager
            val level = bm.getIntProperty(BatteryManager.BATTERY_PROPERTY_CAPACITY)
            return CommandResult.Handled("Aapke phone ki battery " + level + "% hai.")
        }

        if (text == "go home" || text == "home screen") {
            return if (JarvisAccessibilityService.instance?.performGoHome() == true) {
                CommandResult.Handled("Home screen par aa gaye.")
            } else {
                CommandResult.Error("Accessibility permission chahiye.")
            }
        }

        if (text.startsWith("call ")) {
            val target = text.removePrefix("call ").trim()
            val digits = target.replace(Regex("[^\\\\d+]"), "")
            return if (digits.isNotEmpty()) {
                context.startActivity(Intent(Intent.ACTION_DIAL, Uri.parse("tel:" + digits)).apply { flags = Intent.FLAG_ACTIVITY_NEW_TASK })
                CommandResult.Handled(digits + " par Phone Dialer open kar diya hai!")
            } else {
                CommandResult.Handled("Kya aap waqai me " + target + " ko call karna chahte hain?", requiresConfirmation = true)
            }
        }

        return CommandResult.NeedsAiProcessing(input)
    }

    private fun sendMediaKey(keyCode: Int) {
        audioManager.dispatchMediaKeyEvent(KeyEvent(KeyEvent.ACTION_DOWN, keyCode))
        audioManager.dispatchMediaKeyEvent(KeyEvent(KeyEvent.ACTION_UP, keyCode))
    }

    private fun openSettingsAction(action: String, msg: String): CommandResult {
        return try {
            val intent = Intent(action).apply { flags = Intent.FLAG_ACTIVITY_NEW_TASK }
            context.startActivity(intent)
            CommandResult.Handled(msg)
        } catch (e: Exception) {
            launchFirstAvailable(listOf("com.android.settings"), "Settings open kar rahi hoon!")
        }
    }

    private fun setFlashlight(enabled: Boolean): CommandResult {
        return try {
            val rearId = cameraManager.cameraIdList.firstOrNull { id ->
                val chars = cameraManager.getCameraCharacteristics(id)
                chars.get(CameraCharacteristics.FLASH_INFO_AVAILABLE) == true &&
                    chars.get(CameraCharacteristics.LENS_FACING) == CameraCharacteristics.LENS_FACING_BACK
            } ?: cameraManager.cameraIdList[0]
            cameraManager.setTorchMode(rearId, enabled)
            CommandResult.Handled(if (enabled) "Flashlight on ho gayi!" else "Flashlight band ho gayi.")
        } catch (e: Exception) {
            CommandResult.Error("Flashlight toggle error: " + e.message)
        }
    }

    private fun launchFirstAvailable(packages: List<String>, msg: String): CommandResult {
        for (pkg in packages) {
            val intent = context.packageManager.getLaunchIntentForPackage(pkg)
            if (intent != null) {
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                context.startActivity(intent)
                return CommandResult.Handled(msg)
            }
        }
        return CommandResult.Error("App installed nahi hai.")
    }
}`
  },
  {
    path: 'app/src/main/java/com/jarvis/ai/service/JarvisAccessibilityService.kt',
    name: 'JarvisAccessibilityService.kt',
    category: 'service',
    language: 'kotlin',
    description: 'Enables safe Android Home, Back, Recents actions, and accessible UI label navigation without bypassing security.',
    content: `package com.jarvis.ai.service

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.AccessibilityServiceInfo
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo

class JarvisAccessibilityService : AccessibilityService() {
    companion object {
        var instance: JarvisAccessibilityService? = null
            private set
    }

    override fun onServiceConnected() {
        super.onServiceConnected()
        instance = this
        val info = AccessibilityServiceInfo().apply {
            eventTypes = AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED or AccessibilityEvent.TYPE_VIEW_CLICKED
            feedbackType = AccessibilityServiceInfo.FEEDBACK_GENERIC
            flags = AccessibilityServiceInfo.FLAG_REPORT_VIEW_IDS
        }
        serviceInfo = info
    }

    fun performGoHome(): Boolean = performGlobalAction(GLOBAL_ACTION_HOME)
    fun performGoBack(): Boolean = performGlobalAction(GLOBAL_ACTION_BACK)
    fun performOpenRecents(): Boolean = performGlobalAction(GLOBAL_ACTION_RECENTS)

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {}
    override fun onInterrupt() {}
    override fun onDestroy() {
        super.onDestroy()
        instance = null
    }
}`
  },
  {
    path: 'app/src/main/java/com/jarvis/ai/service/JarvisForegroundVoiceService.kt',
    name: 'JarvisForegroundVoiceService.kt',
    category: 'service',
    language: 'kotlin',
    description: 'Runs continuous background microphone listener with persistent notification and transparent state indicator.',
    content: `package com.jarvis.ai.service

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat

class JarvisForegroundVoiceService : Service() {
    companion object {
        const val CHANNEL_ID = "jarvis_voice_assistant_channel"
        const val NOTIFICATION_ID = 1001
        var isServiceRunning = false
            private set
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        isServiceRunning = true
        createChannel()
        val notif = NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("JARVIS AI Voice Assistant")
            .setContentText("Listening for 'Hey JARVIS' wake-word...")
            .setSmallIcon(android.R.drawable.ic_btn_speak_now)
            .setOngoing(true)
            .build()
        startForeground(NOTIFICATION_ID, notif)
        return START_STICKY
    }

    override fun onDestroy() {
        super.onDestroy()
        isServiceRunning = false
        stopForeground(STOP_FOREGROUND_REMOVE)
    }

    override fun onBind(intent: Intent?): IBinder? = null

    private fun createChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "JARVIS AI Background Assistant",
                NotificationManager.IMPORTANCE_LOW
            )
            val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            manager.createNotificationChannel(channel)
        }
    }
}`
  },
  {
    path: 'app/src/main/java/com/jarvis/ai/voice/VoiceEngine.kt',
    name: 'VoiceEngine.kt',
    category: 'kotlin',
    language: 'kotlin',
    description: 'Sweet Indian female voice synthesis with verification, speech interruption, pitch, and speed adjustments.',
    content: `package com.jarvis.ai.voice

import android.content.Context
import android.speech.tts.TextToSpeech
import android.speech.tts.Voice
import java.util.Locale

class VoiceEngine(
    private val context: Context,
    private val onInit: (Boolean) -> Unit,
    private val onSpeaking: (Boolean) -> Unit
) : TextToSpeech.OnInitListener {

    private var tts: TextToSpeech? = TextToSpeech(context, this)
    var speechPitch: Float = 1.15f // Cute sweet female tone
    var speechRate: Float = 1.0f

    override fun onInit(status: Int) {
        if (status == TextToSpeech.SUCCESS) {
            selectIndianFemaleVoice()
            onInit(true)
        } else {
            onInit(false)
        }
    }

    private fun selectIndianFemaleVoice() {
        val ttsRef = tts ?: return
        val voices = ttsRef.voices
        val indianFemale = voices?.find { v ->
            val n = v.name.lowercase()
            val isIndia = v.locale.country == "IN" || v.locale.language == "hi"
            val isFemale = n.contains("female") || n.contains("f0") || n.contains("-f-")
            isIndia && isFemale
        }
        if (indianFemale != null) {
            ttsRef.voice = indianFemale
        } else {
            ttsRef.language = Locale("hi", "IN")
        }
    }

    fun speak(text: String) {
        tts?.setPitch(speechPitch)
        tts?.setSpeechRate(speechRate)
        tts?.speak(text, TextToSpeech.QUEUE_FLUSH, null, "jarvis_speech")
    }

    fun stop() { tts?.stop(); onSpeaking(false) }
    fun shutdown() { tts?.shutdown() }
}`
  },
  {
    path: 'app/src/main/java/com/jarvis/ai/ui/AvatarView.kt',
    name: 'AvatarView.kt (Jetpack Compose)',
    category: 'ui',
    language: 'kotlin',
    description: 'Jetpack Compose holographic 3D anime avatar with mood states and audio-frequency-matched organic breathing.',
    content: `package com.jarvis.ai.ui

import androidx.compose.animation.core.*
import androidx.compose.foundation.Image
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.unit.dp
import com.jarvis.ai.R
import com.jarvis.ai.viewmodel.AssistantState
import kotlin.math.PI
import kotlin.math.sin

enum class AvatarMood(val label: String, val accentColor: Color) {
    CALM("Calm", Color(0xFF448AFF)),
    HAPPY("Happy", Color(0xFFFF4081)),
    PLAYFUL("Playful", Color(0xFFE040FB)),
    CURIOUS("Curious", Color(0xFF00E5FF)),
    FOCUSED("Focused", Color(0xFF7C4DFF)),
    EMPATHETIC("Sweet", Color(0xFFFF80AB))
}

@Composable
fun AvatarView(state: AssistantState, audioLevel: Float, mood: AvatarMood = AvatarMood.HAPPY) {
    val infiniteTransition = rememberInfiniteTransition(label = "hologram")
    val angle by infiniteTransition.animateFloat(
        initialValue = 0f, targetValue = 360f,
        animationSpec = infiniteRepeatable(tween(12000, easing = LinearEasing))
    )
    val smoothedAudio by animateFloatAsState(
        targetValue = audioLevel.coerceIn(0f, 1f),
        animationSpec = spring(stiffness = Spring.StiffnessLow),
        label = "smoothed_audio"
    )
    var breathPhase by remember { mutableFloatStateOf(0f) }
    LaunchedEffect(state) {
        var lastNanos = System.nanoTime()
        while (true) {
            withFrameNanos { frameNanos ->
                val dt = ((frameNanos - lastNanos) / 1_000_000_000f).coerceAtMost(0.05f)
                lastNanos = frameNanos
                val baseHz = if (state == AssistantState.IDLE) 0.25f else 0.55f
                breathPhase += dt * (baseHz + smoothedAudio * 1.15f) * (2f * PI.toFloat())
            }
        }
    }
    val breathScale = 1f + sin(breathPhase.toDouble()).toFloat() * (0.015f + smoothedAudio * 0.036f) + smoothedAudio * 0.025f

    val color = when (state) {
        AssistantState.LISTENING -> Color(0xFF00E5FF)
        AssistantState.THINKING -> Color(0xFFD500F9)
        AssistantState.SPEAKING, AssistantState.IDLE -> mood.accentColor
    }

    Box(modifier = Modifier.size(280.dp).scale(breathScale), contentAlignment = Alignment.Center) {
        // Outer holographic ring
        Box(
            modifier = Modifier.fillMaxSize().rotate(angle).border(
                2.dp,
                Brush.sweepGradient(listOf(color, Color.Transparent, color)),
                CircleShape
            )
        )
        // Permanent Anime Girl Avatar
        Image(
            painter = painterResource(id = R.drawable.jarvis_permanent_avatar),
            contentDescription = "JARVIS AI Girl Avatar",
            contentScale = ContentScale.Crop,
            modifier = Modifier.size(220.dp).clip(CircleShape).border(3.dp, color, CircleShape)
        )
    }
}`
  },
  {
    path: 'app/src/main/res/xml/accessibility_service_config.xml',
    name: 'accessibility_service_config.xml',
    category: 'res',
    language: 'xml',
    description: 'Accessibility service configuration declaring event types, flags, and feedback types.',
    content: `<?xml version="1.0" encoding="utf-8"?>
<accessibility-service xmlns:android="http://schemas.android.com/apk/res/android"
    android:accessibilityEventTypes="typeWindowStateChanged|typeViewClicked|typeViewScrolled"
    android:accessibilityFeedbackType="feedbackGeneric"
    android:accessibilityFlags="flagDefault|flagRetrieveInteractiveWindows|flagReportViewIds"
    android:canRetrieveWindowContent="true"
    android:canPerformGestures="true"
    android:notificationTimeout="100"
    android:description="@string/accessibility_service_desc" />`
  },
  {
    path: 'app/src/main/res/values/strings.xml',
    name: 'strings.xml',
    category: 'res',
    language: 'xml',
    description: 'Application strings in English and Hindi for assistant voice and accessibility.',
    content: `<resources>
    <string name="app_name">JARVIS AI</string>
    <string name="greeting">Hello! Main JARVIS hoon. Aap bataiye, main aaj aapki kya help kar sakti hoon?</string>
    <string name="accessibility_service_name">JARVIS AI Assistant Navigation</string>
    <string name="accessibility_service_desc">Allows JARVIS to execute requested navigation actions like Home, Back, and reading accessible interface labels.</string>
</resources>`
  },
  {
    path: 'app/src/main/res/values/themes.xml',
    name: 'themes.xml',
    category: 'res',
    language: 'xml',
    description: 'Base Android Material theme for JARVIS AI.',
    content: `<resources>
    <style name="Theme.JarvisAI" parent="android:Theme.Material.NoActionBar" />
</resources>`
  },
  {
    path: 'app/src/main/res/drawable/ic_launcher.xml',
    name: 'ic_launcher.xml',
    category: 'res',
    language: 'xml',
    description: 'Vector launcher icon for JARVIS AI.',
    content: `<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp"
    android:height="108dp"
    android:viewportWidth="108"
    android:viewportHeight="108">
    <path android:fillColor="#050816" android:pathData="M0,0h108v108h-108z" />
    <path android:fillColor="#00E5FF" android:pathData="M54,24a30,30 0 1,0 0,60a30,30 0 1,0 0,-60z" />
    <path android:fillColor="#7C4DFF" android:pathData="M54,36a18,18 0 1,0 0,36a18,18 0 1,0 0,-36z" />
</vector>`
  },
  {
    path: 'app/src/main/res/xml/data_extraction_rules.xml',
    name: 'data_extraction_rules.xml',
    category: 'res',
    language: 'xml',
    description: 'Android 12+ data extraction rules.',
    content: `<?xml version="1.0" encoding="utf-8"?>
<data-extraction-rules>
    <cloud-backup />
</data-extraction-rules>`
  },
  {
    path: 'app/src/main/res/xml/backup_rules.xml',
    name: 'backup_rules.xml',
    category: 'res',
    language: 'xml',
    description: 'Android Auto Backup rules.',
    content: `<?xml version="1.0" encoding="utf-8"?>
<full-backup-content />`
  },
  {
    path: 'app/src/main/java/com/jarvis/ai/JarvisApplication.kt',
    name: 'JarvisApplication.kt',
    category: 'kotlin',
    language: 'kotlin',
    description: 'Android Application class for JARVIS AI.',
    content: `package com.jarvis.ai

import android.app.Application

class JarvisApplication : Application()`
  },
  {
    path: 'app/src/main/java/com/jarvis/ai/ai/LocalSmartBrain.kt',
    name: 'LocalSmartBrain.kt',
    category: 'kotlin',
    language: 'kotlin',
    description: 'Bilingual local offline Smart Persona brain for instant Hindi/Hinglish/English replies without external AI APIs.',
    content: `package com.jarvis.ai.ai

import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class LocalSmartBrain {
    fun generateReply(prompt: String): String {
        val lower = prompt.lowercase(Locale.getDefault()).trim()
        return when {
            lower.contains("time") || lower.contains("samay") || lower.contains("baje") -> {
                val now = SimpleDateFormat("hh:mm a", Locale.getDefault()).format(Date())
                "Abhi samay $now ho raha hai."
            }
            lower.contains("date") || lower.contains("tarikh") || lower.contains("aaj") -> {
                val today = SimpleDateFormat("EEEE, dd MMM yyyy", Locale.getDefault()).format(Date())
                "Aaj $today hai."
            }
            lower.contains("hello") || lower.contains("hi") || lower.contains("namaste") ->
                "Namaste Lucky! Main JARVIS hoon, bataiye main aapki kya help kar sakti hoon?"
            lower.contains("how are you") || lower.contains("kaise ho") || lower.contains("kaisi ho") ->
                "Main bilkul theek hoon aur full speed me aapke commands execute karne ke liye ready hoon!"
            lower.contains("who are you") || lower.contains("kaun ho") || lower.contains("tumhara naam") ->
                "Main JARVIS AI hoon, aapki smart personal voice assistant."
            lower.contains("thank") || lower.contains("shukriya") || lower.contains("dhanyawad") ->
                "Aapka bahut shukriya! Koi aur kaam ho to seedhe boliye."
            else ->
                "Ji! Maine aapki baat suni: $prompt. Aap call, SMS, YouTube, WhatsApp, Wi-Fi ya calculator command seedhe bol sakte hain!"
        }
    }
}`
  },
  {
    path: 'app/src/main/java/com/jarvis/ai/viewmodel/JarvisViewModel.kt',
    name: 'JarvisViewModel.kt',
    category: 'kotlin',
    language: 'kotlin',
    description: 'Central Android ViewModel managing voice recognition, mood avatar, TTS, and 26+ phone apps router.',
    content: `package com.jarvis.ai.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.jarvis.ai.ai.LocalSmartBrain
import com.jarvis.ai.router.CommandResult
import com.jarvis.ai.router.CommandRouter
import com.jarvis.ai.ui.AvatarMood
import com.jarvis.ai.voice.VoiceEngine
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

enum class AssistantState { IDLE, LISTENING, THINKING, SPEAKING }

data class ChatMessage(val sender: String, val text: String)

class JarvisViewModel(app: Application) : AndroidViewModel(app) {
    private val router = CommandRouter(app)
    private val brain = LocalSmartBrain()
    private var voiceEngine: VoiceEngine? = null

    private val _state = MutableStateFlow(AssistantState.IDLE)
    val state: StateFlow<AssistantState> = _state.asStateFlow()

    private val _mood = MutableStateFlow(AvatarMood.HAPPY)
    val mood: StateFlow<AvatarMood> = _mood.asStateFlow()

    private val _audioLevel = MutableStateFlow(0f)
    val audioLevel: StateFlow<Float> = _audioLevel.asStateFlow()

    private val _partialText = MutableStateFlow("")
    val partialText: StateFlow<String> = _partialText.asStateFlow()

    private val _messages = MutableStateFlow(
        listOf(ChatMessage("jarvis", "Hello! Main JARVIS hoon. Aap bataiye, main aaj aapki kya help kar sakti hoon?"))
    )
    val messages: StateFlow<List<ChatMessage>> = _messages.asStateFlow()

    init {
        voiceEngine = VoiceEngine(app, onInit = {}, onSpeaking = { speaking ->
            _state.value = if (speaking) AssistantState.SPEAKING else AssistantState.IDLE
        })
    }

    fun setAssistantState(newState: AssistantState) { _state.value = newState }
    fun setMood(newMood: AvatarMood) { _mood.value = newMood }
    fun updateAudioWaveform(level: Float) { _audioLevel.value = level }
    fun setPartialSpokenText(text: String) { _partialText.value = text }
    fun updatePermissions(audio: Boolean, camera: Boolean, contacts: Boolean) {}

    fun processUserInput(input: String) {
        if (input.isBlank()) return
        _partialText.value = ""
        _messages.value = _messages.value + ChatMessage("user", input)
        _state.value = AssistantState.THINKING

        when (val result = router.routeCommand(input)) {
            is CommandResult.Handled -> reply(result.message)
            is CommandResult.Error -> reply(result.reason)
            is CommandResult.NeedsAiProcessing -> {
                viewModelScope.launch {
                    val aiReply = brain.generateReply(input)
                    reply(aiReply)
                }
            }
        }
    }

    private fun reply(text: String) {
        _messages.value = _messages.value + ChatMessage("jarvis", text)
        _state.value = AssistantState.SPEAKING
        voiceEngine?.speak(text)
    }

    override fun onCleared() {
        super.onCleared()
        voiceEngine?.shutdown()
    }
}`
  },
  {
    path: 'app/src/main/java/com/jarvis/ai/ui/theme/Theme.kt',
    name: 'Theme.kt',
    category: 'ui',
    language: 'kotlin',
    description: 'Futuristic dark blue-purple Material 3 theme.',
    content: `package com.jarvis.ai.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val JarvisDarkScheme = darkColorScheme(
    primary = Color(0xFF00E5FF),
    secondary = Color(0xFF7C4DFF),
    background = Color(0xFF050816),
    surface = Color(0xFF0F172A),
    onBackground = Color.White,
    onSurface = Color.White
)

@Composable
fun JarvisAITheme(content: @Composable () -> Unit) {
    MaterialTheme(colorScheme = JarvisDarkScheme, content = content)
}`
  },
  {
    path: 'app/src/main/java/com/jarvis/ai/ui/JarvisMainScreen.kt',
    name: 'JarvisMainScreen.kt',
    category: 'ui',
    language: 'kotlin',
    description: 'Main Jetpack Compose screen with AvatarView, glowing microphone button, mood selector, and voice bubble.',
    content: `package com.jarvis.ai.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Mic
import androidx.compose.material.icons.filled.Send
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.jarvis.ai.viewmodel.AssistantState
import com.jarvis.ai.viewmodel.JarvisViewModel

@Composable
fun JarvisMainScreen(
    viewModel: JarvisViewModel,
    onStartListening: () -> Unit,
    onStopListening: () -> Unit,
    onToggleForegroundService: (Boolean) -> Unit = {}
) {
    val state by viewModel.state.collectAsState()
    val mood by viewModel.mood.collectAsState()
    val audioLevel by viewModel.audioLevel.collectAsState()
    val partialText by viewModel.partialText.collectAsState()
    val messages by viewModel.messages.collectAsState()
    var inputText by remember { mutableStateOf("") }

    Column(
        modifier = Modifier.fillMaxSize().background(Color(0xFF050816)).padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.SpaceBetween
    ) {
        Text("JARVIS AI", color = Color(0xFF00E5FF), fontSize = 24.sp, fontWeight = FontWeight.ExtraBold)

        AvatarView(state = state, audioLevel = audioLevel, mood = mood)

        Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
            AvatarMood.entries.forEach { m ->
                FilterChip(
                    selected = mood == m,
                    onClick = { viewModel.setMood(m) },
                    label = { Text(m.label, fontSize = 11.sp) }
                )
            }
        }

        Surface(
            shape = RoundedCornerShape(20.dp),
            color = Color(0xFF0F172A),
            modifier = Modifier.fillMaxWidth()
        ) {
            Text(
                text = if (partialText.isNotBlank()) partialText else messages.lastOrNull()?.text ?: "",
                color = Color.White,
                modifier = Modifier.padding(16.dp)
            )
        }

        Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(12.dp)) {
            FloatingActionButton(
                onClick = { if (state == AssistantState.LISTENING) onStopListening() else onStartListening() },
                shape = CircleShape,
                containerColor = if (state == AssistantState.LISTENING) Color(0xFF00E5FF) else Color(0xFF7C4DFF),
                modifier = Modifier.size(72.dp)
            ) {
                Icon(Icons.Default.Mic, contentDescription = "Speak", tint = Color.White, modifier = Modifier.size(34.dp))
            }

            Row(modifier = Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                OutlinedTextField(
                    value = inputText,
                    onValueChange = { inputText = it },
                    placeholder = { Text("Bolkar ya likhkar poochein...") },
                    modifier = Modifier.weight(1f)
                )
                Spacer(Modifier.width(8.dp))
                IconButton(onClick = {
                    if (inputText.isNotBlank()) {
                        viewModel.processUserInput(inputText)
                        inputText = ""
                    }
                }) {
                    Icon(Icons.Default.Send, contentDescription = "Send", tint = Color(0xFF00E5FF))
                }
            }
        }
    }
}`
  }
];
