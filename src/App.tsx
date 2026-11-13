import React, { useState, useEffect, useRef } from 'react';
import {
  AssistantState,
  AvatarMood,
  BuiltInAppModalType,
  ChatMessage,
  VoiceSettings,
  DeviceState,
  PermissionStatus,
  QuickNote,
  AlarmItem,
  ThemeId,
  MainTabId,
} from './types';
import { THEMES } from './theme';
import { voiceEngine } from './services/voiceEngine';
import { geminiLiveClient } from './services/geminiLiveClient';
import { commandRouter } from './services/commandRouter';
import { generateOfflineSmartReply, tryEvaluateOfflineArithmetic } from './services/offlineBrain';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { AvatarView } from './components/AvatarView';
import { BatteryStatus } from './components/BatteryStatus';
import { WeatherWidget } from './components/WeatherWidget';
import { VoiceVisualizer } from './components/VoiceVisualizer';
import { DeviceControlPanel } from './components/DeviceControlPanel';
import { AppAutomationHub } from './components/AppAutomationHub';
import { PermissionsPanel } from './components/PermissionsPanel';
import { SettingsPanel } from './components/SettingsPanel';
import { AndroidProjectExporter } from './components/AndroidProjectExporter';
import { ConfirmationDialog } from './components/ConfirmationDialog';
import { BuiltInAppModals } from './components/BuiltInAppModals';
import { HelpCommandCenter } from './components/HelpCommandCenter';
import { PWAInstallButton } from './components/PWAInstallButton';
import { OfflineIndicator } from './components/OfflineIndicator';
import {
  Mic,
  MicOff,
  Send,
  Volume2,
  VolumeX,
  Shield,
  Settings,
  MessageSquare,
  Home,
  Battery,
  Copy,
  Check,
  RotateCcw,
  LayoutGrid,
  Download,
  PhoneCall,
  Flashlight,
  Wifi,
  Bluetooth,
  Signal,
  SlidersHorizontal,
  Menu,
  Star,
  History,
  HelpCircle,
  ExternalLink,
  X,
  Timer,
  Radio,
} from 'lucide-react';

function isNativePhoneUri(url: string): boolean {
  return /^(intent:|tel:|sms:|market:|whatsapp:|spotify:|tg:|geo:)/i.test(url);
}

function launchExternalUrlSafe(url: string) {
  if (typeof document === 'undefined' || !url) return;
  if (isNativePhoneUri(url)) {
    try {
      if (window.top && window.top !== window.self) {
        window.top.location.href = url;
        return;
      }
    } catch {
      // Cross-origin iframe fallback
    }
    try {
      const nativeAnchor = document.createElement('a');
      nativeAnchor.href = url;
      nativeAnchor.style.display = 'none';
      document.body.appendChild(nativeAnchor);
      nativeAnchor.click();
      document.body.removeChild(nativeAnchor);
    } catch {
      window.location.href = url;
    }
    return;
  }
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.target = '_blank';
  anchor.rel = 'noopener noreferrer';
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
}

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState<MainTabId>('assistant');
  const [featuresSubTab, setFeaturesSubTab] = useState<'apps' | 'device'>('apps');
  const [settingsSection, setSettingsSection] = useState<
    'chat' | 'voice' | 'apps' | 'apk' | 'general'
  >('chat');
  const [menuDrawerOpen, setMenuDrawerOpen] = useState(false);
  const [builtInModal, setBuiltInModal] = useState<BuiltInAppModalType | null>(null);

  // Countdown Timer state
  const [activeTimer, setActiveTimer] = useState<{ label: string; remainingSec: number } | null>(
    null
  );

  // Assistant State
  const [assistantState, setAssistantState] = useState<AssistantState>('idle');
  const [avatarMood, setAvatarMood] = useState<AvatarMood>('happy');
  const [currentSpokenText, setCurrentSpokenText] = useState<string>('');
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [textInput, setTextInput] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [liveStatus, setLiveStatus] = useState<'disconnected' | 'connecting' | 'live'>('disconnected');
  const [micNotice, setMicNotice] = useState<string>('');
  const [micStatusDetail, setMicStatusDetail] = useState<string>('');
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const [themeId, setThemeId] = useState<ThemeId>(() => {
    const saved = localStorage.getItem('jarvis_color_theme') as ThemeId | null;
    return saved && saved in THEMES ? saved : 'cyberpunk-cyan';
  });
  const activeTheme = THEMES[themeId] || THEMES['cyberpunk-cyan'];

  // Settings
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>(() => {
    const defaults: VoiceSettings = {
      pitch: 1.15,
      rate: 1.0,
      voiceURI: '',
      autoSpeak: true,
      wakeWordEnabled: false,
      preferredLanguage: 'auto',
      useCloudVoice: true,
      elevenLabsVoiceId: 'ihKwLOjVUMG4lgUI6meZ',
    };
    const saved = localStorage.getItem('jarvis_voice_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (!parsed.elevenLabsVoiceId || parsed.elevenLabsVoiceId === 'cgSgspJ2msm6clMCkdW9') {
          parsed.elevenLabsVoiceId = 'ihKwLOjVUMG4lgUI6meZ';
        }
        return { ...defaults, ...parsed };
      } catch {
        // fallback
      }
    }
    return defaults;
  });

  // Online/Offline tracking
  const isOnline = useOnlineStatus();

  // Device State (persisted for offline reliability)
  const [deviceState, setDeviceState] = useState<DeviceState>(() => {
    const defaults: DeviceState = {
      flashlight: false,
      volume: 70,
      batteryLevel: 87,
      isCharging: false,
      wifiEnabled: true,
      mobileDataEnabled: true,
      bluetoothEnabled: true,
      brightness: 85,
      dndEnabled: false,
    };
    const saved = localStorage.getItem('jarvis_device_state');
    if (saved) {
      try {
        return { ...defaults, ...JSON.parse(saved) };
      } catch {
        // fallback
      }
    }
    return defaults;
  });

  // Permissions
  const [permissions, setPermissions] = useState<PermissionStatus>({
    microphone: true,
    camera: true,
    contacts: true,
    phone: true,
    accessibility: true,
    notifications: true,
  });

  // Notes & Alarms (persisted for offline use)
  const [notes, setNotes] = useState<QuickNote[]>(() => {
    const saved = localStorage.getItem('jarvis_notes');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return [
      {
        id: 'note_1',
        title: 'Grocery List',
        content: 'Milk, bread, green tea, and almonds.',
        createdAt: '10:30 AM',
      },
      {
        id: 'note_2',
        title: 'Meeting Memo',
        content: 'Discuss JARVIS Android assistant deployment with team.',
        createdAt: 'Yesterday',
      },
    ];
  });

  const [alarms, setAlarms] = useState<AlarmItem[]>(() => {
    const saved = localStorage.getItem('jarvis_alarms');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return [
      { id: 'alarm_1', time: '07:00 AM', label: 'Morning Wakeup', enabled: true, days: ['Daily'] },
      { id: 'alarm_2', time: '06:30 PM', label: 'Evening Workout', enabled: false, days: ['Mon', 'Wed', 'Fri'] },
    ];
  });

  // Chat History
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg_0',
      sender: 'jarvis',
      text: 'Hello! I am JARVIS, your AI Assistant... How can I help you today?',
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  // Confirmation modal
  const [confirmationModal, setConfirmationModal] = useState<{
    isOpen: boolean;
    action: string;
    target: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    action: '',
    target: '',
    onConfirm: () => {},
  });

  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Refs to prevent stale closures inside VoiceEngine callbacks
  const messagesRef = useRef(messages);
  const deviceStateRef = useRef(deviceState);
  const voiceSettingsRef = useRef(voiceSettings);
  const isProcessingRef = useRef(isProcessing);
  const processInputRef = useRef<(text: string) => void>(() => {});

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    deviceStateRef.current = deviceState;
    try {
      localStorage.setItem('jarvis_device_state', JSON.stringify(deviceState));
    } catch {
      // ignore storage quota
    }
  }, [deviceState]);

  useEffect(() => {
    try {
      localStorage.setItem('jarvis_notes', JSON.stringify(notes));
    } catch {
      // ignore
    }
  }, [notes]);

  useEffect(() => {
    try {
      localStorage.setItem('jarvis_alarms', JSON.stringify(alarms));
    } catch {
      // ignore
    }
  }, [alarms]);

  useEffect(() => {
    voiceSettingsRef.current = voiceSettings;
    voiceEngine.setWakeWordMode(Boolean(voiceSettings.wakeWordEnabled));
  }, [voiceSettings]);

  useEffect(() => {
    isProcessingRef.current = isProcessing;
  }, [isProcessing]);

  // Live countdown timer tick
  useEffect(() => {
    if (!activeTimer) return;
    if (activeTimer.remainingSec <= 0) {
      const doneText = `${activeTimer.label} poora ho gaya hai!`;
      setActiveTimer(null);
      setMessages((prev) => [
        ...prev,
        {
          id: 'msg_timer_' + Date.now(),
          sender: 'jarvis',
          text: doneText,
          timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
          intent: 'productivity',
        },
      ]);
      if (voiceSettingsRef.current.autoSpeak) {
        voiceEngine.speak(doneText, voiceSettingsRef.current);
      }
      return;
    }
    const id = setTimeout(() => {
      setActiveTimer((prev) =>
        prev ? { ...prev, remainingSec: Math.max(0, prev.remainingSec - 1) } : null
      );
    }, 1000);
    return () => clearTimeout(id);
  }, [activeTimer]);

  // Sync global CSS variables & persistence for the selected color theme
  useEffect(() => {
    localStorage.setItem('jarvis_color_theme', themeId);
    const rootStyle = document.documentElement.style;
    rootStyle.setProperty('--theme-scrollbar', activeTheme.cssVars.scrollbar);
    rootStyle.setProperty('--theme-scrollbar-hover', activeTheme.cssVars.scrollbarHover);
    rootStyle.setProperty('--theme-selection-bg', activeTheme.cssVars.selectionBg);
    rootStyle.setProperty('--theme-selection-text', activeTheme.cssVars.selectionText);
  }, [themeId, activeTheme]);

  // Latest JARVIS message for speech bubble
  const latestJarvisObj =
    [...messages].reverse().find((m) => m.sender === 'jarvis') || messages[0];

  // Sync battery info on mount
  useEffect(() => {
    commandRouter.getBatteryInfo().then((info) => {
      if (info) {
        setDeviceState((prev) => ({
          ...prev,
          batteryLevel: info.level,
          isCharging: info.charging,
        }));
      }
    });
  }, []);

  // Configure voice engine callbacks once (uses refs for fresh state)
  useEffect(() => {
    voiceEngine.setCallbacks({
      onStateChange: (state) => {
        if (state === 'listening') {
          setAssistantState('listening');
          setMicNotice('');
        } else if (state === 'speaking') {
          setAssistantState('speaking');
        } else if (state === 'idle' && !isProcessingRef.current) {
          setAssistantState('idle');
        }
      },
      onResult: (text, isFinal) => {
        setCurrentSpokenText(text);
        if (isFinal && text.trim().length > 0) {
          processInputRef.current(text.trim());
        }
      },
      onError: (err) => {
        console.warn('Voice Engine Error:', err);
        setAssistantState('idle');
        setMicStatusDetail('');
        if (err.includes('not-allowed') || err.includes('service-not-allowed')) {
          setMicNotice(
            'Browser ne mic permission block ki hai. Browser address bar me Lock icon se Microphone "Allow" karein ya HD Audio Mode try karein.'
          );
        } else if (err.includes('no-speech')) {
          setMicNotice('Awaaz sunai nahi di — mic ke paas thoda zor se bolein ya HD Audio Mode use karein.');
        } else {
          setMicNotice(`Mic status: ${err}. Aap HD Audio Mode ya quick commands use kar sakte hain.`);
        }
      },
      onAudioLevel: (level) => {
        setAudioLevel(level);
      },
      onStatusDetail: (detail) => {
        setMicStatusDetail(detail);
      },
    });

    let lastLiveUserPrompt = '';
    geminiLiveClient.setCallbacks({
      onStatusChange: (status) => {
        setLiveStatus(status);
        if (status === 'connecting') {
          setAssistantState('thinking');
          setMicStatusDetail('Gemini Live Voice connect ho raha hai...');
        } else if (status === 'live') {
          setAssistantState('listening');
          setMicNotice('');
          setMicStatusDetail('Gemini Live Voice active — seedha baat karein');
        } else {
          setMicStatusDetail('');
          if (!isProcessingRef.current) {
            setAssistantState('idle');
          }
        }
      },
      onInputTranscript: (text) => {
        lastLiveUserPrompt = text;
        setCurrentSpokenText(text);
      },
      onOutputTranscript: (text, isFinal) => {
        setAssistantState('speaking');
        if (isFinal) {
          setCurrentSpokenText('');
          const spokenPrompt = lastLiveUserPrompt.trim();
          lastLiveUserPrompt = '';

          if (spokenPrompt) {
            commandRouter.executeLocalCommand(spokenPrompt, deviceStateRef.current).then((res) => {
              if (res.handled) {
                if (res.deviceStateUpdate) {
                  setDeviceState((prev) => ({ ...prev, ...res.deviceStateUpdate }));
                }
                if (res.externalUrl) {
                  launchExternalUrlSafe(res.externalUrl);
                }
              }
            });
          }

          setMessages((prev) => [
            ...prev,
            ...(spokenPrompt
              ? [
                  {
                    id: 'msg_live_u_' + Date.now(),
                    sender: 'user' as const,
                    text: spokenPrompt,
                    timestamp: new Date().toLocaleTimeString('en-IN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    }),
                  },
                ]
              : []),
            {
              id: 'msg_live_j_' + (Date.now() + 1),
              sender: 'jarvis' as const,
              text,
              timestamp: new Date().toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit',
              }),
              intent: 'ai_chat',
            },
          ]);
          if (geminiLiveClient.isRunning()) {
            setAssistantState('listening');
          }
        }
      },
      onAudioLevel: (level) => {
        setAudioLevel(level);
      },
      onError: (msg) => {
        setMicNotice(msg);
        setLiveStatus('disconnected');
        setAssistantState('idle');
      },
    });
  }, []);

  // Scroll chat to bottom
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, activeTab, settingsSection]);

  const handleUpdateVoiceSettings = (newSettings: Partial<VoiceSettings>) => {
    setVoiceSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem('jarvis_voice_settings', JSON.stringify(updated));
      return updated;
    });
  };

  const speakResponse = (text: string) => {
    const activeSettings = voiceSettingsRef.current;
    if (!activeSettings.autoSpeak) return;
    voiceEngine.speak(text, activeSettings);
  };

  const updateMoodFromContext = (userText: string, replyText: string) => {
    const combined = `${userText} ${replyText}`.toLowerCase();
    if (combined.includes('joke') || combined.includes('chutkula') || combined.includes('haha') || combined.includes('funny')) {
      setAvatarMood('playful');
    } else if (combined.includes('sorry') || combined.includes('maaf') || combined.includes('help') || combined.includes('sad') || combined.includes('care')) {
      setAvatarMood('empathetic');
    } else if (combined.includes('?') || combined.includes('what') || combined.includes('how') || combined.includes('kyu') || combined.includes('kya')) {
      setAvatarMood('curious');
    } else if (combined.includes('calculate') || combined.includes('math') || combined.includes('alarm') || combined.includes('open') || combined.includes('kholo') || combined.includes('flashlight')) {
      setAvatarMood('focused');
    } else if (combined.includes('hello') || combined.includes('hi') || combined.includes('namaste') || combined.includes('quote') || combined.includes('good') || combined.includes('thank')) {
      setAvatarMood('happy');
    } else {
      setAvatarMood('calm');
    }
  };

  const handleProcessVoiceInput = async (inputText: string) => {
    if (!inputText.trim() || isProcessingRef.current) return;

    const currentSettings = voiceSettingsRef.current;
    const currentDevState = deviceStateRef.current;
    const currentHistory = messagesRef.current;

    voiceEngine.stopSpeaking();
    setAssistantState('thinking');
    setAvatarMood('focused');
    setIsProcessing(true);
    isProcessingRef.current = true;
    setCurrentSpokenText('');

    const userMsg: ChatMessage = {
      id: 'msg_' + Date.now(),
      sender: 'user',
      text: inputText,
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const localResult = await commandRouter.executeLocalCommand(inputText, currentDevState);

      if (localResult.handled) {
        if (localResult.deviceStateUpdate) {
          setDeviceState((prev) => ({ ...prev, ...localResult.deviceStateUpdate }));
        }
        if (localResult.noteCreated) {
          setNotes((prev) => [localResult.noteCreated!, ...prev]);
        }
        if (localResult.alarmCreated) {
          setAlarms((prev) => [localResult.alarmCreated!, ...prev]);
        }
        if (localResult.requiresConfirmation && localResult.confirmationDetails) {
          setConfirmationModal({
            isOpen: true,
            action: localResult.confirmationDetails.action,
            target: localResult.confirmationDetails.target,
            onConfirm: () => {
              localResult.confirmationDetails!.onConfirm();
              setConfirmationModal((m) => ({ ...m, isOpen: false }));
            },
          });
        }
        if (localResult.uiAction) {
          const ui = localResult.uiAction;
          if (ui.tab) setActiveTab(ui.tab);
          if (ui.featuresSubTab) setFeaturesSubTab(ui.featuresSubTab);
          if (ui.settingsSection) setSettingsSection(ui.settingsSection);
          if (ui.modal) setBuiltInModal(ui.modal);
          if (typeof ui.scrollDelta === 'number' && typeof window !== 'undefined') {
            window.scrollBy({ top: ui.scrollDelta, behavior: 'smooth' });
          }
          if (ui.timerSeconds) {
            setActiveTimer({
              label: ui.timerLabel || 'Timer',
              remainingSec: ui.timerSeconds,
            });
          }
        }
        if (localResult.externalUrl) {
          launchExternalUrlSafe(localResult.externalUrl);
        }

        const reply = localResult.reply;
        updateMoodFromContext(inputText, reply);
        const jarvisMsg: ChatMessage = {
          id: 'msg_reply_' + Date.now(),
          sender: 'jarvis',
          text: reply,
          timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
          intent: localResult.externalUrl ? 'app_launch' : 'device_control',
          actionUrl: localResult.externalUrl,
          actionLabel: localResult.externalLabel,
        };
        setMessages((prev) => [...prev, jarvisMsg]);
        if (currentSettings.autoSpeak) {
          speakResponse(reply);
          setAssistantState('speaking');
        } else {
          setAssistantState('idle');
        }
        return;
      }

      // Instant local arithmetic evaluation (works 100% offline & zero latency)
      const arithmetic = tryEvaluateOfflineArithmetic(inputText);
      if (arithmetic) {
        updateMoodFromContext(inputText, arithmetic.formattedReply);
        const mathMsg: ChatMessage = {
          id: 'msg_math_' + Date.now(),
          sender: 'jarvis',
          text: arithmetic.formattedReply,
          timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
          intent: 'productivity',
          detectedLanguage: 'hinglish',
        };
        setMessages((prev) => [...prev, mathMsg]);
        if (currentSettings.autoSpeak) {
          speakResponse(arithmetic.formattedReply);
          setAssistantState('speaking');
        } else {
          setAssistantState('idle');
        }
        return;
      }

      // If offline, run local smart offline brain immediately (never error out)
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        const offlineData = generateOfflineSmartReply(inputText);
        updateMoodFromContext(inputText, offlineData.reply);
        const jarvisMsg: ChatMessage = {
          id: 'msg_reply_' + Date.now(),
          sender: 'jarvis',
          text: offlineData.reply,
          timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
          intent: offlineData.intent,
          detectedLanguage: offlineData.detectedLanguage,
        };
        setMessages((prev) => [...prev, jarvisMsg]);
        if (currentSettings.autoSpeak) {
          speakResponse(offlineData.reply);
          setAssistantState('speaking');
        } else {
          setAssistantState('idle');
        }
        return;
      }

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: inputText,
          history: currentHistory.slice(-6),
          language: currentSettings.preferredLanguage,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const apiErrorReply =
          data?.reply ||
          data?.error ||
          `Server returned ${response.status}. Please check GEMINI_API_KEY in Settings > Secrets.`;
        setAvatarMood('empathetic');
        setMessages((prev) => [
          ...prev,
          {
            id: 'msg_err_' + Date.now(),
            sender: 'jarvis',
            text: apiErrorReply,
            timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
            intent: 'ai_chat',
          },
        ]);
        if (currentSettings.autoSpeak) {
          speakResponse(apiErrorReply);
          setAssistantState('speaking');
        } else {
          setAssistantState('idle');
        }
        return;
      }

      const replyText =
        data.reply || 'Ji! Main aapki baat samajh gayi. Kripya batayein agla command kya hai?';

      if (data.action && data.action.type === 'torch') {
        await commandRouter.toggleFlashlight(data.action.value);
        setDeviceState((prev) => ({ ...prev, flashlight: data.action.value }));
      }

      updateMoodFromContext(inputText, replyText);
      const jarvisMsg: ChatMessage = {
        id: 'msg_reply_' + Date.now(),
        sender: 'jarvis',
        text: replyText,
        timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        intent: data.intent || 'ai_chat',
        detectedLanguage: data.detectedLanguage,
      };
      setMessages((prev) => [...prev, jarvisMsg]);
      if (currentSettings.autoSpeak) {
        speakResponse(replyText);
        setAssistantState('speaking');
      } else {
        setAssistantState('idle');
      }
    } catch {
      const offlineData = generateOfflineSmartReply(inputText);
      updateMoodFromContext(inputText, offlineData.reply);
      const fallbackMsg: ChatMessage = {
        id: 'msg_offline_' + Date.now(),
        sender: 'jarvis',
        text: offlineData.reply,
        timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        intent: offlineData.intent,
      };
      setMessages((prev) => [...prev, fallbackMsg]);
      if (currentSettings.autoSpeak) {
        speakResponse(offlineData.reply);
        setAssistantState('speaking');
      } else {
        setAssistantState('idle');
      }
    } finally {
      setIsProcessing(false);
      isProcessingRef.current = false;
    }
  };

  processInputRef.current = handleProcessVoiceInput;

  const handleToggleListening = () => {
    if (geminiLiveClient.isRunning()) {
      geminiLiveClient.stop();
      setAssistantState('idle');
      return;
    }
    if (assistantState === 'listening') {
      const wasRecorder = voiceEngine.isAudioRecorderActive();
      voiceEngine.stopListening();
      setAssistantState(wasRecorder ? 'thinking' : 'idle');
    } else if (assistantState === 'speaking') {
      voiceEngine.stopSpeaking();
      setAssistantState('idle');
    } else {
      voiceEngine.startListening(
        voiceSettings.preferredLanguage === 'en-IN' ? 'en-IN' : 'hi-IN'
      );
    }
  };

  const handleToggleGeminiLive = () => {
    if (geminiLiveClient.isRunning() || liveStatus === 'connecting') {
      geminiLiveClient.stop();
      setAssistantState('idle');
      return;
    }
    voiceEngine.stopListening(true);
    voiceEngine.stopSpeaking();
    setMicNotice('');
    geminiLiveClient.start({
      voiceId: voiceSettings.elevenLabsVoiceId?.startsWith('gemini:')
        ? voiceSettings.elevenLabsVoiceId
        : 'Kore',
      language: voiceSettings.preferredLanguage,
    });
  };

  const handleToggleFlashlight = async () => {
    handleProcessVoiceInput(deviceStateRef.current.flashlight ? 'Flashlight off' : 'Flashlight on');
  };

  const handleTestVoice = () => {
    voiceEngine.speak(
      'Hello! Main JARVIS hoon. Aap bataiye, main aaj aapki kya help kar sakti hoon?',
      voiceSettings
    );
  };

  const bottomNavItems: Array<{
    id: MainTabId;
    label: string;
    icon: React.ReactNode;
  }> = [
    { id: 'assistant', label: 'Home', icon: <Home className="w-5 h-5" /> },
    { id: 'features', label: 'Features', icon: <Star className="w-5 h-5" /> },
    { id: 'history', label: 'History', icon: <History className="w-5 h-5" /> },
    { id: 'help', label: 'Help', icon: <HelpCircle className="w-5 h-5" /> },
  ];

  const settingsSeriesItems: Array<{
    id: typeof settingsSection;
    step: string;
    label: string;
    icon: React.ReactNode;
  }> = [
    { id: 'chat', step: '01', label: 'AI Chat', icon: <MessageSquare className="w-3.5 h-3.5" /> },
    { id: 'voice', step: '02', label: 'Voice Control', icon: <Mic className="w-3.5 h-3.5" /> },
    { id: 'apps', step: '03', label: 'Tools & Apps', icon: <LayoutGrid className="w-3.5 h-3.5" /> },
    { id: 'apk', step: '04', label: 'APK Download', icon: <Download className="w-3.5 h-3.5" /> },
    { id: 'general', step: '05', label: 'Permissions & Themes', icon: <Shield className="w-3.5 h-3.5" /> },
  ];

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div
      className={`min-h-screen flex flex-col ${activeTheme.rootBg} text-slate-100 font-sans relative overflow-x-hidden transition-colors duration-500`}
    >
      {/* Ambient Futuristic Cosmic Neon Backdrop Orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className={`absolute -top-32 -left-24 w-[460px] h-[460px] rounded-full ${activeTheme.orb1} blur-[130px] transition-colors duration-700`}
        />
        <div
          className={`absolute top-1/4 left-1/2 -translate-x-1/2 w-[520px] h-[520px] rounded-full bg-blue-600/15 blur-[140px]`}
        />
        <div
          className={`absolute top-1/3 right-0 w-[420px] h-[420px] rounded-full ${activeTheme.orb2} blur-[130px] transition-colors duration-700`}
        />
        <div
          className={`absolute bottom-16 left-1/3 w-96 h-96 rounded-full ${activeTheme.orb3} blur-[120px] transition-colors duration-700`}
        />
      </div>

      {/* TOP STATUS & NAVIGATION BAR (Matching Reference UI Header) */}
      <header className="sticky top-0 z-40 h-14 px-3 sm:px-6 bg-[#02081c]/80 backdrop-blur-xl border-b border-cyan-500/20 flex items-center justify-between gap-4">
        {/* Left: Menu Drawer Trigger + Brand Wordmark */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => setMenuDrawerOpen(true)}
            aria-label="Open navigation menu"
            className="min-w-[44px] min-h-[44px] rounded-xl bg-slate-900/60 hover:bg-cyan-500/15 border border-cyan-500/25 flex items-center justify-center text-white transition"
          >
            <Menu className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('assistant')}
            className={`font-display font-extrabold text-base sm:text-lg tracking-wider bg-gradient-to-r ${activeTheme.heroTitleGradient} bg-clip-text text-transparent whitespace-nowrap`}
          >
            JARVIS AI
          </button>
        </div>

        {/* Right: Live Connectivity, Real Device Indicators, Battery %, Settings Gear */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-slate-900/70 border border-blue-500/30 text-xs">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isOnline
                  ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]'
                  : 'bg-amber-400 shadow-[0_0_8px_#fbbf24]'
              }`}
              aria-hidden="true"
            />
            <span className={`font-semibold whitespace-nowrap ${isOnline ? 'text-emerald-300' : 'text-amber-300'}`}>
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>

          <div className="hidden xs:flex sm:flex items-center gap-2 text-xs text-slate-200 font-mono tabular-nums">
            <span title={deviceState.mobileDataEnabled ? 'Mobile Data On' : 'Mobile Data Off'}>
              <Signal
                className={`w-3.5 h-3.5 ${
                  deviceState.mobileDataEnabled ? 'text-cyan-300' : 'text-slate-600'
                }`}
              />
            </span>
            <span title={deviceState.wifiEnabled ? 'Wi-Fi On' : 'Wi-Fi Off'}>
              <Wifi
                className={`w-3.5 h-3.5 ${
                  deviceState.wifiEnabled ? 'text-cyan-300' : 'text-slate-600'
                }`}
              />
            </span>
            <span className="flex items-center gap-1 font-semibold">
              <Battery className="w-4 h-4 text-cyan-300" />
              <span>{deviceState.batteryLevel}%</span>
            </span>
          </div>

          <button
            type="button"
            onClick={() => setActiveTab(activeTab === 'settings' ? 'assistant' : 'settings')}
            aria-label="Open Settings"
            title="Settings"
            className={`min-w-[44px] min-h-[44px] rounded-xl border flex items-center justify-center transition ${
              activeTab === 'settings'
                ? 'bg-cyan-500/25 border-cyan-400 text-cyan-200 shadow-[0_0_16px_rgba(34,211,238,0.4)]'
                : 'bg-slate-900/60 hover:bg-cyan-500/15 border-cyan-500/25 text-white'
            }`}
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* SLIDE-OVER QUICK MENU DRAWER */}
      {menuDrawerOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex"
          onClick={() => setMenuDrawerOpen(false)}
        >
          <aside
            className="w-72 max-w-[85vw] h-full bg-[#030b22]/95 border-r border-cyan-500/35 p-4 flex flex-col gap-3 shadow-[0_0_40px_rgba(34,211,238,0.2)] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-cyan-500/20">
              <span className="font-display font-bold text-base text-white">JARVIS Control Menu</span>
              <button
                type="button"
                onClick={() => setMenuDrawerOpen(false)}
                className="min-w-[40px] min-h-[40px] rounded-xl bg-slate-900 text-slate-300 hover:text-white flex items-center justify-center"
                aria-label="Close menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <nav className="space-y-1.5 flex-1">
              {[
                { label: 'Home Assistant', tab: 'assistant' as MainTabId, icon: <Home className="w-4 h-4" /> },
                {
                  label: 'All 34+ Phone Apps',
                  tab: 'features' as MainTabId,
                  sub: 'apps' as const,
                  icon: <Star className="w-4 h-4" />,
                },
                {
                  label: 'Device Control',
                  tab: 'features' as MainTabId,
                  sub: 'device' as const,
                  icon: <PhoneCall className="w-4 h-4" />,
                },
                { label: 'Chat & Command History', tab: 'history' as MainTabId, icon: <History className="w-4 h-4" /> },
                { label: 'Help & All Commands', tab: 'help' as MainTabId, icon: <HelpCircle className="w-4 h-4" /> },
                { label: 'Voice & Mic Settings', tab: 'settings' as MainTabId, sec: 'voice' as const, icon: <Mic className="w-4 h-4" /> },
                { label: 'APK Download & Android Code', tab: 'settings' as MainTabId, sec: 'apk' as const, icon: <Download className="w-4 h-4" /> },
                { label: 'Permissions & Themes', tab: 'settings' as MainTabId, sec: 'general' as const, icon: <Shield className="w-4 h-4" /> },
              ].map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => {
                    setActiveTab(item.tab);
                    if (item.sub) setFeaturesSubTab(item.sub);
                    if (item.sec) setSettingsSection(item.sec);
                    setMenuDrawerOpen(false);
                  }}
                  className="w-full min-h-[44px] px-3.5 py-2.5 rounded-2xl bg-slate-900/70 hover:bg-cyan-500/20 border border-blue-500/25 hover:border-cyan-400/60 text-xs font-semibold text-slate-200 flex items-center gap-3 transition"
                >
                  <span className="text-cyan-300">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>

            <PWAInstallButton />

            <button
              type="button"
              onClick={() => {
                if (voiceEngine.isVoiceSpeaking()) voiceEngine.stopSpeaking();
                else handleTestVoice();
              }}
              className="w-full min-h-[44px] px-3.5 py-2.5 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-200 flex items-center justify-between transition"
            >
              <span>{assistantState === 'speaking' ? 'Stop Voice' : 'Voice Preview'}</span>
              {assistantState === 'speaking' ? (
                <VolumeX className="w-4 h-4 text-pink-400 animate-pulse" />
              ) : (
                <Volume2 className="w-4 h-4 text-cyan-300" />
              )}
            </button>
          </aside>
        </div>
      )}

      {/* MAIN CONTENT AREA (padded at bottom for fixed 4-tab Neon Dock) */}
      <main className="flex-1 relative z-10 flex flex-col max-w-6xl w-full mx-auto px-3 sm:px-6 pt-3 sm:pt-5 pb-28">
        {/* HOME / ASSISTANT STAGE */}
        {activeTab === 'assistant' && (
          <div className="flex-1 flex flex-col gap-5">
            <div className="grid grid-cols-1 lg:grid-cols-12 items-center gap-6">
              {/* PRIMARY HERO COLUMN: Avatar + Floating Speech Bubble + Waveform + Concentric Mic */}
              <div className="lg:col-span-7 flex flex-col items-center gap-4">
                {/* Avatar + Floating Neon Speech Bubble */}
                <div className="relative w-full flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-2">
                  <AvatarView
                    state={assistantState}
                    audioLevel={audioLevel}
                    isSpeaking={assistantState === 'speaking'}
                    mood={avatarMood}
                    theme={activeTheme}
                    onMoodChange={setAvatarMood}
                    onAvatarClick={handleToggleListening}
                  />

                  {/* Glowing Neon Speech Bubble with Pointer Tail */}
                  <div className="relative w-full max-w-[300px] sm:max-w-[260px] sm:-ml-6 z-20">
                    {/* Left pointer tail on desktop/tablet */}
                    <div
                      className="hidden sm:block absolute -left-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rotate-45 bg-[#040c24] border-l-2 border-b-2 border-cyan-400 shadow-[-4px_4px_12px_rgba(34,211,238,0.3)]"
                      aria-hidden="true"
                    />
                    <div className="relative p-4 rounded-3xl bg-[#040c24]/90 backdrop-blur-xl border-2 border-cyan-400/80 shadow-[0_0_26px_rgba(34,211,238,0.35)] space-y-2">
                      <p className="text-xs sm:text-sm text-white leading-relaxed font-medium text-center sm:text-left">
                        {currentSpokenText
                          ? `"${currentSpokenText}"`
                          : isProcessing
                          ? 'Soch rahi hoon... ek second!'
                          : latestJarvisObj.text}
                      </p>

                      {currentSpokenText && (
                        <button
                          type="button"
                          onClick={() => voiceEngine.commitCurrentSpeech()}
                          className="w-full min-h-[38px] px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs inline-flex items-center justify-center gap-1 transition"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Send Now</span>
                        </button>
                      )}

                      {!currentSpokenText && latestJarvisObj.actionUrl && (
                        <a
                          href={latestJarvisObj.actionUrl}
                          {...(!isNativePhoneUri(latestJarvisObj.actionUrl)
                            ? { target: '_blank', rel: 'noopener noreferrer' }
                            : {})}
                          className="w-full min-h-[38px] px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/35 border border-cyan-400/60 text-cyan-200 font-semibold text-xs inline-flex items-center justify-center gap-1.5 transition"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>{latestJarvisObj.actionLabel || 'Open App'}</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* Mic Notice Banner (if browser blocked mic) */}
                {micNotice && (
                  <div className="w-full max-w-xl p-3 rounded-2xl bg-amber-500/15 border border-amber-400/40 text-amber-100 text-xs flex flex-wrap items-center justify-between gap-2">
                    <span className="flex-1 min-w-[200px]">{micNotice}</span>
                    <div className="flex items-center gap-2">
                      {typeof window !== 'undefined' && window.self !== window.top && (
                        <a
                          href={window.location.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-[11px] transition"
                        >
                          Open in Browser
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setMicNotice('');
                          voiceEngine.startListening(
                            voiceSettings.preferredLanguage === 'en-IN' ? 'en-IN' : 'hi-IN',
                            true
                          );
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-[11px] transition"
                      >
                        Use HD Audio Mic
                      </button>
                      <button
                        type="button"
                        onClick={() => setMicNotice('')}
                        className="text-amber-300 hover:text-white font-bold px-1.5"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                )}

                {/* Symmetrical Neon Waveform + Central Concentric Glowing Mic */}
                <div className="w-full max-w-xl flex flex-col items-center gap-2.5">
                  <div className="flex items-center justify-center gap-2 sm:gap-4 w-full">
                    <div className="flex-1 min-w-0">
                      <VoiceVisualizer
                        state={assistantState}
                        audioLevel={audioLevel}
                        theme={activeTheme}
                        mirrored
                      />
                    </div>

                    {/* Central Concentric Neon-Blue Circular Mic Button */}
                    <button
                      id="main-mic-button"
                      data-testid="main-mic-button"
                      type="button"
                      onClick={handleToggleListening}
                      aria-label="Tap to Speak"
                      className={`relative w-20 h-20 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 border-2 ${
                        assistantState === 'listening'
                          ? `${activeTheme.micListeningBtn} border-cyan-200 scale-110`
                          : assistantState === 'speaking'
                          ? 'bg-gradient-to-tr from-purple-600 to-pink-500 border-pink-300 text-white shadow-[0_0_40px_rgba(236,72,153,0.85)] scale-105'
                          : 'bg-[#031438] border-cyan-400 text-white shadow-[0_0_38px_rgba(0,180,255,0.75)] hover:scale-105 active:scale-95'
                      }`}
                    >
                      <div
                        className={`absolute inset-[-7px] rounded-full border-2 ${
                          assistantState === 'listening'
                            ? 'border-cyan-300 animate-ping opacity-75'
                            : 'border-cyan-400/65 shadow-[0_0_20px_rgba(34,211,238,0.45)]'
                        }`}
                      />
                      {assistantState === 'listening' ? (
                        <MicOff className="w-8 h-8 animate-pulse text-slate-950" />
                      ) : (
                        <Mic className="w-8 h-8 text-white drop-shadow-[0_0_8px_rgba(56,189,248,0.9)]" />
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      <VoiceVisualizer
                        state={assistantState}
                        audioLevel={audioLevel}
                        theme={activeTheme}
                      />
                    </div>
                  </div>

                  {/* Tap to Speak Caption + Live Voice + Debug Mic */}
                  <div className="flex flex-wrap items-center justify-center gap-2 text-xs sm:text-sm">
                    <span className="font-semibold text-white tracking-wide">
                      {liveStatus === 'live'
                        ? 'Gemini Live Active — Boliye'
                        : liveStatus === 'connecting'
                        ? 'Connecting Live Voice...'
                        : assistantState === 'listening'
                        ? micStatusDetail || 'Listening... Speak Now'
                        : assistantState === 'speaking'
                        ? 'Speaking... Tap Mic to Stop'
                        : assistantState === 'thinking'
                        ? 'Processing voice...'
                        : 'Tap to Speak'}
                    </span>
                    <span className="text-slate-600">·</span>
                    <button
                      type="button"
                      onClick={handleToggleGeminiLive}
                      className={`inline-flex items-center gap-1 text-xs font-semibold transition ${
                        liveStatus !== 'disconnected'
                          ? 'text-emerald-300 hover:text-emerald-200'
                          : 'text-cyan-300 hover:text-white'
                      }`}
                    >
                      <Radio className={`w-3.5 h-3.5 ${liveStatus === 'live' ? 'animate-pulse' : ''}`} />
                      <span>{liveStatus !== 'disconnected' ? 'Stop Live' : 'Gemini Live'}</span>
                    </button>
                    <span className="text-slate-600">·</span>
                    <button
                      type="button"
                      onClick={() => {
                        setSettingsSection('voice');
                        setActiveTab('settings');
                      }}
                      className="text-xs font-semibold text-cyan-300 hover:text-white transition"
                    >
                      Debug Mic
                    </button>
                  </div>

                  {/* Command Input Bar + Quick Action Chips */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (textInput.trim()) {
                        handleProcessVoiceInput(textInput.trim());
                        setTextInput('');
                      }
                    }}
                    className="w-full flex items-center gap-2 mt-1"
                  >
                    <input
                      type="text"
                      placeholder="Bolkar ya likhkar command dein (e.g. Data on, Open YouTube, 5 + 10)..."
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      className={`flex-1 min-h-[44px] bg-[#040c24]/90 backdrop-blur-md text-xs sm:text-sm text-white px-4 py-2.5 rounded-2xl border border-blue-500/40 focus:outline-none ${activeTheme.inputFocusBorder} placeholder:text-slate-400`}
                    />
                    <button
                      type="submit"
                      disabled={!textInput.trim() || isProcessing}
                      aria-label="Send command"
                      className={`min-w-[44px] min-h-[44px] p-2.5 rounded-2xl ${activeTheme.sendBtn} disabled:opacity-40 text-white transition shadow-[0_0_16px_rgba(34,211,238,0.35)] flex items-center justify-center`}
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>

                  <div className="flex flex-wrap justify-center gap-1.5">
                    {[
                      'Data on',
                      'Flashlight on',
                      'Open YouTube',
                      'what is 5 plus 10',
                      'Open Calculator',
                    ].map((cmd) => (
                      <button
                        key={cmd}
                        type="button"
                        onClick={() => handleProcessVoiceInput(cmd)}
                        className="px-3 py-1.5 rounded-xl bg-[#040c24]/80 hover:bg-cyan-500/20 border border-blue-500/35 hover:border-cyan-400 text-[11px] font-medium text-slate-200 transition"
                      >
                        {cmd}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* SECONDARY HUD COLUMN: Active Timer + Battery Status + Weather Widget + Quick Device Control */}
              <div className="lg:col-span-5 flex flex-col gap-3 w-full max-w-xl mx-auto lg:max-w-none">
                {activeTimer && (
                  <div className="p-3.5 rounded-2xl bg-cyan-500/15 border border-cyan-400/60 flex items-center justify-between gap-3 shadow-[0_0_20px_rgba(34,211,238,0.2)]">
                    <div className="flex items-center gap-2.5">
                      <Timer className="w-5 h-5 text-cyan-300 animate-pulse" />
                      <div>
                        <span className="text-xs font-semibold text-cyan-200 block">
                          {activeTimer.label}
                        </span>
                        <span className="text-lg font-mono font-bold tabular-nums text-white">
                          {formatTimer(activeTimer.remainingSec)}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTimer(null)}
                      className="min-h-[38px] px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-semibold text-slate-200 hover:text-white"
                    >
                      Cancel
                    </button>
                  </div>
                )}

                <BatteryStatus
                  theme={activeTheme}
                  fallbackLevel={deviceState.batteryLevel}
                  fallbackCharging={deviceState.isCharging}
                  onSyncBattery={(level, isCharging) =>
                    setDeviceState((prev) =>
                      prev.batteryLevel === level && prev.isCharging === isCharging
                        ? prev
                        : { ...prev, batteryLevel: level, isCharging }
                    )
                  }
                  onQuickCheck={() => handleProcessVoiceInput('Check battery')}
                />

                <WeatherWidget
                  theme={activeTheme}
                  onSpeakWeather={(summary) => speakResponse(summary)}
                />

                {/* Quick Device Control Strip */}
                <div
                  className={`p-3.5 rounded-2xl bg-[#040c24]/80 backdrop-blur-xl border ${activeTheme.statusCardBorder} space-y-2.5`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                      <SlidersHorizontal className={`w-3.5 h-3.5 ${activeTheme.accentText}`} />
                      <span>Device Control</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setFeaturesSubTab('device');
                        setActiveTab('features');
                      }}
                      className={`text-[11px] font-semibold ${activeTheme.accentText} hover:text-white transition`}
                    >
                      All Controls →
                    </button>
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    <button
                      type="button"
                      onClick={handleToggleFlashlight}
                      className={`min-h-[48px] px-2 py-2 rounded-xl border text-[11px] font-semibold flex flex-col items-center justify-center gap-1 transition ${
                        deviceState.flashlight
                          ? 'bg-amber-500/20 border-amber-400 text-amber-200'
                          : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <Flashlight className="w-4 h-4" />
                      <span>Torch</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleProcessVoiceInput(
                          deviceState.mobileDataEnabled ? 'Data off' : 'Data on'
                        )
                      }
                      className={`min-h-[48px] px-2 py-2 rounded-xl border text-[11px] font-semibold flex flex-col items-center justify-center gap-1 transition ${
                        deviceState.mobileDataEnabled
                          ? 'bg-emerald-500/20 border-emerald-400 text-emerald-200'
                          : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <Signal className="w-4 h-4" />
                      <span>Data</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleProcessVoiceInput(
                          deviceState.wifiEnabled ? 'Turn off Wi-Fi' : 'Turn on Wi-Fi'
                        )
                      }
                      className={`min-h-[48px] px-2 py-2 rounded-xl border text-[11px] font-semibold flex flex-col items-center justify-center gap-1 transition ${
                        deviceState.wifiEnabled
                          ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200'
                          : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <Wifi className="w-4 h-4" />
                      <span>Wi-Fi</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleProcessVoiceInput(
                          deviceState.bluetoothEnabled ? 'Bluetooth off' : 'Turn on Bluetooth'
                        )
                      }
                      className={`min-h-[48px] px-2 py-2 rounded-xl border text-[11px] font-semibold flex flex-col items-center justify-center gap-1 transition ${
                        deviceState.bluetoothEnabled
                          ? 'bg-blue-500/20 border-blue-400 text-blue-200'
                          : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <Bluetooth className="w-4 h-4" />
                      <span>Bluetooth</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* FEATURES TAB: ALL 34+ PHONE APPS + FULL DEVICE CONTROL */}
        {activeTab === 'features' && (
          <div className="flex-1 flex flex-col gap-4">
            <div className="flex items-center justify-center">
              <div className="inline-flex p-1 rounded-2xl bg-[#040c24]/90 border border-cyan-500/35 gap-1">
                <button
                  type="button"
                  onClick={() => setFeaturesSubTab('apps')}
                  className={`min-h-[42px] px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
                    featuresSubTab === 'apps'
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_0_16px_rgba(34,211,238,0.4)]'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <LayoutGrid className="w-4 h-4" />
                  <span>All Apps & Automations</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFeaturesSubTab('device')}
                  className={`min-h-[42px] px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
                    featuresSubTab === 'device'
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_0_16px_rgba(34,211,238,0.4)]'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  <span>Device Control</span>
                </button>
              </div>
            </div>

            {featuresSubTab === 'apps' ? (
              <AppAutomationHub
                onSpeak={speakResponse}
                onExecuteCommand={handleProcessVoiceInput}
              />
            ) : (
              <DeviceControlPanel
                deviceState={deviceState}
                onUpdateDeviceState={(update) => setDeviceState((prev) => ({ ...prev, ...update }))}
                onToggleFlashlight={handleToggleFlashlight}
                notes={notes}
                onAddNote={(note) => setNotes((prev) => [note, ...prev])}
                onDeleteNote={(id) => setNotes((prev) => prev.filter((n) => n.id !== id))}
                alarms={alarms}
                onToggleAlarm={(id) =>
                  setAlarms((prev) =>
                    prev.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a))
                  )
                }
                onAddAlarm={(alarm) => setAlarms((prev) => [alarm, ...prev])}
                onDeleteAlarm={(id) => setAlarms((prev) => prev.filter((a) => a.id !== id))}
                onLaunchApp={(appName, url) => {
                  if (url) launchExternalUrlSafe(url);
                  speakResponse(`${appName} open ho gaya hai!`);
                }}
                onSpeakStatus={speakResponse}
                onExecuteCommand={handleProcessVoiceInput}
              />
            )}
          </div>
        )}

        {/* HISTORY TAB: FULL AI CHAT & COMMAND HISTORY */}
        {activeTab === 'history' && (
          <div className="flex-1 flex flex-col h-[calc(100vh-190px)] min-h-[440px] max-w-4xl mx-auto w-full bg-[#040c24]/80 backdrop-blur-xl border border-cyan-500/35 rounded-3xl p-4 overflow-hidden shadow-[0_0_30px_rgba(34,211,238,0.12)]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs">
              <span className="font-bold text-white flex items-center gap-2">
                <History className="w-4 h-4 text-cyan-300" />
                <span>AI Chat & Command History</span>
              </span>
              <button
                type="button"
                onClick={() =>
                  setMessages([
                    {
                      id: 'msg_0',
                      sender: 'jarvis',
                      text: 'Hello! I am JARVIS, your AI Assistant... How can I help you today?',
                      timestamp: new Date().toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      }),
                    },
                  ])
                }
                className="text-slate-400 hover:text-white flex items-center gap-1 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>
            </div>

            <div ref={chatScrollRef} className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
              {messages.map((msg) => {
                const isJarvis = msg.sender === 'jarvis';
                return (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-3 ${isJarvis ? 'justify-start' : 'justify-end'}`}
                  >
                    {isJarvis && (
                      <div
                        className={`w-8 h-8 rounded-full bg-gradient-to-tr ${activeTheme.chatAvatarRing} p-[1.5px] shrink-0`}
                      >
                        <div
                          className={`w-full h-full rounded-full bg-slate-950 flex items-center justify-center text-xs font-bold ${activeTheme.chatAvatarText}`}
                        >
                          J
                        </div>
                      </div>
                    )}
                    <div
                      className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm space-y-2 ${
                        isJarvis
                          ? 'bg-slate-900/90 border border-cyan-500/25 text-slate-100'
                          : activeTheme.chatUserBubble
                      }`}
                    >
                      <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                      {isJarvis && msg.actionUrl && (
                        <a
                          href={msg.actionUrl}
                          {...(!isNativePhoneUri(msg.actionUrl)
                            ? { target: '_blank', rel: 'noopener noreferrer' }
                            : {})}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/35 border border-cyan-400/50 text-cyan-200 text-xs font-semibold transition"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>{msg.actionLabel || 'Open App'}</span>
                        </a>
                      )}
                      <div className="flex items-center justify-between gap-4 text-[10px] text-slate-400">
                        <span>{msg.timestamp}</span>
                        {isJarvis && (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => speakResponse(msg.text)}
                              className={`hover:text-white flex items-center gap-1 transition ${activeTheme.accentText}`}
                            >
                              <Volume2 className="w-3 h-3" />
                              <span>Listen</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(msg.text);
                                setCopiedMsgId(msg.id);
                                setTimeout(() => setCopiedMsgId(null), 1500);
                              }}
                              className={`hover:text-white transition ${activeTheme.accentText}`}
                              title="Copy reply"
                            >
                              {copiedMsgId === msg.id ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (textInput.trim()) {
                  handleProcessVoiceInput(textInput.trim());
                  setTextInput('');
                }
              }}
              className="flex items-center gap-2 pt-3 border-t border-slate-800"
            >
              <input
                type="text"
                placeholder="Ask JARVIS or give any command..."
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                className={`flex-1 min-h-[44px] bg-slate-950 text-sm text-white px-4 py-2.5 rounded-2xl border border-slate-800 focus:outline-none ${activeTheme.inputFocusBorder}`}
              />
              <button
                type="submit"
                disabled={!textInput.trim() || isProcessing}
                className={`min-w-[44px] min-h-[44px] p-2.5 rounded-2xl ${activeTheme.chatSendBtn} disabled:opacity-40 text-white transition flex items-center justify-center`}
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {/* HELP TAB: INTERACTIVE ALL COMMANDS & APPS DIRECTORY */}
        {activeTab === 'help' && (
          <HelpCommandCenter
            theme={activeTheme}
            onRunCommand={(cmd) => handleProcessVoiceInput(cmd)}
            onOpenVoiceSettings={() => {
              setSettingsSection('voice');
              setActiveTab('settings');
            }}
            onOpenAllApps={() => {
              setFeaturesSubTab('apps');
              setActiveTab('features');
            }}
          />
        )}

        {/* UNIFIED SETTINGS HUB (Ordered Series Line: 01 AI Chat -> 02 Voice Control -> 03 Tools & Apps -> 04 APK Download -> 05 Permissions & Themes) */}
        {activeTab === 'settings' && (
          <div className="flex-1 flex flex-col gap-5">
            {/* Sequential Series Line Navigation Bar */}
            <div className="p-2.5 rounded-2xl bg-[#040c24]/85 backdrop-blur-xl border border-cyan-500/30 overflow-x-auto no-scrollbar">
              <div className="flex items-center gap-1.5 min-w-max">
                {settingsSeriesItems.map((item, idx) => {
                  const isSelected = settingsSection === item.id;
                  return (
                    <React.Fragment key={item.id}>
                      <button
                        type="button"
                        onClick={() => setSettingsSection(item.id)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 border transition-all whitespace-nowrap ${
                          isSelected
                            ? activeTheme.activeNavBtn
                            : `bg-slate-950/60 border-slate-800 text-slate-300 hover:text-white ${activeTheme.navHoverBorder}`
                        }`}
                      >
                        <span
                          className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md ${
                            isSelected
                              ? 'bg-white/15 text-white'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {item.step}
                        </span>
                        <span className={isSelected ? activeTheme.navIconActive : activeTheme.navIconIdle}>
                          {item.icon}
                        </span>
                        <span>{item.label}</span>
                      </button>
                      {idx < settingsSeriesItems.length - 1 && (
                        <span className="text-slate-600 text-xs select-none px-0.5">→</span>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>

            {settingsSection === 'chat' && (
              <div className="flex-1 flex flex-col h-[560px] bg-[#040c24]/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-4 overflow-hidden">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs">
                  <span className="font-semibold text-slate-200">AI Chat History</span>
                  <button
                    type="button"
                    onClick={() =>
                      setMessages([
                        {
                          id: 'msg_0',
                          sender: 'jarvis',
                          text: 'Hello! I am JARVIS, your AI Assistant... How can I help you today?',
                          timestamp: new Date().toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          }),
                        },
                      ])
                    }
                    className="text-slate-400 hover:text-white flex items-center gap-1 transition"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Clear</span>
                  </button>
                </div>

                <div ref={chatScrollRef} className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
                  {messages.map((msg) => {
                    const isJarvis = msg.sender === 'jarvis';
                    return (
                      <div
                        key={msg.id}
                        className={`flex items-start gap-3 ${isJarvis ? 'justify-start' : 'justify-end'}`}
                      >
                        {isJarvis && (
                          <div
                            className={`w-8 h-8 rounded-full bg-gradient-to-tr ${activeTheme.chatAvatarRing} p-[1.5px] shrink-0`}
                          >
                            <div
                              className={`w-full h-full rounded-full bg-slate-950 flex items-center justify-center text-xs font-bold ${activeTheme.chatAvatarText}`}
                            >
                              J
                            </div>
                          </div>
                        )}
                        <div
                          className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                            isJarvis
                              ? 'bg-slate-900/90 border border-slate-800 text-slate-100'
                              : activeTheme.chatUserBubble
                          }`}
                        >
                          <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {settingsSection === 'voice' && (
              <SettingsPanel
                settings={voiceSettings}
                onUpdateSettings={handleUpdateVoiceSettings}
                onTestVoice={handleTestVoice}
                onStartRecorderMode={() => {
                  setActiveTab('assistant');
                  voiceEngine.startListening(
                    voiceSettings.preferredLanguage === 'en-IN' ? 'en-IN' : 'hi-IN',
                    true
                  );
                }}
                activeThemeId={themeId}
                onSelectTheme={setThemeId}
              />
            )}

            {settingsSection === 'apps' && (
              <AppAutomationHub
                onSpeak={speakResponse}
                onExecuteCommand={handleProcessVoiceInput}
              />
            )}

            {settingsSection === 'apk' && <AndroidProjectExporter />}

            {settingsSection === 'general' && (
              <PermissionsPanel
                permissions={permissions}
                onTogglePermission={(key) =>
                  setPermissions((prev) => ({ ...prev, [key]: !prev[key] }))
                }
                onRequestMicrophone={() => {
                  voiceEngine.startListening();
                  setPermissions((prev) => ({ ...prev, microphone: true }));
                }}
                onRequestCamera={async () => {
                  await commandRouter.toggleFlashlight(true);
                  setPermissions((prev) => ({ ...prev, camera: true }));
                }}
                onRequestNotification={() => {
                  if ('Notification' in window) {
                    Notification.requestPermission().then((res) => {
                      setPermissions((prev) => ({ ...prev, notifications: res === 'granted' }));
                    });
                  }
                }}
                activeThemeId={themeId}
                onSelectTheme={setThemeId}
              />
            )}
          </div>
        )}
      </main>

      {/* BOTTOM FIXED 4-TAB NEON DOCK (Home, Features, History, Help — matching screenshot) */}
      <nav
        aria-label="Primary Bottom Navigation"
        className="fixed bottom-0 left-0 right-0 z-40 px-2.5 sm:px-4 pt-2 pb-safe bg-gradient-to-t from-[#020718] via-[#020718]/95 to-transparent pointer-events-none"
      >
        <div className="max-w-xl mx-auto grid grid-cols-4 gap-2 pointer-events-auto">
          {bottomNavItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`min-h-[58px] py-2 px-1 rounded-2xl border-2 flex flex-col items-center justify-center gap-1 transition-all duration-200 backdrop-blur-xl ${
                  isActive
                    ? 'bg-gradient-to-b from-cyan-500/35 to-blue-700/40 border-cyan-300 text-white shadow-[0_0_22px_rgba(34,211,238,0.55)]'
                    : 'bg-[#040e2a]/90 border-blue-500/45 text-slate-200 hover:border-cyan-400/75 hover:text-white shadow-[0_0_12px_rgba(37,99,235,0.2)]'
                }`}
              >
                <span className={isActive ? 'text-cyan-200 drop-shadow-[0_0_6px_#22d3ee]' : 'text-slate-200'}>
                  {item.icon}
                </span>
                <span className="text-[11px] font-bold tracking-tight whitespace-nowrap">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Offline Connectivity Toast */}
      <OfflineIndicator />

      {/* Built-in Native App Modals (Calculator, Camera, Voice Recorder, Safety SOS) */}
      <BuiltInAppModals
        activeModal={builtInModal}
        onClose={() => setBuiltInModal(null)}
        onSpeak={speakResponse}
      />

      {/* Confirmation Dialog for Sensitive Actions (Calls / SMS) */}
      <ConfirmationDialog
        isOpen={confirmationModal.isOpen}
        action={confirmationModal.action}
        target={confirmationModal.target}
        onConfirm={confirmationModal.onConfirm}
        onCancel={() => setConfirmationModal((m) => ({ ...m, isOpen: false }))}
      />
    </div>
  );
}
