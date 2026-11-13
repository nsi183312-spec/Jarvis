package com.jarvis.ai.router

import android.app.SearchManager
import android.bluetooth.BluetoothAdapter
import android.content.Context
import android.content.Intent
import android.hardware.camera2.CameraCharacteristics
import android.hardware.camera2.CameraManager
import android.media.AudioManager
import android.net.Uri
import android.os.BatteryManager
import android.provider.AlarmClock
import android.provider.MediaStore
import android.provider.Settings
import android.view.KeyEvent
import com.jarvis.ai.discovery.InstalledAppDiscovery
import com.jarvis.ai.service.JarvisAccessibilityService

sealed class CommandResult {
    data class Handled(val message: String, val requiresConfirmation: Boolean = false) : CommandResult()
    data class NotInstalled(val appName: String, val reason: String) : CommandResult()
    data class PermissionDenied(val permissionType: String, val reason: String) : CommandResult()
    data class NeedsAiProcessing(val query: String) : CommandResult()
    data class Error(val reason: String) : CommandResult()
}

class CommandRouter(
    private val context: Context,
    private val discovery: InstalledAppDiscovery = InstalledAppDiscovery(context)
) {

    private val cameraManager = context.getSystemService(Context.CAMERA_SERVICE) as CameraManager
    private val audioManager = context.getSystemService(Context.AUDIO_SERVICE) as AudioManager
    private var isTorchOn = false

    // Known Android app aliases -> real Android package names
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
        listOf("youtube", "yt") to listOf("com.google.android.youtube"),
        listOf("gmail", "email", "mail") to listOf("com.google.android.gm"),
        listOf("chrome", "google chrome") to listOf("com.android.chrome")
    )

    fun launchPackageDirectly(packageName: String): CommandResult {
        if (!discovery.isPackageInstalled(packageName)) {
            return CommandResult.NotInstalled(packageName, "Yeh app ($packageName) phone me installed nahi hai.")
        }
        if (!discovery.isAppAllowed(packageName)) {
            return CommandResult.PermissionDenied(
                "app_control",
                "User ne $packageName ke liye JARVIS app control disable kiya hua hai."
            )
        }
        val launchIntent = context.packageManager.getLaunchIntentForPackage(packageName)
            ?: return CommandResult.NotInstalled(packageName, "$packageName launchable nahi hai.")
        launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        context.startActivity(launchIntent)
        return CommandResult.Handled("App launch kar diya hai!")
    }

    fun routeCommand(input: String): CommandResult {
        val text = input.trim().lowercase()

        // 0. SECURITY GUARDRAIL: Never bypass OTP, lock screens, login screens, or unauthorized purchases
        if (text.contains("bypass") ||
            text.contains("read otp") ||
            text.contains("otp padho") ||
            text.contains("skip login") ||
            text.contains("unlock without password")
        ) {
            return CommandResult.PermissionDenied(
                "security_policy",
                "Security Policy: JARVIS OTP verification, login screens, ya Android app permissions ko bypass nahi karti."
            )
        }

        // 1. FLASHLIGHT / TORCH
        if (text.contains("flashlight on") || text.contains("torch on") || text.contains("torch chalu") || text.contains("flashlight chalu")) {
            return toggleFlashlight(true)
        }
        if (text.contains("flashlight off") || text.contains("torch off") || text.contains("torch band") || text.contains("flashlight band")) {
            return toggleFlashlight(false)
        }

        // 1B. MOBILE DATA / WI-FI / BLUETOOTH / SETTINGS PANELS
        if (text.contains("data on") || text.contains("mobile data on") || text.contains("data off") || text.contains("data setting")) {
            val action = if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.Q) {
                Settings.Panel.ACTION_INTERNET_CONNECTIVITY
            } else {
                Settings.ACTION_DATA_ROAMING_SETTINGS
            }
            return openSettingsAction(action, "Mobile Data Panel open kar rahi hoon!")
        }

        if (text.contains("wifi") || text.contains("wi-fi")) {
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
            } catch (_: SecurityException) {
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
        if (text.contains("display setting")) return openSettingsAction(Settings.ACTION_DISPLAY_SETTINGS, "Display Settings open kar rahi hoon!")
        if (text.contains("sound setting") || text.contains("volume setting")) return openSettingsAction(Settings.ACTION_SOUND_SETTINGS, "Sound Settings open kar rahi hoon!")
        if (text.contains("accessibility setting")) return openSettingsAction(Settings.ACTION_ACCESSIBILITY_SETTINGS, "Accessibility Settings open kar rahi hoon!")

        // 2. MUSIC PLAYBACK CONTROLS
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

        // 3. IN-APP COMMANDS (Targeted ONLY to real installed Android apps — NEVER fake browser tabs!)

        // YouTube: Search & Open Video inside real YouTube app
        if (text.contains("youtube") && (text.contains("search") || text.contains("play") || text.contains("chalao") || text.contains("dhundho") || text.contains("video"))) {
            val ytPkg = "com.google.android.youtube"
            if (!discovery.isPackageInstalled(ytPkg)) {
                return CommandResult.NotInstalled("YouTube", "YouTube app aapke phone me installed nahi hai.")
            }
            if (!discovery.isAppAllowed(ytPkg)) {
                return CommandResult.PermissionDenied("app_control", "User ne YouTube ke liye JARVIS app control off kiya hai.")
            }
            val query = text
                .replace(Regex("\\b(youtube|par|me|mein|on|for|search|play|chalao|dhundho|karo|open|kholo)\\b"), " ")
                .replace(Regex("\\s+"), " ")
                .trim()
                .ifEmpty { "trending" }

            val searchIntent = Intent(Intent.ACTION_SEARCH).apply {
                setPackage(ytPkg)
                putExtra(SearchManager.QUERY, query)
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            if (searchIntent.resolveActivity(context.packageManager) != null) {
                context.startActivity(searchIntent)
                return CommandResult.Handled("YouTube app me \"$query\" search kar rahi hoon!")
            }
            val viewIntent = Intent(
                Intent.ACTION_VIEW,
                Uri.parse("https://www.youtube.com/results?search_query=" + Uri.encode(query))
            ).apply {
                setPackage(ytPkg)
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            if (viewIntent.resolveActivity(context.packageManager) != null) {
                context.startActivity(viewIntent)
                return CommandResult.Handled("YouTube app me \"$query\" open kar rahi hoon!")
            }
            return launchPackageDirectly(ytPkg)
        }

        // Chrome: Open requested website explicitly in real Chrome browser
        if (text.contains("chrome") && (text.contains("http") || text.contains(".com") || text.contains(".org") || text.contains(".in") || text.contains(".net") || text.contains("website") || text.contains("open"))) {
            val chromePkg = "com.android.chrome"
            if (!discovery.isPackageInstalled(chromePkg)) {
                return CommandResult.NotInstalled("Chrome", "Google Chrome app aapke phone me installed nahi hai.")
            }
            val urlMatch = Regex("""(https?://[^\s]+|[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:/[^\s]*)?)""").find(text)
            if (urlMatch != null) {
                val rawUrl = urlMatch.value
                val finalUrl = if (rawUrl.startsWith("http")) rawUrl else "https://$rawUrl"
                val intent = Intent(Intent.ACTION_VIEW, Uri.parse(finalUrl)).apply {
                    setPackage(chromePkg)
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK
                }
                if (intent.resolveActivity(context.packageManager) != null) {
                    context.startActivity(intent)
                    return CommandResult.Handled("Chrome app me $finalUrl open kar rahi hoon!")
                }
            }
            return launchPackageDirectly(chromePkg)
        }

        // Google Maps: Locations & Directions in real Google Maps app
        if ((text.contains("map") || text.contains("maps")) && (text.contains("navigate") || text.contains("rasta") || text.contains("dhundho") || text.contains("nearest") || text.contains("search") || text.contains("directions"))) {
            val mapsPkg = "com.google.android.apps.maps"
            if (!discovery.isPackageInstalled(mapsPkg)) {
                return CommandResult.NotInstalled("Google Maps", "Google Maps app aapke phone me installed nahi hai.")
            }
            val place = text
                .replace(Regex("\\b(google|map|maps|navigate|directions|rasta|dhundho|search|le chalo|dikhao|to|for|in|on)\\b"), " ")
                .replace(Regex("\\s+"), " ")
                .trim()
                .ifEmpty { "nearby" }
            val uri = if (text.contains("navigate") || text.contains("directions") || text.contains("rasta")) {
                Uri.parse("google.navigation:q=" + Uri.encode(place))
            } else {
                Uri.parse("geo:0,0?q=" + Uri.encode(place))
            }
            val intent = Intent(Intent.ACTION_VIEW, uri).apply {
                setPackage(mapsPkg)
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            if (intent.resolveActivity(context.packageManager) != null) {
                context.startActivity(intent)
                return CommandResult.Handled("Google Maps me \"$place\" open kar rahi hoon!")
            }
            return launchPackageDirectly(mapsPkg)
        }

        // WhatsApp: Open chats / prepare share inside real WhatsApp (never opens web.whatsapp.com tab!)
        if (text.contains("whatsapp") && (text.contains("message") || text.contains("bhejo") || text.contains("send") || text.contains("share"))) {
            val waPkg = if (discovery.isPackageInstalled("com.whatsapp")) "com.whatsapp" else "com.whatsapp.w4b"
            if (!discovery.isPackageInstalled(waPkg)) {
                return CommandResult.NotInstalled("WhatsApp", "WhatsApp app aapke phone me installed nahi hai.")
            }
            val msg = text
                .replace(Regex("\\b(whatsapp|par|me|on|in|message|bhejo|send|share|karo)\\b"), " ")
                .replace(Regex("\\s+"), " ")
                .trim()
            val sendIntent = Intent(Intent.ACTION_SEND).apply {
                type = "text/plain"
                putExtra(Intent.EXTRA_TEXT, msg.ifEmpty { "Hello!" })
                setPackage(waPkg)
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            if (sendIntent.resolveActivity(context.packageManager) != null) {
                context.startActivity(sendIntent)
                return CommandResult.Handled("WhatsApp message draft open kar diya hai — confirm karke send karein!")
            }
            return launchPackageDirectly(waPkg)
        }

        // Gmail: Compose email inside real Gmail app
        if ((text.contains("gmail") || text.contains("email") || text.contains("mail")) && (text.contains("send") || text.contains("compose") || text.contains("bhejo") || text.contains("likho"))) {
            val gmailPkg = "com.google.android.gm"
            if (!discovery.isPackageInstalled(gmailPkg)) {
                return CommandResult.NotInstalled("Gmail", "Gmail app aapke phone me installed nahi hai.")
            }
            val emailMatch = Regex("""[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}""").find(text)
            val recipient = emailMatch?.value.orEmpty()
            val intent = Intent(Intent.ACTION_SENDTO, Uri.parse("mailto:$recipient")).apply {
                setPackage(gmailPkg)
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            if (intent.resolveActivity(context.packageManager) != null) {
                context.startActivity(intent)
                return CommandResult.Handled("Gmail compose screen open kar di hai!")
            }
            return launchPackageDirectly(gmailPkg)
        }

        // 4. ACCESSIBILITY IN-APP AUTOMATIONS (Explicit Accessibility Service Check!)
        if (text.contains("scroll down") || text.contains("scroll up") || text.startsWith("click ") || text.startsWith("type ") || text.contains("screenshot") || text == "go home" || text == "go back" || text.contains("recent apps")) {
            val service = JarvisAccessibilityService.instance
                ?: return CommandResult.PermissionDenied(
                    "accessibility",
                    "Accessibility permission required: Settings me JARVIS Accessibility Service explicitly enable karein."
                )

            return when {
                text.contains("scroll down") -> if (service.scrollForward()) CommandResult.Handled("Niche scroll kar diya!") else CommandResult.Error("Scroll nahi ho saka.")
                text.contains("scroll up") -> if (service.scrollBackward()) CommandResult.Handled("Upar scroll kar diya!") else CommandResult.Error("Scroll nahi ho saka.")
                text.startsWith("click ") -> {
                    val target = text.removePrefix("click ").trim()
                    if (service.clickElementByText(target)) CommandResult.Handled("\"$target\" click kar diya!") else CommandResult.Error("\"$target\" screen par nahi mila.")
                }
                text.startsWith("type ") -> {
                    val typed = text.removePrefix("type ").trim()
                    if (service.performTypeText("", typed)) CommandResult.Handled("\"$typed\" type kar diya!") else CommandResult.Error("Active text field nahi mila.")
                }
                text.contains("screenshot") -> if (service.takeScreenCapture()) CommandResult.Handled("Screenshot capture kar liya!") else CommandResult.Error("Screenshot failed.")
                text == "go home" -> if (service.performGoHome()) CommandResult.Handled("Home screen par aa gaye.") else CommandResult.Error("Action failed.")
                text == "go back" -> if (service.performGoBack()) CommandResult.Handled("Back kar diya.") else CommandResult.Error("Action failed.")
                else -> if (service.performOpenRecents()) CommandResult.Handled("Recent apps open kiye.") else CommandResult.Error("Action failed.")
            }
        }

        // 5. CAMERA, GALLERY/PHOTOS, PHONE DIALER, CALCULATOR, RECORDER
        if (text.contains("camera") && (text.contains("open") || text.contains("kholo") || text == "camera")) {
            return try {
                val intent = Intent(MediaStore.INTENT_ACTION_STILL_IMAGE_CAMERA).apply {
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK
                }
                context.startActivity(intent)
                CommandResult.Handled("Real Camera app open kar rahi hoon!")
            } catch (_: Exception) {
                launchFirstAvailable("Camera", listOf("com.android.camera", "com.sec.android.app.camera", "com.vivo.camera"))
            }
        }

        if ((text.contains("gallery") || text.contains("photos")) && (text.contains("open") || text.contains("kholo") || text == "gallery" || text == "photos")) {
            val res = launchFirstAvailable("Gallery / Photos", listOf("com.google.android.apps.photos", "com.vivo.gallery", "com.android.gallery3d"))
            if (res is CommandResult.Handled) return res
            return try {
                val intent = Intent(Intent.ACTION_VIEW, MediaStore.Images.Media.EXTERNAL_CONTENT_URI).apply {
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK
                }
                context.startActivity(intent)
                CommandResult.Handled("Phone Gallery open kar rahi hoon!")
            } catch (_: Exception) {
                CommandResult.NotInstalled("Gallery / Photos", "Phone me Photos/Gallery app nahi mila.")
            }
        }

        if ((text.contains("phone") || text.contains("dialer")) && (text.contains("open") || text.contains("kholo"))) {
            return try {
                val intent = Intent(Intent.ACTION_DIAL).apply { flags = Intent.FLAG_ACTIVITY_NEW_TASK }
                context.startActivity(intent)
                CommandResult.Handled("Phone Dialer open kar diya hai!")
            } catch (_: Exception) {
                launchFirstAvailable("Phone", listOf("com.android.dialer", "com.google.android.dialer"))
            }
        }

        // 6. UNIVERSAL REAL INSTALLED APP LAUNCHER
        if (text.startsWith("open ") || text.startsWith("kholo ") || text.contains("chalu karo") || text.contains("open karo")) {
            val appQuery = text
                .replace(Regex("^(open|kholo|launch|start)\\s+"), "")
                .replace(Regex("\\s*(chalu karo|khol do|open karo|app)"), "")
                .trim()

            for ((aliases, packages) in appPackageMap) {
                if (aliases.any { appQuery == it || appQuery.contains(it) }) {
                    return launchFirstAvailable(appQuery, packages)
                }
            }

            val discoveredApp = discovery.findBestMatchingInstalledApp(appQuery)
            if (discoveredApp != null) {
                return launchPackageDirectly(discoveredApp.packageName)
            }

            return CommandResult.NotInstalled(
                appQuery,
                "\"$appQuery\" app aapke phone me installed nahi mila."
            )
        }

        // 7. VOLUME, ALARM, BATTERY, TIME
        if (text.contains("volume")) {
            if (text.contains("up") || text.contains("badhao")) {
                audioManager.adjustStreamVolume(AudioManager.STREAM_MUSIC, AudioManager.ADJUST_RAISE, AudioManager.FLAG_SHOW_UI)
                return CommandResult.Handled("Volume badha diya hai!")
            }
            if (text.contains("down") || text.contains("kam karo")) {
                audioManager.adjustStreamVolume(AudioManager.STREAM_MUSIC, AudioManager.ADJUST_LOWER, AudioManager.FLAG_SHOW_UI)
                return CommandResult.Handled("Volume kam kar diya hai!")
            }
        }
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
            } catch (_: Exception) {
                CommandResult.NotInstalled("Clock / Alarm", "Phone me Alarm app nahi mila.")
            }
        }
        if (text.contains("battery")) {
            val bm = context.getSystemService(Context.BATTERY_SERVICE) as BatteryManager
            val level = bm.getIntProperty(BatteryManager.BATTERY_PROPERTY_CAPACITY)
            return CommandResult.Handled("Aapke phone ki battery $level% hai.")
        }

        // 8. CALL & SMS (Opens official Dialer / Messages with explicit user confirmation notice)
        if (text.startsWith("call ") || text.startsWith("phone lagao ")) {
            val target = text.removePrefix("call ").removePrefix("phone lagao ").trim()
            val digits = target.replace(Regex("[^\\d+]"), "")
            val dialIntent = Intent(Intent.ACTION_DIAL, Uri.parse("tel:$digits")).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            context.startActivity(dialIntent)
            return CommandResult.Handled("Phone Dialer open kar diya hai — confirm karke call dabayein!")
        }

        if (text.startsWith("sms ") || text.startsWith("message bhejo ")) {
            val target = text.removePrefix("sms ").removePrefix("message bhejo ").trim()
            val smsIntent = Intent(Intent.ACTION_SENDTO, Uri.parse("smsto:")).apply {
                putExtra("sms_body", target)
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            return try {
                context.startActivity(smsIntent)
                CommandResult.Handled("Messages app draft open kar diya hai!")
            } catch (_: Exception) {
                CommandResult.NotInstalled("Messages", "SMS / Messages app installed nahi hai.")
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
        } catch (_: Exception) {
            launchFirstAvailable("Settings", listOf("com.android.settings"))
        }
    }

    private fun launchFirstAvailable(displayName: String, packages: List<String>): CommandResult {
        for (pkg in packages) {
            if (discovery.isPackageInstalled(pkg)) {
                return launchPackageDirectly(pkg)
            }
        }
        return CommandResult.NotInstalled(
            displayName,
            "$displayName aapke phone me installed nahi mila."
        )
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
