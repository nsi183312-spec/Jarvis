package com.jarvis.ai.service

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.AccessibilityServiceInfo
import android.os.Build
import android.os.Bundle
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo

class JarvisAccessibilityService : AccessibilityService() {

    companion object {
        var instance: JarvisAccessibilityService? = null
            private set

        val isRunning: Boolean
            get() = instance != null
    }

    override fun onServiceConnected() {
        super.onServiceConnected()
        instance = this
        val info = AccessibilityServiceInfo().apply {
            eventTypes = AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED or
                    AccessibilityEvent.TYPE_VIEW_CLICKED or
                    AccessibilityEvent.TYPE_VIEW_SCROLLED
            feedbackType = AccessibilityServiceInfo.FEEDBACK_GENERIC
            flags = AccessibilityServiceInfo.FLAG_REPORT_VIEW_IDS or
                    AccessibilityServiceInfo.FLAG_RETRIEVE_INTERACTIVE_WINDOWS
            notificationTimeout = 100
        }
        serviceInfo = info
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {}

    override fun onInterrupt() {}

    override fun onDestroy() {
        super.onDestroy()
        instance = null
    }

    // Standard Android Navigation Global Actions
    fun performGoHome(): Boolean = performGlobalAction(GLOBAL_ACTION_HOME)
    fun performGoBack(): Boolean = performGlobalAction(GLOBAL_ACTION_BACK)
    fun performOpenRecents(): Boolean = performGlobalAction(GLOBAL_ACTION_RECENTS)
    fun performOpenNotifications(): Boolean = performGlobalAction(GLOBAL_ACTION_NOTIFICATIONS)
    fun performOpenQuickSettings(): Boolean = performGlobalAction(GLOBAL_ACTION_QUICK_SETTINGS)

    fun takeScreenCapture(): Boolean {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            performGlobalAction(GLOBAL_ACTION_TAKE_SCREENSHOT)
        } else false
    }

    /**
     * Safely clicks a button or interactive element by visible text label.
     */
    fun clickElementByText(text: String): Boolean {
        val rootNode = rootInActiveWindow ?: return false
        val nodes = rootNode.findAccessibilityNodeInfosByText(text)
        for (node in nodes) {
            if (node.isClickable) {
                if (node.performAction(AccessibilityNodeInfo.ACTION_CLICK)) return true
            }
            var parent = node.parent
            while (parent != null) {
                if (parent.isClickable) {
                    if (parent.performAction(AccessibilityNodeInfo.ACTION_CLICK)) return true
                }
                parent = parent.parent
            }
        }
        return false
    }

    /**
     * Types text into a targeted input box or search field.
     */
    fun performTypeText(targetHintOrText: String, textToSet: String): Boolean {
        val rootNode = rootInActiveWindow ?: return false
        val nodes = rootNode.findAccessibilityNodeInfosByText(targetHintOrText)
        for (node in nodes) {
            if (node.isEditable) {
                val arguments = Bundle().apply {
                    putCharSequence(AccessibilityNodeInfo.ACTION_ARGUMENT_SET_TEXT_CHARSEQUENCE, textToSet)
                }
                return node.performAction(AccessibilityNodeInfo.ACTION_SET_TEXT, arguments)
            }
        }
        return false
    }

    /**
     * Scroll down on active window.
     */
    fun scrollForward(): Boolean {
        val rootNode = rootInActiveWindow ?: return false
        return scrollNode(rootNode, AccessibilityNodeInfo.ACTION_SCROLL_FORWARD)
    }

    /**
     * Scroll up on active window.
     */
    fun scrollBackward(): Boolean {
        val rootNode = rootInActiveWindow ?: return false
        return scrollNode(rootNode, AccessibilityNodeInfo.ACTION_SCROLL_BACKWARD)
    }

    private fun scrollNode(node: AccessibilityNodeInfo, action: Int): Boolean {
        if (node.isScrollable) {
            return node.performAction(action)
        }
        for (i in 0 until node.childCount) {
            val child = node.getChild(i) ?: continue
            if (scrollNode(child, action)) return true
        }
        return false
    }
}
