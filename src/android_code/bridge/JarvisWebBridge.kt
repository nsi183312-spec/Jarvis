package com.jarvis.ai.bridge

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.provider.Settings
import android.webkit.JavascriptInterface
import com.jarvis.ai.discovery.InstalledAppDiscovery
import com.jarvis.ai.router.CommandResult
import com.jarvis.ai.router.CommandRouter
import com.jarvis.ai.service.JarvisAccessibilityService
import org.json.JSONObject

/**
 * Restricted, explicit-allowlist JavaScript bridge exposed to trusted JARVIS Web UI origins.
 * Never exposes arbitrary reflection, filesystem access, or security bypass methods.
 */
class JarvisWebBridge(
    private val context: Context,
    private val currentOriginProvider: () -> String
) {
    private val discovery = InstalledAppDiscovery(context)
    private val router = CommandRouter(context, discovery)

    companion object {
        private val TRUSTED_HOSTS = setOf(
            "localhost",
            "127.0.0.1"
        )

        private val APPROVED_ACTIONS = setOf(
            "open_app",
            "open_app_name",
            "youtube_play",
            "youtube_search",
            "maps_navigate",
            "chrome_open_url",
            "whatsapp_send",
            "gmail_compose",
            "pinterest_search",
            "store_search",
            "in_app_search",
            "open_url",
            "open_dialer",
            "open_camera",
            "open_gallery",
            "open_settings",
            "open_sub_settings",
            "open_wifi_settings",
            "open_bluetooth_settings",
            "open_data_settings",
            "call",
            "sms",
            "alarm",
            "flashlight",
            "mobile_data",
            "wifi",
            "bluetooth",
            "hotspot",
            "airplane_mode",
            "dnd",
            "volume",
            "brightness",
            "music_next",
            "music_prev",
            "music_pause",
            "scroll_down",
            "scroll_up",
            "click",
            "type",
            "screenshot",
            "go_home",
            "go_back",
            "recents"
        )

        fun isTrustedOrigin(urlString: String?): Boolean {
            if (urlString.isNullOrBlank()) return false
            return try {
                val uri = Uri.parse(urlString)
                val host = uri.host?.lowercase() ?: return false
                val scheme = uri.scheme?.lowercase() ?: return false
                if (scheme == "http" && host in TRUSTED_HOSTS) return true
                scheme == "https" && (host in TRUSTED_HOSTS || host.endsWith(".run.app"))
            } catch (_: Exception) {
                false
            }
        }
    }

    private fun jsonResult(
        ok: Boolean,
        status: String,
        message: String,
        installed: Boolean? = null,
        requiresPermission: String? = null
    ): String {
        return JSONObject().apply {
            put("ok", ok)
            put("status", status)
            put("message", message)
            if (installed != null) put("installed", installed)
            if (requiresPermission != null) put("requiresPermission", requiresPermission)
        }.toString()
    }

    @JavascriptInterface
    fun getBridgeVersion(): String = "2.0.0"

    @JavascriptInterface
    fun getInstalledAppsJson(): String {
        if (!isTrustedOrigin(currentOriginProvider())) return "[]"
        return discovery.toJsonString()
    }

    @JavascriptInterface
    fun isAppAllowed(packageName: String): Boolean {
        if (!isTrustedOrigin(currentOriginProvider())) return false
        return discovery.isAppAllowed(packageName)
    }

    @JavascriptInterface
    fun setAppAllowed(packageName: String, allowed: Boolean): Boolean {
        if (!isTrustedOrigin(currentOriginProvider())) return false
        discovery.setAppAllowed(packageName, allowed)
        return true
    }

    @JavascriptInterface
    fun isAccessibilityEnabled(): Boolean {
        if (!isTrustedOrigin(currentOriginProvider())) return false
        return JarvisAccessibilityService.isRunning
    }

    @JavascriptInterface
    fun openAccessibilitySettings(): Boolean {
        if (!isTrustedOrigin(currentOriginProvider())) return false
        return try {
            val intent = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            context.startActivity(intent)
            true
        } catch (_: Exception) {
            false
        }
    }

    @JavascriptInterface
    fun executeCommand(action: String, payload: String?): String {
        if (!isTrustedOrigin(currentOriginProvider())) {
            return jsonResult(false, "blocked_action", "Untrusted web origin rejected by JarvisWebBridge.")
        }
        if (action !in APPROVED_ACTIONS) {
            return jsonResult(false, "blocked_action", "Action '$action' is not in the approved bridge allowlist.")
        }

        val arg = payload?.trim().orEmpty()
        val mappedTextCommand = when (action) {
            "open_app" -> {
                if (!discovery.isPackageInstalled(arg)) {
                    return jsonResult(
                        ok = false,
                        status = "not_installed",
                        message = "Yeh app ($arg) aapke phone me installed nahi hai.",
                        installed = false
                    )
                }
                if (!discovery.isAppAllowed(arg)) {
                    return jsonResult(
                        ok = false,
                        status = "permission_denied",
                        message = "App permission off hai: User ne $arg ko control karne ki permission disable ki hai.",
                        installed = true
                    )
                }
                return handleRouterResult(router.launchPackageDirectly(arg))
            }
            "open_app_name" -> "open $arg"
            "youtube_play", "youtube_search" -> "youtube search $arg"
            "maps_navigate" -> "maps navigate $arg"
            "chrome_open_url" -> "chrome open $arg"
            "whatsapp_send" -> "whatsapp message $arg"
            "gmail_compose" -> "gmail send $arg"
            "pinterest_search" -> "pinterest search $arg"
            "store_search" -> "play store search $arg"
            "in_app_search" -> {
                val sep = arg.indexOf('|')
                if (sep > 0) {
                    val appPart = arg.substring(0, sep).trim()
                    val qPart = arg.substring(sep + 1).trim()
                    "$appPart mein $qPart search karo"
                } else {
                    "open $arg"
                }
            }
            "open_dialer" -> "open phone"
            "open_camera" -> "open camera"
            "open_gallery" -> "open gallery"
            "open_settings" -> "open settings"
            "open_wifi_settings" -> "wifi setting"
            "open_bluetooth_settings" -> "bluetooth setting"
            "open_data_settings" -> "data setting"
            "open_sub_settings" -> arg.ifEmpty { "open settings" }
            "open_url" -> "chrome open $arg"
            "call" -> "call $arg"
            "sms" -> "sms $arg"
            "alarm" -> "set alarm $arg"
            "flashlight" -> if (arg == "true") "flashlight on" else "flashlight off"
            "mobile_data" -> if (arg == "true") "data on" else "data off"
            "wifi" -> if (arg == "true") "wifi on" else "wifi off"
            "bluetooth" -> if (arg == "true") "bluetooth on" else "bluetooth off"
            "hotspot" -> "hotspot"
            "airplane_mode" -> "airplane mode"
            "dnd" -> if (arg == "true") "dnd on" else "dnd off"
            "volume" -> "volume $arg"
            "brightness" -> "brightness $arg"
            "music_next" -> "music next"
            "music_prev" -> "music previous"
            "music_pause" -> "music pause"
            "scroll_down" -> "scroll down"
            "scroll_up" -> "scroll up"
            "click" -> "click $arg"
            "type" -> "type $arg"
            "screenshot" -> "screenshot"
            "go_home" -> "go home"
            "go_back" -> "go back"
            "recents" -> "recent apps"
            else -> arg
        }

        return handleRouterResult(router.routeCommand(mappedTextCommand))
    }

    private fun handleRouterResult(result: CommandResult): String {
        return when (result) {
            is CommandResult.Handled -> jsonResult(true, "executed", result.message, installed = true)
            is CommandResult.NotInstalled -> jsonResult(false, "not_installed", result.reason, installed = false)
            is CommandResult.PermissionDenied -> jsonResult(
                false,
                "permission_denied",
                result.reason,
                requiresPermission = result.permissionType
            )
            is CommandResult.Error -> jsonResult(false, "error", result.reason)
            is CommandResult.NeedsAiProcessing -> jsonResult(false, "error", "Unsupported bridge command.")
        }
    }
}
