import React, { useState, useEffect, useRef } from 'react';
import { AssistantState, AvatarMood } from '../types';
import { THEMES, ThemeConfig } from '../theme';
import permanentAvatarDefault from '../assets/jarvis_avatar.jpg';
import {
  Sparkles,
  Upload,
  RotateCcw,
  Volume2,
  Mic,
  Cpu,
  Radio,
  Smile,
  Heart,
  Eye,
  Brain,
  Feather,
} from 'lucide-react';

interface AvatarViewProps {
  state: AssistantState;
  audioLevel?: number;
  isSpeaking?: boolean;
  mood?: AvatarMood;
  theme?: ThemeConfig;
  onMoodChange?: (mood: AvatarMood) => void;
  onAvatarClick?: () => void;
}

const MOOD_CONFIG: Record<
  AvatarMood,
  {
    label: string;
    hindiLabel: string;
    auraGradient: string;
    ringBorder: string;
    frameGradient: string;
    glowRgba: string;
    tintOverlay: string;
    badgeColor: string;
    blushOpacity: number;
    icon: React.ReactNode;
  }
> = {
  calm: {
    label: 'Calm',
    hindiLabel: 'Shant',
    auraGradient: 'from-blue-500 via-cyan-500 to-indigo-600',
    ringBorder: 'border-blue-400/50',
    frameGradient: 'from-cyan-500 via-blue-500 to-indigo-600',
    glowRgba: 'rgba(59,130,246,0.45)',
    tintOverlay: 'from-blue-500/10 via-transparent to-cyan-500/15',
    badgeColor: 'text-blue-300 border-blue-500/40 bg-blue-950/70',
    blushOpacity: 0.15,
    icon: <Feather className="w-3 h-3" />,
  },
  happy: {
    label: 'Happy',
    hindiLabel: 'Khush',
    auraGradient: 'from-pink-500 via-purple-500 to-cyan-400',
    ringBorder: 'border-pink-400/70',
    frameGradient: 'from-pink-400 via-purple-500 to-cyan-400',
    glowRgba: 'rgba(236,72,153,0.55)',
    tintOverlay: 'from-pink-500/15 via-transparent to-purple-500/20',
    badgeColor: 'text-pink-300 border-pink-400/50 bg-pink-950/70',
    blushOpacity: 0.45,
    icon: <Smile className="w-3 h-3" />,
  },
  playful: {
    label: 'Playful',
    hindiLabel: 'Chulbuli',
    auraGradient: 'from-fuchsia-500 via-violet-500 to-cyan-400',
    ringBorder: 'border-fuchsia-400/75',
    frameGradient: 'from-fuchsia-500 via-cyan-400 to-violet-500',
    glowRgba: 'rgba(217,70,239,0.55)',
    tintOverlay: 'from-fuchsia-500/15 via-transparent to-cyan-400/20',
    badgeColor: 'text-fuchsia-300 border-fuchsia-400/50 bg-fuchsia-950/70',
    blushOpacity: 0.4,
    icon: <Sparkles className="w-3 h-3" />,
  },
  curious: {
    label: 'Curious',
    hindiLabel: 'Jigyasu',
    auraGradient: 'from-cyan-400 via-teal-500 to-blue-600',
    ringBorder: 'border-cyan-400/75',
    frameGradient: 'from-teal-400 via-cyan-500 to-blue-500',
    glowRgba: 'rgba(6,182,212,0.55)',
    tintOverlay: 'from-cyan-400/15 via-transparent to-teal-500/15',
    badgeColor: 'text-cyan-300 border-cyan-400/50 bg-cyan-950/70',
    blushOpacity: 0.2,
    icon: <Eye className="w-3 h-3" />,
  },
  focused: {
    label: 'Focused',
    hindiLabel: 'Ekagra',
    auraGradient: 'from-indigo-500 via-violet-600 to-purple-700',
    ringBorder: 'border-indigo-400/75',
    frameGradient: 'from-indigo-500 via-purple-600 to-blue-600',
    glowRgba: 'rgba(99,102,241,0.55)',
    tintOverlay: 'from-indigo-500/15 via-transparent to-violet-600/20',
    badgeColor: 'text-indigo-300 border-indigo-400/50 bg-indigo-950/70',
    blushOpacity: 0.05,
    icon: <Brain className="w-3 h-3" />,
  },
  empathetic: {
    label: 'Sweet',
    hindiLabel: 'Pyaari',
    auraGradient: 'from-rose-400 via-purple-400 to-indigo-500',
    ringBorder: 'border-rose-300/65',
    frameGradient: 'from-rose-400 via-purple-500 to-indigo-500',
    glowRgba: 'rgba(244,114,182,0.5)',
    tintOverlay: 'from-rose-400/15 via-transparent to-purple-500/15',
    badgeColor: 'text-rose-200 border-rose-400/50 bg-rose-950/70',
    blushOpacity: 0.35,
    icon: <Heart className="w-3 h-3" />,
  },
};

export const AvatarView: React.FC<AvatarViewProps> = ({
  state,
  audioLevel = 0,
  isSpeaking = false,
  mood = 'happy',
  theme = THEMES['cyberpunk-cyan'],
  onMoodChange,
  onAvatarClick,
}) => {
  const [avatarImage, setAvatarImage] = useState<string>(() => {
    return localStorage.getItem('jarvis_custom_avatar') || permanentAvatarDefault;
  });
  const [mouthOpen, setMouthOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Audio-frequency-matched organic breathing animation refs & state
  const targetAudioRef = useRef(0);
  const smoothedAudioRef = useRef(0);
  const breathPhaseRef = useRef(0);
  const [breathMotion, setBreathMotion] = useState({
    scale: 1,
    translateY: 0,
    haloScale: 1,
    haloOpacity: 0.35,
    breathHz: 0.25,
  });

  useEffect(() => {
    targetAudioRef.current = Math.max(0, Math.min(1, audioLevel));
  }, [audioLevel]);

  // Continuous 60fps organic breathing loop whose frequency & amplitude match audioLevel
  useEffect(() => {
    let rafId: number;
    let lastTime = performance.now();

    const animateBreath = (now: number) => {
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;

      // Smooth audio envelope for fluid, biological feel
      const target = targetAudioRef.current;
      const smoothing = target > smoothedAudioRef.current ? 0.22 : 0.08;
      smoothedAudioRef.current += (target - smoothedAudioRef.current) * smoothing;
      const level = smoothedAudioRef.current;

      // Resting breath ~0.25 Hz (4s cycle). As audioLevel rises, breath frequency scales organically up to ~1.4 Hz.
      const stateBaseHz =
        state === 'listening' ? 0.42 : state === 'thinking' ? 0.55 : state === 'speaking' ? 0.65 : 0.25;
      const breathHz = stateBaseHz + level * 1.15;

      breathPhaseRef.current += dt * breathHz * Math.PI * 2;
      const wave = Math.sin(breathPhaseRef.current); // -1 to +1

      // Amplitude expands organically with audio intensity
      const scaleAmplitude = 0.014 + level * 0.036;
      const yAmplitude = 3.2 + level * 4.5;

      const scale = 1 + wave * scaleAmplitude + level * 0.025;
      const translateY = -wave * yAmplitude - level * 2;
      const haloScale = 1.02 + wave * (0.04 + level * 0.08) + level * 0.09;
      const haloOpacity = Math.min(0.85, 0.32 + (wave + 1) * 0.1 + level * 0.38);

      setBreathMotion({
        scale,
        translateY,
        haloScale,
        haloOpacity,
        breathHz,
      });

      rafId = requestAnimationFrame(animateBreath);
    };

    rafId = requestAnimationFrame(animateBreath);
    return () => cancelAnimationFrame(rafId);
  }, [state]);

  // Synchronized mouth movement when speaking
  useEffect(() => {
    if (state === 'speaking' || isSpeaking) {
      const interval = setInterval(() => {
        setMouthOpen((prev) => !prev);
      }, 150);
      return () => clearInterval(interval);
    } else {
      setMouthOpen(false);
    }
  }, [state, isSpeaking]);

  const handleCustomAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setAvatarImage(reader.result);
          localStorage.setItem('jarvis_custom_avatar', reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleResetToPermanent = (e: React.MouseEvent) => {
    e.stopPropagation();
    setAvatarImage(permanentAvatarDefault);
    localStorage.removeItem('jarvis_custom_avatar');
  };

  const activeMood = MOOD_CONFIG[mood] || MOOD_CONFIG.happy;

  const stateConfig = {
    idle: {
      badge: 'JARVIS ONLINE',
      badgeBg: 'bg-blue-950/80 border-blue-500/40 text-blue-300',
      icon: <Radio className="w-3.5 h-3.5 text-blue-400 animate-pulse" />,
    },
    listening: {
      badge: 'LISTENING...',
      badgeBg: 'bg-cyan-950/80 border-cyan-400 text-cyan-200',
      icon: <Mic className="w-3.5 h-3.5 text-cyan-300 animate-bounce" />,
    },
    thinking: {
      badge: 'PROCESSING...',
      badgeBg: 'bg-purple-950/80 border-purple-400 text-purple-200',
      icon: <Cpu className="w-3.5 h-3.5 text-purple-300 animate-spin" />,
    },
    speaking: {
      badge: 'JARVIS SPEAKING',
      badgeBg: 'bg-pink-950/80 border-pink-400 text-pink-200',
      icon: <Volume2 className="w-3.5 h-3.5 text-pink-300 animate-pulse" />,
    },
  }[state];

  const tiltDeg = mood === 'curious' ? 2.5 : mood === 'playful' ? -2 : 0;

  return (
    <div className="relative flex flex-col items-center justify-center py-1 select-none">
      {/* Background Holographic Neon Aura synced with Breathing Frequency */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div
          className={`w-76 h-76 sm:w-96 sm:h-96 rounded-full blur-3xl transition-colors duration-700 bg-gradient-to-r ${activeMood.auraGradient}`}
          style={{
            transform: `scale(${breathMotion.haloScale})`,
            opacity: Math.min(0.9, breathMotion.haloOpacity + 0.14),
          }}
        />
      </div>

      {/* Main Avatar Container */}
      <div
        onClick={onAvatarClick}
        className="relative group cursor-pointer flex items-center justify-center w-64 h-64 sm:w-80 sm:h-80"
      >
        {/* Electric Neon Outer Halo Ring */}
        <div
          className="absolute inset-[-12px] sm:inset-[-16px] rounded-full border border-cyan-400/35 shadow-[0_0_45px_rgba(0,180,255,0.4)] pointer-events-none"
          style={{
            transform: `scale(${1 + (breathMotion.scale - 1) * 0.4})`,
          }}
        />

        {/* Outer Rotating HUD Ring 1 */}
        <div
          className={`absolute inset-0 rounded-full border-2 border-dashed ${activeMood.ringBorder} transition-colors duration-500 pointer-events-none`}
          style={{
            animation: state === 'thinking' ? 'spin 6s linear infinite' : 'spin 24s linear infinite',
            transform: `scale(${1 + (breathMotion.scale - 1) * 0.5})`,
          }}
        />

        {/* Counter-Rotating Orbital Ring 2 */}
        <div
          className={`absolute inset-3 sm:inset-4 rounded-full border-2 ${theme.avatarOrbitalBorder} shadow-[0_0_25px_rgba(56,189,248,0.35)] transition-all duration-500 pointer-events-none`}
          style={{
            animation: 'spin 18s linear infinite reverse',
            borderStyle: 'double',
          }}
        />

        {/* Outer Pulsing Soundwave / Listening Ring */}
        {(state === 'listening' || state === 'speaking') && (
          <div
            className={`absolute inset-[-10px] sm:inset-[-14px] rounded-full border-2 ${
              state === 'listening' ? 'border-cyan-400/60' : 'border-fuchsia-400/60'
            } animate-ping pointer-events-none opacity-45`}
          />
        )}

        {/* Avatar Circular Frame with Organic Audio-Frequency Breathing */}
        <div
          className={`relative w-52 h-52 sm:w-64 sm:h-64 rounded-full overflow-hidden p-[3px] bg-gradient-to-tr ${activeMood.frameGradient} transition-colors duration-500`}
          style={{
            transform: `translateY(${breathMotion.translateY.toFixed(2)}px) scale(${breathMotion.scale.toFixed(4)}) rotate(${tiltDeg}deg)`,
            boxShadow: `0 0 ${Math.round(40 + audioLevel * 38)}px ${activeMood.glowRgba}`,
            willChange: 'transform',
          }}
        >
          {/* Permanent Girl Character Image */}
          <div className="w-full h-full rounded-full overflow-hidden bg-[#02081c] relative">
            <img
              src={avatarImage}
              alt="JARVIS AI Avatar"
              className="w-full h-full object-cover object-top scale-105 transition-transform duration-500 group-hover:scale-110"
            />

            {/* Holographic Scanline Overlay */}
            <div className={`absolute inset-0 bg-gradient-to-b from-transparent ${theme.avatarScanlineVia} to-transparent bg-[length:100%_4px] pointer-events-none opacity-30`} />

            {/* Subtle Mood Blush Accents (keeps face identity untouched) */}
            {activeMood.blushOpacity > 0.1 && (
              <>
                <div
                  className="absolute top-[47%] left-[27%] w-5 h-3 rounded-full bg-pink-400 blur-md pointer-events-none transition-opacity duration-500"
                  style={{ opacity: activeMood.blushOpacity }}
                />
                <div
                  className="absolute top-[47%] right-[27%] w-5 h-3 rounded-full bg-pink-400 blur-md pointer-events-none transition-opacity duration-500"
                  style={{ opacity: activeMood.blushOpacity }}
                />
              </>
            )}

            {/* Speaking Mouth Movement Overlay Sync */}
            {(state === 'speaking' || isSpeaking) && (
              <div className="absolute bottom-[28%] left-1/2 -translate-x-1/2 pointer-events-none transition-all duration-100">
                <div
                  className={`bg-pink-500/80 rounded-full transition-all duration-150 ${
                    mouthOpen ? 'w-4 h-3.5 opacity-90 scale-110' : 'w-3 h-1.5 opacity-60 scale-95'
                  } blur-[0.5px] shadow-[0_0_8px_rgba(244,114,182,0.8)]`}
                />
              </div>
            )}

            {/* Mood-adaptive holographic cybernetic glint */}
            <div
              className={`absolute inset-0 bg-gradient-to-tr ${activeMood.tintOverlay} pointer-events-none transition-all duration-700`}
            />
          </div>
        </div>

        {/* Change/Reset Avatar Hover Controls */}
        <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
          <button
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
            title="Replace avatar with custom reference image"
            className="p-1.5 rounded-full bg-slate-900/90 text-cyan-300 hover:text-white hover:bg-cyan-600 transition border border-cyan-500/40 text-xs shadow-lg"
          >
            <Upload className="w-3.5 h-3.5" />
          </button>
          {avatarImage !== permanentAvatarDefault && (
            <button
              onClick={handleResetToPermanent}
              title="Reset to permanent 3D girl avatar"
              className="p-1.5 rounded-full bg-slate-900/90 text-purple-300 hover:text-white hover:bg-purple-600 transition border border-purple-500/40 text-xs shadow-lg"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleCustomAvatarUpload}
        />
      </div>

      {/* Status + Live Mood Badges */}
      <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
        <div
          className={`flex items-center gap-2 px-3.5 py-1 rounded-full border text-xs font-semibold tracking-wider backdrop-blur-md shadow-md transition-all duration-300 ${stateConfig.badgeBg}`}
        >
          {stateConfig.icon}
          <span>{stateConfig.badge}</span>
          {audioLevel > 0.02 && (
            <span className="text-[10px] text-cyan-300 opacity-85 font-mono">
              {breathMotion.breathHz.toFixed(2)}Hz
            </span>
          )}
        </div>

        <div
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold backdrop-blur-md shadow-md transition-all duration-300 ${activeMood.badgeColor}`}
        >
          {activeMood.icon}
          <span>Mood: {activeMood.label}</span>
        </div>
      </div>

      {/* Quick Mood Selector Strip */}
      {onMoodChange && (
        <div className="mt-2.5 flex flex-wrap items-center justify-center gap-1.5 px-2">
          {(Object.keys(MOOD_CONFIG) as AvatarMood[]).map((mKey) => {
            const cfg = MOOD_CONFIG[mKey];
            const isSelected = mood === mKey;
            return (
              <button
                key={mKey}
                onClick={(e) => {
                  e.stopPropagation();
                  onMoodChange(mKey);
                }}
                className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border flex items-center gap-1 transition-all ${
                  isSelected
                    ? `${cfg.badgeColor} scale-105 shadow-sm`
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                {cfg.icon}
                <span>{cfg.label}</span>
              </button>
            );
          })}
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
