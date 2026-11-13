package com.jarvis.ai.discovery

import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.pm.ApplicationInfo
import android.content.pm.PackageManager
import android.os.Build
import org.json.JSONArray
import org.json.JSONObject

data class InstalledAppInfo(
    val appName: String,
    val packageName: String,
    val activityName: String,
    val isAllowed: Boolean,
    val isSystemApp: Boolean
)

/**
 * Native Android App Discovery Engine using PackageManager.
 * Dynamically discovers ALL real launchable applications installed on the phone
 * (system, OEM, Play Store, sideloaded) and supports English, Hindi/Devanagari,
 * Hinglish, and fuzzy voice-transcription matching.
 */
class InstalledAppDiscovery(private val context: Context) {

    private val prefs = context.getSharedPreferences("jarvis_allowed_apps_prefs", Context.MODE_PRIVATE)
    private val packageManager: PackageManager = context.packageManager

    fun discoverLaunchableApps(): List<InstalledAppInfo> {
        val mainIntent = Intent(Intent.ACTION_MAIN, null).apply {
            addCategory(Intent.CATEGORY_LAUNCHER)
        }

        val resolveInfos = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            packageManager.queryIntentActivities(
                mainIntent,
                PackageManager.ResolveInfoFlags.of(PackageManager.MATCH_ALL.toLong())
            )
        } else {
            @Suppress("DEPRECATION")
            packageManager.queryIntentActivities(mainIntent, 0)
        }

        val seenPackages = HashSet<String>()
        val discovered = mutableListOf<InstalledAppInfo>()

        for (ri in resolveInfos) {
            val activityInfo = ri.activityInfo ?: continue
            val pkgName = activityInfo.packageName ?: continue
            if (pkgName == context.packageName || !seenPackages.add(pkgName)) continue

            val label = ri.loadLabel(packageManager)?.toString()?.trim().orEmpty()
            if (label.isEmpty()) continue

            val isSys = (activityInfo.applicationInfo.flags and ApplicationInfo.FLAG_SYSTEM) != 0
            discovered.add(
                InstalledAppInfo(
                    appName = label,
                    packageName = pkgName,
                    activityName = activityInfo.name ?: "",
                    isAllowed = isAppAllowed(pkgName),
                    isSystemApp = isSys
                )
            )
        }

        // Secondary sweep across installed applications in case an OEM launcher exposes
        // a launchable package via getLaunchIntentForPackage omitted by queryIntentActivities
        val installedApps = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            packageManager.getInstalledApplications(PackageManager.ApplicationInfoFlags.of(0L))
        } else {
            @Suppress("DEPRECATION")
            packageManager.getInstalledApplications(0)
        }

        for (appInfo in installedApps) {
            val pkgName = appInfo.packageName ?: continue
            if (pkgName == context.packageName || seenPackages.contains(pkgName)) continue
            val launchIntent = packageManager.getLaunchIntentForPackage(pkgName) ?: continue
            val label = packageManager.getApplicationLabel(appInfo)?.toString()?.trim().orEmpty()
            if (label.isEmpty()) continue

            seenPackages.add(pkgName)
            val isSys = (appInfo.flags and ApplicationInfo.FLAG_SYSTEM) != 0
            discovered.add(
                InstalledAppInfo(
                    appName = label,
                    packageName = pkgName,
                    activityName = launchIntent.component?.className ?: "",
                    isAllowed = isAppAllowed(pkgName),
                    isSystemApp = isSys
                )
            )
        }

        return discovered.sortedBy { it.appName.lowercase() }
    }

    fun buildLaunchIntent(packageName: String): Intent? {
        packageManager.getLaunchIntentForPackage(packageName)?.let {
            it.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            return it
        }
        val match = discoverLaunchableApps().firstOrNull {
            it.packageName == packageName && it.activityName.isNotEmpty()
        } ?: return null

        return Intent(Intent.ACTION_MAIN).apply {
            addCategory(Intent.CATEGORY_LAUNCHER)
            component = ComponentName(match.packageName, match.activityName)
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_RESET_TASK_IF_NEEDED
        }
    }

    fun toJsonString(): String {
        val arr = JSONArray()
        for (app in discoverLaunchableApps()) {
            val obj = JSONObject().apply {
                put("appName", app.appName)
                put("packageName", app.packageName)
                put("activityName", app.activityName)
                put("isAllowed", app.isAllowed)
                put("isSystemApp", app.isSystemApp)
            }
            arr.put(obj)
        }
        return arr.toString()
    }

    fun isPackageInstalled(packageName: String): Boolean {
        if (packageManager.getLaunchIntentForPackage(packageName) != null) return true
        return discoverLaunchableApps().any { it.packageName == packageName }
    }

    fun isAppAllowed(packageName: String): Boolean {
        return prefs.getBoolean("allow_$packageName", true)
    }

    fun setAppAllowed(packageName: String, allowed: Boolean) {
        prefs.edit().putBoolean("allow_$packageName", allowed).apply()
    }

    fun findBestMatchingInstalledApp(spokenName: String): InstalledAppInfo? {
        val normalizedInput = normalizeSpokenQuery(spokenName)
        if (normalizedInput.isEmpty()) return null

        val cleanNorm = normalizedInput.replace(Regex("[^a-z0-9]"), "")
        if (cleanNorm.isEmpty()) return null

        val apps = discoverLaunchableApps()
        var bestApp: InstalledAppInfo? = null
        var bestScore = 0.0

        val ignoredPkgTokens = setOf("com", "org", "net", "in", "android", "google", "apps", "app", "mobile")

        for (app in apps) {
            val labelLower = app.appName.lowercase().trim()
            val labelNorm = labelLower.replace(Regex("[^a-z0-9]"), "")
            val pkgLower = app.packageName.lowercase()
            val pkgTokens = pkgLower.split('.').filter { it.isNotEmpty() && it !in ignoredPkgTokens }
            val labelWords = labelLower.split(Regex("\\s+")).map { it.replace(Regex("[^a-z0-9]"), "") }

            val score = when {
                labelLower == normalizedInput || labelNorm == cleanNorm || pkgLower == normalizedInput -> 1.0
                labelWords.any { it == cleanNorm } -> 0.94
                pkgTokens.any { it == cleanNorm } -> 0.92
                labelNorm.startsWith(cleanNorm) || (labelNorm.length >= 3 && cleanNorm.startsWith(labelNorm)) -> 0.88
                labelNorm.contains(cleanNorm) || (labelNorm.length >= 3 && cleanNorm.contains(labelNorm)) -> 0.84
                else -> {
                    val sim = diceSimilarity(cleanNorm, labelNorm)
                    if (sim >= 0.68) sim * 0.82 else 0.0
                }
            }

            if (score > bestScore) {
                bestScore = score
                bestApp = app
            }
        }

        return if (bestScore >= 0.58) bestApp else null
    }

    private fun normalizeSpokenQuery(raw: String): String {
        var s = raw.trim().lowercase()
        val hindiAliases = listOf(
            "फेसबुक" to "facebook", "फ़ेसबुक" to "facebook",
            "इंस्टाग्राम" to "instagram", "इंस्टा" to "instagram",
            "व्हाट्सएप" to "whatsapp", "व्हाट्सऐप" to "whatsapp", "वॉट्सऐप" to "whatsapp",
            "यूट्यूब" to "youtube", "क्रोम" to "chrome", "जीमेल" to "gmail",
            "फ्लिपकार्ट" to "flipkart", "अमेज़न" to "amazon", "अमेजन" to "amazon",
            "पेटीएम" to "paytm", "फोनपे" to "phonepe", "गूगल पे" to "google pay",
            "मैप्स" to "maps", "गैलरी" to "gallery", "फोटो" to "photos",
            "कैमरा" to "camera", "सेटिंग्स" to "settings", "टेलीग्राम" to "telegram",
            "स्नैपचैट" to "snapchat", "स्पॉटिफाई" to "spotify", "हॉटस्टार" to "hotstar",
            "नेटफ्लिक्स" to "netflix", "ट्रूकॉलर" to "truecaller", "ज़ोमैटो" to "zomato",
            "स्विगी" to "swiggy", "खोलो" to "open", "ओपन" to "open", "करो" to "karo",
            "चलाओ" to "chalao", "चालू" to "chalu", "ऐप" to "app"
        )
        for ((hi, en) in hindiAliases) {
            s = s.replace(hi, " $en ")
        }
        s = transliterateDevanagari(s)
        return s
            .replace(Regex("\\b(open|kholo|kholiye|khole|khol|launch|start|chalu|chalao|karo|do|app|application|please|jarvis|mein|me|par|pe)\\b"), " ")
            .replace(Regex("\\s+"), " ")
            .trim()
    }

    private fun transliterateDevanagari(text: String): String {
        if (!text.any { it in '\u0900'..'\u097F' }) return text
        val map = mapOf(
            'क' to "k", 'ख' to "kh", 'ग' to "g", 'घ' to "gh",
            'च' to "ch", 'छ' to "chh", 'ज' to "j", 'झ' to "jh",
            'ट' to "t", 'ठ' to "th", 'ड' to "d", 'ढ' to "dh", 'ण' to "n",
            'त' to "t", 'थ' to "th", 'द' to "d", 'ध' to "dh", 'न' to "n",
            'प' to "p", 'फ' to "f", 'ब' to "b", 'भ' to "bh", 'म' to "m",
            'य' to "y", 'र' to "r", 'ल' to "l", 'व' to "v",
            'श' to "sh", 'ष' to "sh", 'स' to "s", 'ह' to "h",
            'अ' to "a", 'आ' to "a", 'इ' to "i", 'ई' to "ee",
            'उ' to "u", 'ऊ' to "oo", 'ए' to "e", 'ऐ' to "ai",
            'ओ' to "o", 'औ' to "au",
            'ा' to "a", 'ि' to "i", 'ी' to "ee", 'ु' to "u",
            'ू' to "oo", 'े' to "e", 'ै' to "ai", 'ो' to "o",
            'ौ' to "au", 'ं' to "n", 'ँ' to "n", '्' to "", '़' to ""
        )
        val sb = StringBuilder()
        for (i in text.indices) {
            val ch = text[i]
            val mapped = map[ch]
            if (mapped != null) {
                sb.append(mapped)
                val isConsonant = ch in '\u0915'..'\u0939'
                val next = if (i + 1 < text.length) text[i + 1] else null
                if (isConsonant && next != null && next in '\u0915'..'\u0939') {
                    sb.append('a')
                }
            } else {
                sb.append(ch)
            }
        }
        return sb.toString()
    }

    private fun diceSimilarity(a: String, b: String): Double {
        if (a == b) return 1.0
        if (a.length < 2 || b.length < 2) return 0.0
        val bigramsA = HashMap<String, Int>()
        for (i in 0 until a.length - 1) {
            val bg = a.substring(i, i + 2)
            bigramsA[bg] = (bigramsA[bg] ?: 0) + 1
        }
        var intersection = 0
        for (i in 0 until b.length - 1) {
            val bg = b.substring(i, i + 2)
            val count = bigramsA[bg] ?: 0
            if (count > 0) {
                bigramsA[bg] = count - 1
                intersection++
            }
        }
        return (2.0 * intersection) / ((a.length - 1) + (b.length - 1))
    }
}
