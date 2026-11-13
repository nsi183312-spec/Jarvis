package com.jarvis.ai.ui

import androidx.compose.animation.core.*
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.jarvis.ai.R
import com.jarvis.ai.viewmodel.AssistantState
import kotlin.math.PI
import kotlin.math.sin

enum class AvatarMood(val label: String, val accentColor: Color) {
    CALM("Calm", Color(0xFF448AFF)),
    HAPPY("Happy", Color(0xFFFF4081)),
    PLAYFUL("Playful", Color(0xFFE040FB)),
    CURIOUS("Curious", Color(0xFF00E5FF)),
    FOCUSED("Focused", Color(0xFF7C4DFF)),
    EMPATHETIC("Sweet", Color(0xFFFF80AB))
}

@Composable
fun AvatarView(
    state: AssistantState,
    audioLevel: Float,
    mood: AvatarMood = AvatarMood.HAPPY,
    modifier: Modifier = Modifier
) {
    val infiniteTransition = rememberInfiniteTransition(label = "hologram_rotations")

    // Slow orbital ring rotation
    val rotationAngle by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 360f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 12000, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "orbital_ring"
    )

    // Smoothly track audioLevel for organic frequency-matched breathing
    val smoothedAudio by animateFloatAsState(
        targetValue = audioLevel.coerceIn(0f, 1f),
        animationSpec = spring(stiffness = Spring.StiffnessLow),
        label = "smoothed_audio"
    )

    var breathPhase by remember { mutableFloatStateOf(0f) }
    LaunchedEffect(state) {
        var lastNanos = System.nanoTime()
        while (true) {
            withFrameNanos { frameNanos ->
                val dt = ((frameNanos - lastNanos) / 1_000_000_000f).coerceAtMost(0.05f)
                lastNanos = frameNanos
                val baseHz = when (state) {
                    AssistantState.LISTENING -> 0.42f
                    AssistantState.THINKING -> 0.55f
                    AssistantState.SPEAKING -> 0.65f
                    AssistantState.IDLE -> 0.25f
                }
                val breathHz = baseHz + smoothedAudio * 1.15f
                breathPhase += dt * breathHz * (2f * PI.toFloat())
            }
        }
    }

    val breathWave = sin(breathPhase.toDouble()).toFloat()
    val scaleAmplitude = 0.015f + smoothedAudio * 0.036f
    val currentScale = 1f + breathWave * scaleAmplitude + smoothedAudio * 0.025f

    val stateColor = when (state) {
        AssistantState.LISTENING -> Color(0xFF00E5FF)
        AssistantState.THINKING -> Color(0xFFD500F9)
        AssistantState.SPEAKING -> mood.accentColor
        AssistantState.IDLE -> mood.accentColor
    }

    Box(
        modifier = modifier
            .size(280.dp)
            .scale(currentScale),
        contentAlignment = Alignment.Center
    ) {
        // Outer Holographic HUD Ring
        Box(
            modifier = Modifier
                .fillMaxSize()
                .rotate(rotationAngle)
                .border(
                    width = 2.dp,
                    brush = Brush.sweepGradient(
                        colors = listOf(
                            stateColor.copy(alpha = 0.8f),
                            Color.Transparent,
                            stateColor.copy(alpha = 0.4f),
                            Color.Transparent,
                            stateColor.copy(alpha = 0.8f)
                        )
                    ),
                    shape = CircleShape
                )
        )

        // Inner Counter-Rotating HUD Ring
        Box(
            modifier = Modifier
                .size(240.dp)
                .rotate(-rotationAngle * 1.5f)
                .border(
                    width = 1.5.dp,
                    brush = Brush.sweepGradient(
                        colors = listOf(
                            Color(0xFF00E5FF).copy(alpha = 0.6f),
                            Color.Transparent,
                            mood.accentColor.copy(alpha = 0.6f),
                            Color.Transparent
                        )
                    ),
                    shape = CircleShape
                )
        )

        // Permanent Girl Avatar Image (Replaceable asset reference)
        Box(
            modifier = Modifier
                .size(210.dp)
                .clip(CircleShape)
                .background(
                    Brush.radialGradient(
                        colors = listOf(
                            stateColor.copy(alpha = 0.3f),
                            Color(0xFF0B0D19)
                        )
                    )
                )
                .border(3.dp, stateColor, CircleShape)
        ) {
            Image(
                painter = painterResource(id = R.drawable.jarvis_permanent_avatar),
                contentDescription = "JARVIS AI Permanent Avatar",
                contentScale = ContentScale.Crop,
                modifier = Modifier.fillMaxSize()
            )
        }

        // Live holographic badge status + Mood
        Box(
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .offset(y = 12.dp)
                .background(
                    color = Color(0xCC0D1117),
                    shape = RoundedCornerShape(12.dp)
                )
                .border(1.dp, stateColor.copy(alpha = 0.8f), RoundedCornerShape(12.dp))
                .padding(horizontal = 14.dp, vertical = 4.dp)
        ) {
            Text(
                text = when (state) {
                    AssistantState.LISTENING -> "● LISTENING • ${mood.label}"
                    AssistantState.THINKING -> "✦ PROCESSING • ${mood.label}"
                    AssistantState.SPEAKING -> "▶ SPEAKING • ${mood.label}"
                    AssistantState.IDLE -> "JARVIS • ${mood.label}"
                },
                color = stateColor,
                fontSize = 12.sp
            )
        }
    }
}
