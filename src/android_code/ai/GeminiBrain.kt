package com.jarvis.ai.ai

import com.google.ai.client.generativeai.GenerativeModel
import com.google.ai.client.generativeai.type.content
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class GeminiBrain(private val apiKey: String) {

    private val systemInstruction = """
        You are JARVIS AI, a cute, intelligent, and friendly Indian female personal voice assistant.
        Your tone is sweet, soft, polite, enthusiastic, and conversational.
        You understand and speak fluent Hindi, English, and Hinglish.
        Default greeting: "Hello! Main JARVIS hoon. Aap bataiye, main aaj aapki kya help kar sakti hoon?"
        
        Keep responses concise (1-3 sentences) suitable for voice speech.
        Classify actionable device commands clearly (e.g. apps, flashlight, alarms, volume, calls).
    """.trimIndent()

    private val generativeModel by lazy {
        GenerativeModel(
            modelName = "gemini-2.5-flash",
            apiKey = apiKey,
            systemInstruction = content { text(systemInstruction) }
        )
    }

    suspend fun generateReply(prompt: String): String = withContext(Dispatchers.IO) {
        try {
            val response = generativeModel.generateContent(prompt)
            response.text ?: "Ji, main sun rahi hoon. Aap kya kehna chahte hain?"
        } catch (e: Exception) {
            "Maaf kijiye, main connect nahi ho paayi. Kripya check karein ki internet connection theek hai."
        }
    }
}
