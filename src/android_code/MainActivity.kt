package com.jarvis.ai

import android.Manifest
import android.app.Activity
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
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
import com.jarvis.ai.service.JarvisForegroundVoiceService
import com.jarvis.ai.ui.JarvisMainScreen
import com.jarvis.ai.ui.theme.JarvisAITheme
import com.jarvis.ai.viewmodel.AssistantState
import com.jarvis.ai.viewmodel.JarvisViewModel

class MainActivity : ComponentActivity(), RecognitionListener {

    private val viewModel: JarvisViewModel by viewModels()
    private var speechRecognizer: SpeechRecognizer? = null

    // Activity fallback launcher when background SpeechRecognizer service is unavailable on OEM ROMs
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

    // Permission request launcher for multi-permission handling
    private val permissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        val recordAudioGranted = permissions[Manifest.permission.RECORD_AUDIO] ?: false
        val cameraGranted = permissions[Manifest.permission.CAMERA] ?: false
        val contactsGranted = permissions[Manifest.permission.READ_CONTACTS] ?: false

        viewModel.updatePermissions(
            audio = recordAudioGranted,
            camera = cameraGranted,
            contacts = contactsGranted
        )

        if (recordAudioGranted) {
            initSpeechRecognizer()
        } else {
            Toast.makeText(this, "Microphone permission is required for voice assistant", Toast.LENGTH_LONG).show()
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        checkAndRequestPermissions()

        setContent {
            JarvisAITheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    JarvisMainScreen(
                        viewModel = viewModel,
                        onStartListening = { startVoiceInput() },
                        onStopListening = { stopVoiceInput() },
                        onToggleForegroundService = { enable ->
                            toggleForegroundService(enable)
                        }
                    )
                }
            }
        }
    }

    private fun checkAndRequestPermissions() {
        val permissions = mutableListOf(
            Manifest.permission.RECORD_AUDIO,
            Manifest.permission.CAMERA,
            Manifest.permission.READ_CONTACTS
        )
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            permissions.add(Manifest.permission.POST_NOTIFICATIONS)
        }

        val needed = permissions.filter {
            ContextCompat.checkSelfPermission(this, it) != PackageManager.PERMISSION_GRANTED
        }

        if (needed.isNotEmpty()) {
            permissionLauncher.launch(needed.toTypedArray())
        } else {
            initSpeechRecognizer()
            viewModel.updatePermissions(audio = true, camera = true, contacts = true)
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

    private fun buildSpeechIntent(): Intent {
        return Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
            putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
            putExtra(RecognizerIntent.EXTRA_LANGUAGE, "hi-IN")
            putExtra(RecognizerIntent.EXTRA_ADDITIONAL_LANGUAGES, arrayOf("en-IN", "en-US"))
            putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true)
            putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 3)
            putExtra(RecognizerIntent.EXTRA_PROMPT, "JARVIS sun rahi hai... Boliye")
        }
    }

    private fun startVoiceInput() {
        val hasMicPerm = ContextCompat.checkSelfPermission(
            this,
            Manifest.permission.RECORD_AUDIO
        ) == PackageManager.PERMISSION_GRANTED

        if (!hasMicPerm) {
            checkAndRequestPermissions()
            return
        }

        if (!SpeechRecognizer.isRecognitionAvailable(this)) {
            launchSpeechDialogFallback()
            return
        }

        if (speechRecognizer == null) initSpeechRecognizer()
        try {
            speechRecognizer?.startListening(buildSpeechIntent())
            viewModel.setAssistantState(AssistantState.LISTENING)
        } catch (_: Exception) {
            launchSpeechDialogFallback()
        }
    }

    private fun launchSpeechDialogFallback() {
        try {
            viewModel.setAssistantState(AssistantState.LISTENING)
            speechActivityLauncher.launch(buildSpeechIntent())
        } catch (_: Exception) {
            viewModel.setAssistantState(AssistantState.IDLE)
            Toast.makeText(this, "Voice recognition service unavailable on device", Toast.LENGTH_SHORT).show()
        }
    }

    private fun stopVoiceInput() {
        speechRecognizer?.stopListening()
        viewModel.setAssistantState(AssistantState.IDLE)
    }

    private fun toggleForegroundService(enable: Boolean) {
        val intent = Intent(this, JarvisForegroundVoiceService::class.java)
        if (enable) {
            ContextCompat.startForegroundService(this, intent)
        } else {
            stopService(intent)
        }
    }

    // Speech Recognition Callbacks
    override fun onReadyForSpeech(params: Bundle?) {
        viewModel.setAssistantState(AssistantState.LISTENING)
    }
    override fun onBeginningOfSpeech() {
        viewModel.setAssistantState(AssistantState.LISTENING)
    }
    override fun onRmsChanged(rmsdB: Float) {
        val normalized = ((rmsdB + 2f) / 12f).coerceIn(0f, 1f)
        viewModel.updateAudioWaveform(normalized)
    }
    override fun onBufferReceived(buffer: ByteArray?) {}
    override fun onEndOfSpeech() {
        viewModel.setAssistantState(AssistantState.THINKING)
    }
    override fun onError(error: Int) {
        if (error == SpeechRecognizer.ERROR_RECOGNIZER_BUSY) {
            speechRecognizer?.cancel()
            initSpeechRecognizer()
        } else if (error == SpeechRecognizer.ERROR_CLIENT || error == SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS) {
            launchSpeechDialogFallback()
            return
        }
        viewModel.setAssistantState(AssistantState.IDLE)
    }
    override fun onResults(results: Bundle?) {
        val matches = results?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
        if (!matches.isNullOrEmpty()) {
            val userText = matches[0]
            viewModel.processUserInput(userText)
        } else {
            viewModel.setAssistantState(AssistantState.IDLE)
        }
    }
    override fun onPartialResults(partialResults: Bundle?) {
        val matches = partialResults?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
        if (!matches.isNullOrEmpty()) {
            viewModel.setPartialSpokenText(matches[0])
        }
    }
    override fun onEvent(eventType: Int, params: Bundle?) {}

    override fun onDestroy() {
        super.onDestroy()
        speechRecognizer?.destroy()
    }
}
