package com.jarvis.ai.discovery

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
 * Queries ONLY real installed and launchable applications on the device.
 * Never invents fake applications.
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

            // Verify launch intent really exists
            if (packageManager.getLaunchIntentForPackage(pkgName) == null) continue

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

        return discovered.sortedBy { it.appName.lowercase() }
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
        return packageManager.getLaunchIntentForPackage(packageName) != null
    }

    fun isAppAllowed(packageName: String): Boolean {
        return prefs.getBoolean("allow_$packageName", true)
    }

    fun setAppAllowed(packageName: String, allowed: Boolean) {
        prefs.edit().putBoolean("allow_$packageName", allowed).apply()
    }

    fun findBestMatchingInstalledApp(spokenName: String): InstalledAppInfo? {
        val clean = spokenName.trim().lowercase()
        if (clean.isEmpty()) return null
        val apps = discoverLaunchableApps()

        // 1. Exact package or label match
        apps.firstOrNull {
            it.appName.lowercase() == clean || it.packageName.lowercase() == clean
        }?.let { return it }

        // 2. Contains match
        return apps.firstOrNull {
            it.appName.lowercase().contains(clean) || clean.contains(it.appName.lowercase())
        }
    }
}
