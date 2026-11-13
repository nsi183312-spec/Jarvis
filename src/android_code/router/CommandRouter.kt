package com.jarvis.ai.router

import android.bluetooth.BluetoothAdapter
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.hardware.camera2.CameraCharacteristics
import android.hardware.camera2.CameraManager
import android.media.AudioManager
import android.net.Uri
import android.os.BatteryManager
import android.provider.AlarmClock
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
    private var isTorchOn = false

    // Comprehensive app package aliases covering all vivo, Google, and daily apps
    private val appPackageMap: List<Pair<List<String>, List<String>>> = listOf(
        listOf("maps", "google maps", "map") to listOf("com.google.android.apps.maps"),
        listOf("meet", "google meet") to listOf("com.google.android.apps.meetings", "com.google.android.apps.tachyon"),
        listOf("messages", "sms app", "message app") to listOf("com.google.android.apps.messaging", "com.android.mms"),
        listOf("moviebox+", "moviebox plus", "moviebox") to listOf("com.movieboxpro.android", "com.community.moviebox"),
        listOf("music", "imusic", "music player") to listOf("com.android.bbkmusic", "com.vivo.music", "com.google.android.apps.youtube.music"),
        listOf("myjio", "my jio", "jio") to listOf("com.jio.myjio"),
        listOf("notes", "vivo notes", "notepad", "keep") to listOf("com.vivo.notes", "com.google.android.keep"),
        listOf("phone", "dialer", "phone app") to listOf("com.android.dialer", "com.google.android.dialer", "com.android.contacts"),
        listOf("photos", "google photos", "gallery", "albums") to listOf("com.google.android.apps.photos", "com.vivo.gallery", "com.android.gallery3d"),
        listOf("pinterest") to listOf("com.pinterest"),
        listOf("play store", "playstore") to listOf("com.android.vending"),
        listOf("recorder", "voice recorder", "sound recorder") to listOf("com.android.bbksoundrecorder", "com.vivo.soundrecorder", "com.google.android.apps.recorder"),
        listOf("safety", "personal safety", "sos") to listOf("com.google.android.apps.safetyhub", "com.vivo.sos"),
        listOf("settings", "setting") to listOf("com.android.settings"),
        listOf("simple view", "simple mode", "easy mode") to listOf("com.vivo.simplelauncher"),
        listOf("snapchat", "snap") to listOf("com.snapchat.android"),
        listOf("telegram") to listOf("org.telegram.messenger", "org.telegram.plus"),
        listOf("themes", "theme", "itheme") to listOf("com.bbk.theme", "com.vivo.itheme"),
        listOf("tips", "vivo tips") to listOf("com.vivo.tips", "com.google.android.apps.tips"),
        listOf("v-appstore", "v appstore", "vappstore", "vivo appstore") to listOf("com.vivo.appstore"),
        listOf("video", "video player", "ivideo") to listOf("com.vivo.videoeditor", "com.vivo.video", "com.android.VideoPlayer"),
        listOf("vivo cloud", "vivocloud") to listOf("com.vivo.cloud", "com.bbk.cloud"),
        listOf("vivo store", "vivostore") to listOf("com.vivo.website", "com.vivo.store"),
        listOf("weather", "mausam") to listOf("com.vivo.weather", "com.google.android.apps.weather"),
        listOf("whatsapp", "whats app") to listOf("com.whatsapp", "com.whatsapp.w4b"),
        listOf("youtube", "yt") to listOf("com.google.android.youtube")
    )

    fun routeCommand(input: String): CommandResult {
        val text = input.trim().lowercase()

        // 1. FLASHLIGHT / TORCH (English + Hinglish + Hindi)
        if (text.contains("flashlight on") || text.contains("torch on") || text.contains("torch chalu") || text.contains("flashlight chalu") || text.contains("फ्लैशलाइट ऑन") || text.contains("टॉर्च ऑन")) {
            return toggleFlashlight(true)
        }
        if (text.contains("flashlight off") || text.contains("torch off") || text.contains("torch band") || text.contains("flashlight band") || text.contains("फ्लैशलाइट बंद") || text.contains("टॉर्च बंद")) {
            return toggleFlashlight(false)
        }

        // 1B. MOBILE DATA / WI-FI / BLUETOOTH TOGGLES (Uses Accessibility Quick Settings or Connectivity Panel)
        if (text.contains("data on") || text.contains("mobile data on") || text.contains("data chalu") || text.contains("डेटा ऑन") || text.contains("डेटा चालू")) {
            val service = JarvisAccessibilityService.instance
            if (service != null) {
                service.performOpenQuickSettings()
                return CommandResult.Handled("Quick Settings khol diya hai — Mobile Data toggle karein!")
            }
            val action = if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.Q) {
                Settings.Panel.ACTION_INTERNET_CONNECTIVITY
            } else {
                Settings.ACTION_DATA_ROAMING_SETTINGS
            }
            return openSettingsAction(action, "Mobile Data Panel open kar rahi hoon!")
        }
        if (text.contains("data off") || text.contains("mobile data off") || text.contains("data band") || text.contains("डेटा बंद")) {
            val action = if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.Q) {
                Settings.Panel.ACTION_INTERNET_CONNECTIVITY
            } else {
                Settings.ACTION_DATA_ROAMING_SETTINGS
            }
            return openSettingsAction(action, "Mobile Data band karne ke liye Internet Panel open kar rahi hoon!")
        }

        // 2. SETTINGS SUB-SCREENS & HARDWARE MODES (Wi-Fi, Bluetooth, Hotspot, Airplane, DND, Brightness, Display, Sound, Accessibility)
        if (text.contains("wifi setting") || text.contains("wi-fi setting") || text.contains("wifi on") || text.contains("wifi off")) {
            val action = if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.Q) {
                Settings.Panel.ACTION_WIFI
            } else {
                Settings.ACTION_WIFI_SETTINGS
            }
            return openSettingsAction(action, "Wi-Fi control open kar rahi hoon!")
        }
        if (text.contains("bluetooth")) {
            if (text.contains("on") || text.contains("chalu")) {
                return openSettingsAction(BluetoothAdapter.ACTION_REQUEST_ENABLE, "Bluetooth enable request open kar rahi hoon!")
            }
            return openSettingsAction(Settings.ACTION_BLUETOOTH_SETTINGS, "Bluetooth Settings open kar rahi hoon!")
        }
        if (text.contains("hotspot")) {
            return openSettingsAction(Settings.ACTION_WIRELESS_SETTINGS, "Hotspot & Tethering settings open kar rahi hoon!")
        }
        if (text.contains("airplane mode") || text.contains("flight mode")) {
            return openSettingsAction(Settings.ACTION_AIRPLANE_MODE_SETTINGS, "Airplane mode settings open kar rahi hoon!")
        }
        if (text.contains("dnd") || text.contains("do not disturb") || text.contains("silent")) {
            return try {
                val enableSilent = !(text.contains("off") || text.contains("band"))
                audioManager.ringerMode = if (enableSilent) AudioManager.RINGER_MODE_SILENT else AudioManager.RINGER_MODE_NORMAL
                CommandResult.Handled(if (enableSilent) "Phone Silent / DND mode par set kar diya hai!" else "Phone Normal ringer mode par kar diya hai!")
            } catch (e: SecurityException) {
                openSettingsAction(Settings.ACTION_NOTIFICATION_POLICY_ACCESS_SETTINGS, "DND permission screen open kar rahi hoon!")
            }
        }
        if (text.contains("brightness") || text.contains("roshni")) {
            val match = Regex("""(\d+)%?""").find(text)
            if (match != null && Settings.System.canWrite(context)) {
                val pct = (match.groupValues[1].toIntOrNull() ?: 70).coerceIn(10, 100)
                val val255 = (pct * 255) / 100
                Settings.System.putInt(context.contentResolver, Settings.System.SCREEN_BRIGHTNESS_MODE, Settings.System.SCREEN_BRIGHTNESS_MODE_MANUAL)
                Settings.System.putInt(context.contentResolver, Settings.System.SCREEN_BRIGHTNESS, val255)
                return CommandResult.Handled("Phone brightness $pct% par set kar di hai!")
            }
            return openSettingsAction(Settings.ACTION_DISPLAY_SETTINGS, "Display Brightness settings open kar rahi hoon!")
        }
        if (text.contains("display setting")) {
            return openSettingsAction(Settings.ACTION_DISPLAY_SETTINGS, "Display Settings open kar rahi hoon!")
        }
        if (text.contains("sound setting") || text.contains("volume setting")) {
            return openSettingsAction(Settings.ACTION_SOUND_SETTINGS, "Sound Settings open kar rahi hoon!")
        }
        if (text.contains("accessibility setting")) {
            return openSettingsAction(Settings.ACTION_ACCESSIBILITY_SETTINGS, "Accessibility Settings open kar rahi hoon!")
        }

        // 3. MUSIC PLAYBACK CONTROLS (Next, Previous, Pause, Play)
        if (text.contains("music") || text.contains("song") || text.contains("gana")) {
            when {
                text.contains("next") || text.contains("agla") -> {
                    sendMediaKey(KeyEvent.KEYCODE_MEDIA_NEXT)
                    return CommandResult.Handled("Agla gaana play kar rahi hoon!")
                }
                text.contains("previous") || text.contains("pichla") -> {
                    sendMediaKey(KeyEvent.KEYCODE_MEDIA_PREVIOUS)
                    return CommandResult.Handled("Pichla gaana play kar rahi hoon!")
                }
                text.contains("pause") || text.contains("stop") || text.contains("roko") -> {
                    sendMediaKey(KeyEvent.KEYCODE_MEDIA_PAUSE)
                    return CommandResult.Handled("Music pause kar diya hai.")
                }
            }
        }

        // 4. IN-APP DEEP ACTIONS (YouTube, Maps, Play Store, Pinterest, Meet, WhatsApp)
        if (text.contains("youtube") && (text.contains("play") || text.contains("search") || text.contains("chalao") || text.contains("dhundho"))) {
            val query = text.replace(Regex("\\b(youtube|par|me|play|search|chalao|dhundho|song|gaana|karo)\\b"), " ").trim()
            val intent = Intent(Intent.ACTION_VIEW, Uri.parse("https://www.youtube.com/results?search_query=" + Uri.encode(query))).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            return try {
                context.startActivity(intent)
                CommandResult.Handled("YouTube me \"$query\" search karke play kar rahi hoon!")
            } catch (e: Exception) {
                launchFirstAvailable(listOf("com.google.android.youtube"), "YouTube open kar rahi hoon!")
            }
        }

        if ((text.contains("play store") || text.contains("playstore")) && (text.contains("search") || text.contains("download") || text.contains("install"))) {
            val appSearch = text.replace(Regex("\\b(play store|playstore|par|me|search|download|install|karo|app)\\b"), " ").trim()
            val intent = Intent(Intent.ACTION_VIEW, Uri.parse("market://search?q=" + Uri.encode(appSearch))).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            return try {
                context.startActivity(intent)
                CommandResult.Handled("Play Store me \"$appSearch\" search kar rahi hoon!")
            } catch (e: Exception) {
                launchFirstAvailable(listOf("com.android.vending"), "Play Store open kar rahi hoon!")
            }
        }

        if (text.contains("pinterest") && (text.contains("search") || text.contains("dhundho") || text.contains("wallpaper"))) {
            val pinQuery = text.replace(Regex("\\b(pinterest|par|me|search|dhundho|karo)\\b"), " ").trim()
            val intent = Intent(Intent.ACTION_VIEW, Uri.parse("https://www.pinterest.com/search/pins/?q=" + Uri.encode(pinQuery))).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            return try {
                context.startActivity(intent)
                CommandResult.Handled("Pinterest par \"$pinQuery\" search kar rahi hoon!")
            } catch (e: Exception) {
                launchFirstAvailable(listOf("com.pinterest"), "Pinterest open kar rahi hoon!")
            }
        }

        if (text.contains("map") && (text.contains("navigate") || text.contains("rasta") || text.contains("dhundho") || text.contains("nearest"))) {
            val place = text.replace(Regex("\\b(google|map|maps|navigate|rasta|dhundho|le chalo|dikhao)\\b"), " ").trim()
            val intent = Intent(Intent.ACTION_VIEW, Uri.parse("google.navigation:q=" + Uri.encode(place))).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            return try {
                context.startActivity(intent)
                CommandResult.Handled("Google Maps me \"$place\" ke liye navigation shuru kar rahi hoon!")
            } catch (e: Exception) {
                launchFirstAvailable(listOf("com.google.android.apps.maps"), "Google Maps open kar rahi hoon!")
            }
        }

        if (text.contains("whatsapp") && (text.contains("message") || text.contains("bhejo") || text.contains("send"))) {
            val msg = text.replace(Regex("\\b(whatsapp|par|me|message|bhejo|send|karo)\\b"), " ").trim()
            val intent = Intent(Intent.ACTION_VIEW, Uri.parse("https://api.whatsapp.com/send?text=" + Uri.encode(msg))).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            return try {
                context.startActivity(intent)
                CommandResult.Handled("WhatsApp message prepare kar diya hai!")
            } catch (e: Exception) {
                launchFirstAvailable(listOf("com.whatsapp"), "WhatsApp open kar rahi hoon!")
            }
        }

        // 5. ACCESSIBILITY IN-APP AUTOMATIONS (Scroll, Click By Text, Type, Screenshot, Navigation)
        if (text.contains("scroll down") || text.contains("niche scroll") || text.contains("niche jao")) {
            val service = JarvisAccessibilityService.instance
            return if (service != null && service.scrollForward()) {
                CommandResult.Handled("Screen par niche scroll kar diya hai!")
            } else {
                CommandResult.Error("Accessibility Service enable kijiye.")
            }
        }

        if (text.contains("scroll up") || text.contains("upar scroll") || text.contains("upar jao")) {
            val service = JarvisAccessibilityService.instance
            return if (service != null && service.scrollBackward()) {
                CommandResult.Handled("Screen par upar scroll kar diya hai!")
            } else {
                CommandResult.Error("Accessibility Service enable kijiye.")
            }
        }

        if (text.startsWith("click ") || text.startsWith("dabao ")) {
            val target = text.removePrefix("click ").removePrefix("dabao ").trim()
            val service = JarvisAccessibilityService.instance
            return if (service != null && service.clickElementByText(target)) {
                CommandResult.Handled("Screen par \"$target\" button click kar diya!")
            } else {
                CommandResult.Error("Accessibility element \"$target\" nahi mila ya service off hai.")
            }
        }

        if (text.startsWith("type ") || text.startsWith("likho ")) {
            val typed = text.removePrefix("type ").removePrefix("likho ").trim()
            val service = JarvisAccessibilityService.instance
            return if (service != null && service.performTypeText("", typed)) {
                CommandResult.Handled("\"$typed\" type kar diya hai!")
            } else {
                CommandResult.Error("Active text field nahi mila.")
            }
        }

        if (text.contains("screenshot") || text.contains("screen capture")) {
            val service = JarvisAccessibilityService.instance
            return if (service != null && service.takeScreenCapture()) {
                CommandResult.Handled("Screenshot capture kar liya!")
            } else {
                CommandResult.Error("Accessibility permission required for screenshot.")
            }
        }

        if (text == "go home" || text == "home screen" || text == "ghar jao") {
            val service = JarvisAccessibilityService.instance
            return if (service != null && service.performGoHome()) {
                CommandResult.Handled("Home screen par aa gaye hain.")
            } else {
                CommandResult.Error("Accessibility service enable kijiye.")
            }
        }
        if (text == "go back" || text == "back" || text == "piche jao") {
            val service = JarvisAccessibilityService.instance
            return if (service != null && service.performGoBack()) {
                CommandResult.Handled("Back kar diya hai.")
            } else {
                CommandResult.Error("Accessibility service enable kijiye.")
            }
        }
        if (text.contains("recent apps") || text.contains("recents")) {
            val service = JarvisAccessibilityService.instance
            return if (service != null && service.performOpenRecents()) {
                CommandResult.Handled("Recent apps screen open kar di hai.")
            } else {
                CommandResult.Error("Accessibility service required.")
            }
        }

        // 6. SYSTEM HARDWARE APPS (Camera, Calculator, Recorder) & UNIVERSAL APP LAUNCHER
        if (text.contains("camera") && (text.contains("open") || text.contains("kholo") || text == "camera")) {
            return try {
                val intent = Intent(MediaStore.INTENT_ACTION_STILL_IMAGE_CAMERA).apply {
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK
                }
                context.startActivity(intent)
                CommandResult.Handled("Phone Camera open kar rahi hoon!")
            } catch (e: Exception) {
                launchFirstAvailable(listOf("com.android.camera", "com.sec.android.app.camera"), "Camera open kar rahi hoon!")
            }
        }
        if ((text.contains("calculator") || text == "calc") && (text.contains("open") || text.contains("kholo") || text == "calculator" || text == "calc")) {
            return try {
                val intent = Intent(Intent.ACTION_MAIN).apply {
                    addCategory(Intent.CATEGORY_APP_CALCULATOR)
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK
                }
                context.startActivity(intent)
                CommandResult.Handled("Phone Calculator open kar rahi hoon!")
            } catch (e: Exception) {
                launchFirstAvailable(listOf("com.google.android.calculator", "com.android.bbkcalculator", "com.sec.android.app.popupcalculator"), "Calculator open kar rahi hoon!")
            }
        }
        if (text.contains("recorder") && (text.contains("open") || text.contains("kholo") || text.contains("start") || text == "recorder")) {
            return try {
                val intent = Intent(MediaStore.Audio.Media.RECORD_SOUND_ACTION).apply {
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK
                }
                context.startActivity(intent)
                CommandResult.Handled("Voice Recorder open kar rahi hoon!")
            } catch (e: Exception) {
                launchFirstAvailable(listOf("com.android.bbksoundrecorder", "com.vivo.soundrecorder", "com.google.android.apps.recorder"), "Recorder open kar rahi hoon!")
            }
        }

        if (text.startsWith("open ") || text.startsWith("kholo ") || text.contains("chalu karo") || text.contains("open karo")) {
            val appQuery = text
                .replace(Regex("^(open|kholo|launch|start)\\s+"), "")
                .replace(Regex("\\s*(chalu karo|khol do|open karo|app)"), "")
                .trim()

            // Check curated vivo & Google app map first
            for ((aliases, packages) in appPackageMap) {
                if (aliases.any { appQuery == it || appQuery.contains(it) }) {
                    val result = launchFirstAvailable(packages, "$appQuery open kar rahi hoon!")
                    if (result is CommandResult.Handled) return result
                }
            }

            // Fallback to dynamic PackageManager lookup across all installed phone apps
            val dynamicLaunchResult = launchAnyInstalledApp(appQuery)
            if (dynamicLaunchResult != null) {
                return dynamicLaunchResult
            }
        }

        // 7. DEVICE VOLUME CONTROL
        if (text.contains("volume")) {
            if (text.contains("up") || text.contains("badhao")) {
                audioManager.adjustStreamVolume(AudioManager.STREAM_MUSIC, AudioManager.ADJUST_RAISE, AudioManager.FLAG_SHOW_UI)
                return CommandResult.Handled("Volume badha diya hai!")
            }
            if (text.contains("down") || text.contains("kam karo")) {
                audioManager.adjustStreamVolume(AudioManager.STREAM_MUSIC, AudioManager.ADJUST_LOWER, AudioManager.FLAG_SHOW_UI)
                return CommandResult.Handled("Volume kam kar diya hai!")
            }
            val match = Regex("""(\d+)%?""").find(text)
            if (match != null) {
                val percent = match.groupValues[1].toIntOrNull() ?: 50
                val max = audioManager.getStreamMaxVolume(AudioManager.STREAM_MUSIC)
                val target = ((percent / 100.0) * max).toInt()
                audioManager.setStreamVolume(AudioManager.STREAM_MUSIC, target, AudioManager.FLAG_SHOW_UI)
                return CommandResult.Handled("Volume $percent% set kar diya hai!")
            }
        }

        // 8. ALARM
        if (text.contains("alarm")) {
            val intent = Intent(AlarmClock.ACTION_SET_ALARM).apply {
                putExtra(AlarmClock.EXTRA_HOUR, 7)
                putExtra(AlarmClock.EXTRA_MINUTES, 0)
                putExtra(AlarmClock.EXTRA_MESSAGE, "JARVIS Alarm")
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            return try {
                context.startActivity(intent)
                CommandResult.Handled("Alarm screen open kar di hai!")
            } catch (e: Exception) {
                CommandResult.Error("Alarm app nahi mila.")
            }
        }

        // 9. BATTERY STATUS
        if (text.contains("battery")) {
            val bm = context.getSystemService(Context.BATTERY_SERVICE) as BatteryManager
            val level = bm.getIntProperty(BatteryManager.BATTERY_PROPERTY_CAPACITY)
            return CommandResult.Handled("Aapke phone ki battery $level% hai.")
        }

        // 10. TIME & DATE
        if (text.contains("time") || text.contains("samay")) {
            val sdf = java.text.SimpleDateFormat("hh:mm a", java.util.Locale.getDefault())
            return CommandResult.Handled("Abhi time hai ${sdf.format(java.util.Date())}")
        }

        // 11. CALL & SMS (Native Phone Dialer / Messages Execution)
        if (text.startsWith("call ") || text.startsWith("phone lagao ")) {
            val target = text.removePrefix("call ").removePrefix("phone lagao ").trim()
            val digits = target.replace(Regex("[^\\d+]"), "")
            return if (digits.isNotEmpty()) {
                val dialIntent = Intent(Intent.ACTION_DIAL, Uri.parse("tel:$digits")).apply {
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK
                }
                context.startActivity(dialIntent)
                CommandResult.Handled("$digits par Phone Dialer open kar diya hai!")
            } else {
                CommandResult.Handled("Kya aap waqai me $target ko call karna chahte hain? Kripya confirm karein.", requiresConfirmation = true)
            }
        }

        if (text.startsWith("sms ") || text.startsWith("message bhejo ")) {
            val target = text.removePrefix("sms ").removePrefix("message bhejo ").trim()
            val smsIntent = Intent(Intent.ACTION_SENDTO, Uri.parse("smsto:")).apply {
                putExtra("sms_body", "Hello $target")
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            return try {
                context.startActivity(smsIntent)
                CommandResult.Handled("Messages app SMS bhejne ke liye open kar diya hai!")
            } catch (e: Exception) {
                launchFirstAvailable(listOf("com.google.android.apps.messaging", "com.android.mms"), "Messages open kar rahi hoon!")
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

    private fun launchFirstAvailable(packages: List<String>, successMsg: String): CommandResult {
        val pm = context.packageManager
        for (pkg in packages) {
            val launchIntent = pm.getLaunchIntentForPackage(pkg)
            if (launchIntent != null) {
                launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                context.startActivity(launchIntent)
                return CommandResult.Handled(successMsg)
            }
        }
        return CommandResult.Error("Ye app phone me installed nahi mila.")
    }

    private fun launchAnyInstalledApp(spokenAppName: String): CommandResult? {
        val pm = context.packageManager
        val installedApps = pm.getInstalledApplications(PackageManager.GET_META_DATA)

        for (appInfo in installedApps) {
            val appLabel = pm.getApplicationLabel(appInfo).toString().lowercase()
            if (appLabel == spokenAppName || appLabel.contains(spokenAppName) || spokenAppName.contains(appLabel)) {
                val intent = pm.getLaunchIntentForPackage(appInfo.packageName)
                if (intent != null) {
                    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                    context.startActivity(intent)
                    val realName = pm.getApplicationLabel(appInfo).toString()
                    return CommandResult.Handled("$realName open kar rahi hoon!")
                }
            }
        }
        return null
    }

    private fun toggleFlashlight(on: Boolean): CommandResult {
        return try {
            val rearFlashCameraId = cameraManager.cameraIdList.firstOrNull { id ->
                val chars = cameraManager.getCameraCharacteristics(id)
                val hasFlash = chars.get(CameraCharacteristics.FLASH_INFO_AVAILABLE) == true
                val facing = chars.get(CameraCharacteristics.LENS_FACING)
                hasFlash && facing == CameraCharacteristics.LENS_FACING_BACK
            } ?: cameraManager.cameraIdList[0]

            cameraManager.setTorchMode(rearFlashCameraId, on)
            isTorchOn = on
            CommandResult.Handled(if (on) "Flashlight on ho gayi hai!" else "Flashlight band kar di gayi hai!")
        } catch (e: Exception) {
            CommandResult.Error("Camera hardware access nahi ho paaya: ${e.message}")
        }
    }
}
