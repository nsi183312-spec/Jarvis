export type AssistantState = 'idle' | 'listening' | 'thinking' | 'speaking';

export type AvatarMood = 'happy' | 'calm' | 'curious' | 'focused' | 'playful' | 'empathetic';

export type ThemeId = 'cyberpunk-cyan' | 'royal-purple' | 'deep-emerald' | 'crimson-rose';

export type MainTabId = 'assistant' | 'features' | 'history' | 'help' | 'settings';

export type BuiltInAppModalType = 'calculator' | 'camera' | 'recorder' | 'safety';

export type CommandIntent =
  | 'ai_chat'
  | 'device_control'
  | 'app_launch'
  | 'communication'
  | 'productivity'
  | 'search';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'jarvis';
  text: string;
  timestamp: string;
  intent?: CommandIntent;
  action?: {
    type: string;
    target?: string;
    value?: any;
    status?: 'success' | 'pending_confirmation' | 'rejected';
  };
  actionUrl?: string;
  actionLabel?: string;
  detectedLanguage?: string;
}

export interface CloudVoiceItem {
  voice_id: string;
  name: string;
  gender?: string;
  accent?: string;
  descriptive?: string;
  age?: string;
  supportsHindi?: boolean;
}

export interface VoiceSettings {
  pitch: number;      // 0.8 to 1.5 (default ~1.15 for cute tone)
  rate: number;       // 0.7 to 1.5 (default ~1.0)
  voiceURI: string;   // URI of selected voice
  autoSpeak: boolean; // Speak automatically upon response
  wakeWordEnabled: boolean; // Continuous listening for "Hey JARVIS"
  preferredLanguage: 'auto' | 'hi-IN' | 'en-IN' | 'en-US';
  useCloudVoice?: boolean; // Use ElevenLabs HD Neural Voice via server proxy
  elevenLabsVoiceId?: string; // Selected ElevenLabs voice ID
  aiModel?: string; // Selected Ollama Cloud model ID
}

export interface DeviceState {
  flashlight: boolean;
  volume: number;       // 0 to 100
  batteryLevel: number; // 0 to 100
  isCharging: boolean;
  wifiEnabled: boolean;
  mobileDataEnabled: boolean;
  bluetoothEnabled: boolean;
  brightness: number;   // 10 to 100
  hotspotEnabled?: boolean;
  airplaneMode?: boolean;
  dndEnabled?: boolean;
}

export interface PermissionStatus {
  microphone: boolean;
  camera: boolean;
  contacts: boolean;
  phone: boolean;
  accessibility: boolean;
  notifications: boolean;
}

export interface QuickNote {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

export interface AlarmItem {
  id: string;
  time: string; // e.g. "07:00 AM"
  label: string;
  enabled: boolean;
  days: string[];
}
