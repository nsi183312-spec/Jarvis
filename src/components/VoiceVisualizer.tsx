import React, { useEffect, useState } from 'react';
import { AssistantState } from '../types';
import { THEMES, ThemeConfig } from '../theme';

interface VoiceVisualizerProps {
  state: AssistantState;
  audioLevel?: number;
  theme?: ThemeConfig;
  mirrored?: boolean;
}

export const VoiceVisualizer: React.FC<VoiceVisualizerProps> = ({
  state,
  audioLevel = 0,
  theme = THEMES['cyberpunk-cyan'],
  mirrored = false,
}) => {
  const bars = 26;
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    let rafId: number;
    let last = performance.now();

    const animate = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const speed =
        state === 'speaking' ? 8 : state === 'listening' ? 6 : state === 'thinking' ? 4.2 : 2.1;
      setPhase((prev) => prev + dt * speed);
      rafId = requestAnimationFrame(animate);
    };

    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [state]);

  return (
    <div className="flex items-center justify-center gap-[2.5px] sm:gap-[3.5px] h-12 sm:h-14 px-1 py-1">
      {Array.from({ length: bars }).map((_, rawIdx) => {
        const index = mirrored ? bars - 1 - rawIdx : rawIdx;
        const progress = index / (bars - 1); // 0 = outer edge, 1 = near center mic
        const envelope = Math.sin(progress * Math.PI); // taller peaks in middle of each wing

        let heightPercent = 16;
        if (state === 'listening') {
          const wave = Math.sin(index * 0.55 + phase) * 0.5 + 0.5;
          heightPercent = Math.max(
            18,
            (22 + envelope * 58 + wave * 24) * (0.78 + audioLevel * 0.75)
          );
        } else if (state === 'speaking') {
          const wave = Math.cos(index * 0.65 + phase) * 0.5 + 0.5;
          heightPercent = Math.max(
            22,
            (24 + envelope * 64 + wave * 26) * (0.8 + audioLevel * 0.6)
          );
        } else if (state === 'thinking') {
          const wave = Math.sin(index * 0.45 + phase) * 0.5 + 0.5;
          heightPercent = 18 + wave * 52;
        } else {
          // Subtle iconic sci-fi cyan-to-violet idle spectrum wave matching screenshot
          const idleWave = Math.sin(index * 0.52 + phase) * 0.5 + 0.5;
          const harmonic = Math.cos(index * 1.15 - phase * 0.7) * 0.5 + 0.5;
          heightPercent = 14 + envelope * 44 * (0.45 + idleWave * 0.55) + harmonic * 16;
        }

        // Color transition across each wing: outer cyan (#22d3ee) -> electric blue (#3b82f6) -> neon purple/pink (#d946ef) near center
        let barStyleClass = '';
        if (theme.id === 'cyberpunk-cyan') {
          barStyleClass =
            progress > 0.62
              ? 'bg-gradient-to-t from-purple-500 via-fuchsia-400 to-pink-300 shadow-[0_0_9px_rgba(217,70,239,0.75)]'
              : progress > 0.3
              ? 'bg-gradient-to-t from-blue-500 via-cyan-400 to-sky-300 shadow-[0_0_9px_rgba(56,189,248,0.7)]'
              : 'bg-gradient-to-t from-cyan-500 via-teal-300 to-cyan-200 shadow-[0_0_8px_rgba(34,211,238,0.65)]';
        } else {
          barStyleClass =
            state === 'listening'
              ? theme.visualizerListeningBar
              : state === 'thinking'
              ? theme.visualizerThinkingBar
              : `bg-gradient-to-t ${theme.swatchGradient} opacity-85`;
        }

        return (
          <div
            key={rawIdx}
            className={`w-[3px] sm:w-[3.5px] rounded-full ${barStyleClass}`}
            style={{
              height: `${Math.min(100, Math.max(10, heightPercent))}%`,
              transition: 'height 0.06s linear',
            }}
          />
        );
      })}
    </div>
  );
};
