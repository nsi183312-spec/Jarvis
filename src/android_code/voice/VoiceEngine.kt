package com.jarvis.ai.voice

import android.content.Context
import android.speech.tts.TextToSpeech
import android.speech.tts.UtteranceProgressListener
import android.speech.tts.Voice
import android.util.Log
import java.util.Locale

class VoiceEngine(
    private val context: Context,
    private val onInitComplete: (Boolean) -> Unit,
    private val onSpeakingStateChanged: (Boolean) -> Unit
) : TextToSpeech.OnInitListener {

    private var tts: TextToSpeech? = null
    var isReady: Boolean = false
        private set

    var speechPitch: Float = 1.15f // Slightly higher pitch for cute sweet female tone
    var speechRate: Float = 1.0f  // Natural conversational speed

    init {
        tts = TextToSpeech(context, this)
    }

    override fun onInit(status: Int) {
        if (status == TextToSpeech.SUCCESS) {
            configureIndianFemaleVoice()
            setupUtteranceListener()
            isReady = true
            onInitComplete(true)
        } else {
            Log.e("VoiceEngine", "TTS initialization failed with code: $status")
            onInitComplete(false)
        }
    }

    /**
     * Inspects available TTS voices to find and set a sweet Indian female voice.
     * Verifies presence rather than assuming.
     */
    private fun configureIndianFemaleVoice() {
        val ttsInstance = tts ?: return

        val hindiLocale = Locale("hi", "IN")
        val englishIndiaLocale = Locale("en", "IN")

        // First attempt: search for installed voices
        val availableVoices: Set<Voice>? = try {
            ttsInstance.voices
        } catch (e: Exception) {
            null
        }

        var selectedVoice: Voice? = null

        if (!availableVoices.isNullOrEmpty()) {
            // Find female voices in hi-IN or en-IN
            selectedVoice = availableVoices.find { voice ->
                val name = voice.name.lowercase()
                val locale = voice.locale
                val isIndianLocale = (locale.language == "hi" && locale.country == "IN") ||
                        (locale.language == "en" && locale.country == "IN")
                val isFemale = name.contains("female") || name.contains("woman") ||
                        name.contains("f0") || name.contains("-f-") || name.contains("fem")
                !voice.isNetworkConnectionRequired && isIndianLocale && isFemale
            } ?: availableVoices.find { voice ->
                val locale = voice.locale
                locale.language == "hi" || (locale.language == "en" && locale.country == "IN")
            }
        }

        if (selectedVoice != null) {
            ttsInstance.voice = selectedVoice
            Log.d("VoiceEngine", "Selected verified Indian voice: ${selectedVoice.name}")
        } else {
            // Fallback to standard Hindi locale
            val result = ttsInstance.setLanguage(hindiLocale)
            if (result == TextToSpeech.LANG_MISSING_DATA || result == TextToSpeech.LANG_NOT_SUPPORTED) {
                ttsInstance.setLanguage(englishIndiaLocale)
            }
        }

        ttsInstance.setPitch(speechPitch)
        ttsInstance.setSpeechRate(speechRate)
    }

    private fun setupUtteranceListener() {
        tts?.setOnUtteranceProgressListener(object : UtteranceProgressListener() {
            override fun onStart(utteranceId: String?) {
                onSpeakingStateChanged(true)
            }

            override fun onDone(utteranceId: String?) {
                onSpeakingStateChanged(false)
            }

            @Deprecated("Deprecated in Java")
            override fun onError(utteranceId: String?) {
                onSpeakingStateChanged(false)
            }
        })
    }

    fun speak(text: String, utteranceId: String = "jarvis_reply") {
        if (!isReady || text.isBlank()) return
        tts?.setPitch(speechPitch)
        tts?.setSpeechRate(speechRate)
        tts?.speak(text, TextToSpeech.QUEUE_FLUSH, null, utteranceId)
    }

    fun stop() {
        tts?.stop()
        onSpeakingStateChanged(false)
    }

    fun shutdown() {
        tts?.stop()
        tts?.shutdown()
        tts = null
        isReady = false
    }
}
