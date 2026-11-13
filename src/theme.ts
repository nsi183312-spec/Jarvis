import { ThemeId } from './types';

export interface ThemeConfig {
  id: ThemeId;
  name: string;
  subtitle: string;
  swatchGradient: string;
  swatchDot: string;
  rootBg: string;
  orb1: string;
  orb2: string;
  orb3: string;
  sidebarBg: string;
  sidebarBorder: string;
  statusCardBorder: string;
  statusCardShadow: string;
  activeNavBtn: string;
  navIconActive: string;
  navIconIdle: string;
  navHoverBorder: string;
  mobileHeaderBorder: string;
  mobileTitleGradient: string;
  mobileActiveTab: string;
  heroTitleGradient: string;
  heroHeartColor: string;
  speechBubbleBorder: string;
  speechBubbleShadow: string;
  ctaOutlineBtn: string;
  micIdleBtn: string;
  micListeningBtn: string;
  micRingIdle: string;
  micRingListening: string;
  captionPillBorder: string;
  accentText: string;
  accentTextSecondary: string;
  sendBtn: string;
  inputFocusBorder: string;
  chipHover: string;
  chatUserBubble: string;
  chatAvatarRing: string;
  chatAvatarText: string;
  chatSendBtn: string;
  visualizerIdleBar: string;
  visualizerListeningBar: string;
  visualizerThinkingBar: string;
  avatarOrbitalBorder: string;
  avatarScanlineVia: string;
  cssVars: {
    scrollbar: string;
    scrollbarHover: string;
    selectionBg: string;
    selectionText: string;
  };
}

export const THEMES: Record<ThemeId, ThemeConfig> = {
  'cyberpunk-cyan': {
    id: 'cyberpunk-cyan',
    name: 'Cyberpunk Cyan',
    subtitle: 'Electric cyan, neon cobalt & holographic blue',
    swatchGradient: 'from-cyan-400 via-blue-500 to-purple-500',
    swatchDot: 'bg-cyan-400 shadow-[0_0_10px_#22d3ee]',
    rootBg: 'bg-[#050816]',
    orb1: 'bg-blue-600/20',
    orb2: 'bg-purple-600/20',
    orb3: 'bg-cyan-500/15',
    sidebarBg: 'bg-slate-950/50',
    sidebarBorder: 'border-cyan-500/15',
    statusCardBorder: 'border-cyan-500/30',
    statusCardShadow: 'shadow-[0_0_20px_rgba(6,182,212,0.12)]',
    activeNavBtn:
      'bg-gradient-to-r from-cyan-500/25 to-blue-600/25 border-cyan-400 text-white shadow-[0_0_20px_rgba(6,182,212,0.3)]',
    navIconActive: 'text-cyan-300',
    navIconIdle: 'text-cyan-400/80',
    navHoverBorder: 'hover:border-cyan-500/40',
    mobileHeaderBorder: 'border-cyan-500/15',
    mobileTitleGradient: 'from-cyan-300 to-purple-300',
    mobileActiveTab: 'bg-cyan-500/20 border-cyan-400 text-cyan-200',
    heroTitleGradient: 'from-white via-cyan-200 to-purple-300',
    heroHeartColor: 'text-purple-400 fill-purple-400',
    speechBubbleBorder: 'border-cyan-400/50',
    speechBubbleShadow: 'shadow-[0_0_25px_rgba(6,182,212,0.18)]',
    ctaOutlineBtn:
      'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border-cyan-400/40 text-cyan-200 hover:border-cyan-300',
    micIdleBtn:
      'bg-gradient-to-tr from-cyan-500 via-blue-600 to-purple-600 text-white shadow-[0_0_35px_rgba(56,189,248,0.55)]',
    micListeningBtn:
      'bg-gradient-to-tr from-cyan-400 to-teal-400 text-slate-950 shadow-[0_0_40px_rgba(6,182,212,0.9)]',
    micRingIdle: 'border-cyan-400/50',
    micRingListening: 'border-cyan-300',
    captionPillBorder: 'border-cyan-500/30',
    accentText: 'text-cyan-300',
    accentTextSecondary: 'text-purple-300',
    sendBtn:
      'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500',
    inputFocusBorder: 'focus:border-cyan-400',
    chipHover: 'hover:border-cyan-500/40 hover:text-cyan-200',
    chatUserBubble: 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white',
    chatAvatarRing: 'from-cyan-500 to-purple-600',
    chatAvatarText: 'text-cyan-300',
    chatSendBtn: 'bg-cyan-600 hover:bg-cyan-500',
    visualizerIdleBar: 'bg-blue-500/40',
    visualizerListeningBar: 'bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]',
    visualizerThinkingBar: 'bg-purple-400/80 shadow-[0_0_6px_rgba(168,85,247,0.6)]',
    avatarOrbitalBorder: 'border-cyan-500/35',
    avatarScanlineVia: 'via-cyan-400/10',
    cssVars: {
      scrollbar: 'rgba(56, 189, 248, 0.32)',
      scrollbarHover: 'rgba(56, 189, 248, 0.65)',
      selectionBg: 'rgba(6, 182, 212, 0.3)',
      selectionText: '#a5f3fc',
    },
  },
  'royal-purple': {
    id: 'royal-purple',
    name: 'Royal Purple',
    subtitle: 'Imperial violet, ultraviolet & soft magenta',
    swatchGradient: 'from-violet-400 via-purple-500 to-fuchsia-500',
    swatchDot: 'bg-purple-400 shadow-[0_0_10px_#c084fc]',
    rootBg: 'bg-[#090516]',
    orb1: 'bg-violet-600/25',
    orb2: 'bg-fuchsia-600/20',
    orb3: 'bg-indigo-500/15',
    sidebarBg: 'bg-[#0c071d]/60',
    sidebarBorder: 'border-purple-500/20',
    statusCardBorder: 'border-purple-500/35',
    statusCardShadow: 'shadow-[0_0_20px_rgba(168,85,247,0.16)]',
    activeNavBtn:
      'bg-gradient-to-r from-purple-500/30 to-fuchsia-600/25 border-purple-400 text-white shadow-[0_0_20px_rgba(168,85,247,0.35)]',
    navIconActive: 'text-purple-300',
    navIconIdle: 'text-purple-400/80',
    navHoverBorder: 'hover:border-purple-500/45',
    mobileHeaderBorder: 'border-purple-500/20',
    mobileTitleGradient: 'from-purple-300 to-fuchsia-300',
    mobileActiveTab: 'bg-purple-500/25 border-purple-400 text-purple-200',
    heroTitleGradient: 'from-white via-purple-200 to-fuchsia-300',
    heroHeartColor: 'text-fuchsia-400 fill-fuchsia-400',
    speechBubbleBorder: 'border-purple-400/50',
    speechBubbleShadow: 'shadow-[0_0_25px_rgba(168,85,247,0.22)]',
    ctaOutlineBtn:
      'bg-gradient-to-r from-purple-500/25 to-fuchsia-500/20 border-purple-400/45 text-purple-200 hover:border-purple-300',
    micIdleBtn:
      'bg-gradient-to-tr from-violet-500 via-purple-600 to-fuchsia-600 text-white shadow-[0_0_35px_rgba(168,85,247,0.6)]',
    micListeningBtn:
      'bg-gradient-to-tr from-fuchsia-400 to-purple-400 text-slate-950 shadow-[0_0_40px_rgba(217,70,239,0.9)]',
    micRingIdle: 'border-purple-400/55',
    micRingListening: 'border-fuchsia-300',
    captionPillBorder: 'border-purple-500/35',
    accentText: 'text-purple-300',
    accentTextSecondary: 'text-fuchsia-300',
    sendBtn:
      'bg-gradient-to-r from-violet-500 to-fuchsia-600 hover:from-violet-400 hover:to-fuchsia-500',
    inputFocusBorder: 'focus:border-purple-400',
    chipHover: 'hover:border-purple-500/45 hover:text-purple-200',
    chatUserBubble: 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white',
    chatAvatarRing: 'from-violet-500 to-fuchsia-500',
    chatAvatarText: 'text-purple-300',
    chatSendBtn: 'bg-purple-600 hover:bg-purple-500',
    visualizerIdleBar: 'bg-violet-500/40',
    visualizerListeningBar: 'bg-fuchsia-400 shadow-[0_0_8px_rgba(217,70,239,0.8)]',
    visualizerThinkingBar: 'bg-purple-400/85 shadow-[0_0_6px_rgba(192,132,252,0.7)]',
    avatarOrbitalBorder: 'border-purple-500/40',
    avatarScanlineVia: 'via-purple-400/10',
    cssVars: {
      scrollbar: 'rgba(168, 85, 247, 0.35)',
      scrollbarHover: 'rgba(192, 132, 252, 0.7)',
      selectionBg: 'rgba(168, 85, 247, 0.35)',
      selectionText: '#e9d5ff',
    },
  },
  'deep-emerald': {
    id: 'deep-emerald',
    name: 'Deep Emerald',
    subtitle: 'Bioluminescent jade, mint & deep forest',
    swatchGradient: 'from-emerald-400 via-teal-500 to-cyan-500',
    swatchDot: 'bg-emerald-400 shadow-[0_0_10px_#34d399]',
    rootBg: 'bg-[#03120e]',
    orb1: 'bg-emerald-600/20',
    orb2: 'bg-teal-600/20',
    orb3: 'bg-green-500/15',
    sidebarBg: 'bg-[#041712]/60',
    sidebarBorder: 'border-emerald-500/20',
    statusCardBorder: 'border-emerald-500/35',
    statusCardShadow: 'shadow-[0_0_20px_rgba(16,185,129,0.15)]',
    activeNavBtn:
      'bg-gradient-to-r from-emerald-500/25 to-teal-600/25 border-emerald-400 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)]',
    navIconActive: 'text-emerald-300',
    navIconIdle: 'text-emerald-400/80',
    navHoverBorder: 'hover:border-emerald-500/45',
    mobileHeaderBorder: 'border-emerald-500/20',
    mobileTitleGradient: 'from-emerald-300 to-teal-300',
    mobileActiveTab: 'bg-emerald-500/20 border-emerald-400 text-emerald-200',
    heroTitleGradient: 'from-white via-emerald-200 to-teal-300',
    heroHeartColor: 'text-emerald-400 fill-emerald-400',
    speechBubbleBorder: 'border-emerald-400/50',
    speechBubbleShadow: 'shadow-[0_0_25px_rgba(16,185,129,0.2)]',
    ctaOutlineBtn:
      'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border-emerald-400/45 text-emerald-200 hover:border-emerald-300',
    micIdleBtn:
      'bg-gradient-to-tr from-emerald-500 via-teal-600 to-cyan-600 text-white shadow-[0_0_35px_rgba(16,185,129,0.55)]',
    micListeningBtn:
      'bg-gradient-to-tr from-emerald-400 to-lime-300 text-slate-950 shadow-[0_0_40px_rgba(52,211,153,0.9)]',
    micRingIdle: 'border-emerald-400/55',
    micRingListening: 'border-emerald-300',
    captionPillBorder: 'border-emerald-500/35',
    accentText: 'text-emerald-300',
    accentTextSecondary: 'text-teal-300',
    sendBtn:
      'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500',
    inputFocusBorder: 'focus:border-emerald-400',
    chipHover: 'hover:border-emerald-500/45 hover:text-emerald-200',
    chatUserBubble: 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white',
    chatAvatarRing: 'from-emerald-400 to-teal-600',
    chatAvatarText: 'text-emerald-300',
    chatSendBtn: 'bg-emerald-600 hover:bg-emerald-500',
    visualizerIdleBar: 'bg-emerald-500/40',
    visualizerListeningBar: 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.85)]',
    visualizerThinkingBar: 'bg-teal-400/80 shadow-[0_0_6px_rgba(45,212,191,0.65)]',
    avatarOrbitalBorder: 'border-emerald-500/40',
    avatarScanlineVia: 'via-emerald-400/10',
    cssVars: {
      scrollbar: 'rgba(16, 185, 129, 0.35)',
      scrollbarHover: 'rgba(52, 211, 153, 0.7)',
      selectionBg: 'rgba(16, 185, 129, 0.32)',
      selectionText: '#a7f3d0',
    },
  },
  'crimson-rose': {
    id: 'crimson-rose',
    name: 'Crimson Rose',
    subtitle: 'Sakura pink, ruby neon & warm amber',
    swatchGradient: 'from-rose-400 via-pink-500 to-amber-400',
    swatchDot: 'bg-rose-400 shadow-[0_0_10px_#fb7185]',
    rootBg: 'bg-[#140610]',
    orb1: 'bg-rose-600/20',
    orb2: 'bg-pink-600/20',
    orb3: 'bg-amber-500/15',
    sidebarBg: 'bg-[#180813]/60',
    sidebarBorder: 'border-rose-500/20',
    statusCardBorder: 'border-rose-500/35',
    statusCardShadow: 'shadow-[0_0_20px_rgba(244,63,94,0.16)]',
    activeNavBtn:
      'bg-gradient-to-r from-rose-500/25 to-pink-600/25 border-rose-400 text-white shadow-[0_0_20px_rgba(244,63,94,0.3)]',
    navIconActive: 'text-rose-300',
    navIconIdle: 'text-rose-400/80',
    navHoverBorder: 'hover:border-rose-500/45',
    mobileHeaderBorder: 'border-rose-500/20',
    mobileTitleGradient: 'from-rose-300 to-amber-200',
    mobileActiveTab: 'bg-rose-500/20 border-rose-400 text-rose-200',
    heroTitleGradient: 'from-white via-rose-200 to-amber-200',
    heroHeartColor: 'text-rose-400 fill-rose-400',
    speechBubbleBorder: 'border-rose-400/50',
    speechBubbleShadow: 'shadow-[0_0_25px_rgba(244,63,94,0.2)]',
    ctaOutlineBtn:
      'bg-gradient-to-r from-rose-500/20 to-amber-500/20 border-rose-400/45 text-rose-200 hover:border-rose-300',
    micIdleBtn:
      'bg-gradient-to-tr from-rose-500 via-pink-600 to-amber-500 text-white shadow-[0_0_35px_rgba(244,63,94,0.55)]',
    micListeningBtn:
      'bg-gradient-to-tr from-rose-400 to-amber-300 text-slate-950 shadow-[0_0_40px_rgba(251,113,133,0.9)]',
    micRingIdle: 'border-rose-400/55',
    micRingListening: 'border-rose-300',
    captionPillBorder: 'border-rose-500/35',
    accentText: 'text-rose-300',
    accentTextSecondary: 'text-amber-300',
    sendBtn:
      'bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-400 hover:to-pink-500',
    inputFocusBorder: 'focus:border-rose-400',
    chipHover: 'hover:border-rose-500/45 hover:text-rose-200',
    chatUserBubble: 'bg-gradient-to-r from-rose-600 to-pink-600 text-white',
    chatAvatarRing: 'from-rose-500 to-amber-500',
    chatAvatarText: 'text-rose-300',
    chatSendBtn: 'bg-rose-600 hover:bg-rose-500',
    visualizerIdleBar: 'bg-rose-500/40',
    visualizerListeningBar: 'bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.85)]',
    visualizerThinkingBar: 'bg-amber-400/80 shadow-[0_0_6px_rgba(251,191,36,0.65)]',
    avatarOrbitalBorder: 'border-rose-500/40',
    avatarScanlineVia: 'via-rose-400/10',
    cssVars: {
      scrollbar: 'rgba(244, 63, 94, 0.35)',
      scrollbarHover: 'rgba(251, 113, 133, 0.7)',
      selectionBg: 'rgba(244, 63, 94, 0.32)',
      selectionText: '#fecdd3',
    },
  },
};

export const THEME_LIST: ThemeConfig[] = [
  THEMES['cyberpunk-cyan'],
  THEMES['royal-purple'],
  THEMES['deep-emerald'],
  THEMES['crimson-rose'],
];
