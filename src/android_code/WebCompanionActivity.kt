package com.jarvis.ai

import android.annotation.SuppressLint
import android.os.Bundle
import android.webkit.PermissionRequest
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.ComponentActivity
import com.jarvis.ai.bridge.JarvisWebBridge

/**
 * Hosted JARVIS Web Companion Activity.
 * Loads the hosted JARVIS AI web UI inside a hardened WebView and binds
 * the restricted JarvisAndroid bridge ONLY to verified trusted origins.
 */
class WebCompanionActivity : ComponentActivity() {

    companion object {
        const val EXTRA_WEB_URL = "extra_web_url"
        const val DEFAULT_HOSTED_URL =
            "https://ais-pre-q47hvojn7ote7pwkpdldda-473929764636.asia-southeast1.run.app"
    }

    private lateinit var webView: WebView
    private var currentUrl: String = DEFAULT_HOSTED_URL

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val requestedUrl = intent.getStringExtra(EXTRA_WEB_URL) ?: DEFAULT_HOSTED_URL
        currentUrl = if (JarvisWebBridge.isTrustedOrigin(requestedUrl)) requestedUrl else DEFAULT_HOSTED_URL

        webView = WebView(this).apply {
            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true
            settings.mediaPlaybackRequiresUserGesture = false
            settings.mixedContentMode = WebSettings.MIXED_CONTENT_NEVER_ALLOW
            settings.allowFileAccess = false
            settings.allowContentAccess = false

            webViewClient = object : WebViewClient() {
                override fun shouldOverrideUrlLoading(
                    view: WebView?,
                    request: WebResourceRequest?
                ): Boolean {
                    val target = request?.url?.toString() ?: return false
                    return !JarvisWebBridge.isTrustedOrigin(target)
                }

                override fun onPageFinished(view: WebView?, url: String?) {
                    super.onPageFinished(view, url)
                    if (url != null) currentUrl = url
                }
            }

            webChromeClient = object : WebChromeClient() {
                override fun onPermissionRequest(request: PermissionRequest?) {
                    if (request != null && JarvisWebBridge.isTrustedOrigin(currentUrl)) {
                        request.grant(request.resources)
                    } else {
                        request?.deny()
                    }
                }
            }

            addJavascriptInterface(
                JarvisWebBridge(applicationContext) { currentUrl },
                "JarvisAndroid"
            )
            loadUrl(currentUrl)
        }

        setContentView(webView)
    }

    @Deprecated("Deprecated in Java")
    override fun onBackPressed() {
        if (this::webView.isInitialized && webView.canGoBack()) {
            webView.goBack()
        } else {
            super.onBackPressed()
        }
    }
}
