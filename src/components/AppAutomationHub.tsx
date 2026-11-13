import React, { useState } from 'react';
import {
  Search,
  Plus,
  Play,
  MessageCircle,
  MapPin,
  Globe,
  ArrowDown,
  ArrowUp,
  MousePointer,
  Camera,
  Layers,
  Sparkles,
  Smartphone,
  Trash2,
  Video,
  Music,
  Store,
  Image as ImageIcon,
  ShieldCheck,
  Mail,
  Lock,
  CheckCircle2,
} from 'lucide-react';
import { androidBridge, DiscoveredAndroidApp } from '../services/androidBridge';

export interface AppDefinition {
  id: string;
  name: string;
  hindiName: string;
  category: 'vivo' | 'google' | 'social' | 'media' | 'tools' | 'upi';
  packageName: string;
  webUrl: string;
  deepLink?: string;
  iconColor: string;
  supportsInAppAction?: boolean;
  quickCommand?: string;
}

const DEFAULT_APPS: AppDefinition[] = [
  // User's 26 Requested Apps (Alphabetical & Optimized)
  { id: 'maps', name: 'Maps', hindiName: 'मैप्स', category: 'google', packageName: 'com.google.android.apps.maps', webUrl: 'https://maps.google.com', deepLink: 'geo:0,0?q=', iconColor: 'from-emerald-500 to-teal-600', supportsInAppAction: true, quickCommand: 'Open Maps' },
  { id: 'meet', name: 'Meet', hindiName: 'मीट', category: 'google', packageName: 'com.google.android.apps.meetings', webUrl: 'https://meet.google.com', iconColor: 'from-teal-500 to-cyan-600', supportsInAppAction: true, quickCommand: 'Open Meet' },
  { id: 'messages', name: 'Messages', hindiName: 'मैसेज', category: 'social', packageName: 'com.google.android.apps.messaging', webUrl: '', deepLink: 'sms:', iconColor: 'from-blue-500 to-indigo-600', supportsInAppAction: true, quickCommand: 'Open Messages' },
  { id: 'moviebox', name: 'MovieBox+', hindiName: 'मूवीबॉक्स+', category: 'media', packageName: 'com.movieboxpro.android', webUrl: 'https://www.google.com/search?q=MovieBox%2B', iconColor: 'from-violet-600 to-fuchsia-600', supportsInAppAction: true, quickCommand: 'Open MovieBox+' },
  { id: 'music', name: 'Music', hindiName: 'म्यूजिक', category: 'media', packageName: 'com.android.bbkmusic', webUrl: 'https://music.youtube.com', iconColor: 'from-rose-500 to-orange-500', supportsInAppAction: true, quickCommand: 'Open Music' },
  { id: 'myjio', name: 'MyJio', hindiName: 'मायजियो', category: 'upi', packageName: 'com.jio.myjio', webUrl: 'https://www.jio.com/selfcare/login', deepLink: 'myjio://', iconColor: 'from-blue-600 to-cyan-500', supportsInAppAction: true, quickCommand: 'Open MyJio' },
  { id: 'notes', name: 'Notes', hindiName: 'नोट्स', category: 'vivo', packageName: 'com.vivo.notes', webUrl: 'https://keep.google.com', iconColor: 'from-amber-400 to-orange-500', supportsInAppAction: true, quickCommand: 'Open Notes' },
  { id: 'phone', name: 'Phone', hindiName: 'फ़ोन', category: 'tools', packageName: 'com.android.dialer', webUrl: '', deepLink: 'tel:', iconColor: 'from-emerald-500 to-green-600', supportsInAppAction: true, quickCommand: 'Open Phone' },
  { id: 'photos', name: 'Photos', hindiName: 'फ़ोटोज़', category: 'google', packageName: 'com.google.android.apps.photos', webUrl: 'https://photos.google.com', iconColor: 'from-blue-500 via-rose-500 to-amber-500', supportsInAppAction: true, quickCommand: 'Open Photos' },
  { id: 'pinterest', name: 'Pinterest', hindiName: 'पिंटरेस्ट', category: 'social', packageName: 'com.pinterest', webUrl: 'https://www.pinterest.com', deepLink: 'pinterest://', iconColor: 'from-red-600 to-rose-700', supportsInAppAction: true, quickCommand: 'Open Pinterest' },
  { id: 'playstore', name: 'Play Store', hindiName: 'प्ले स्टोर', category: 'google', packageName: 'com.android.vending', webUrl: 'https://play.google.com/store', deepLink: 'market://', iconColor: 'from-cyan-500 to-blue-600', supportsInAppAction: true, quickCommand: 'Open Play Store' },
  { id: 'recorder', name: 'Recorder', hindiName: 'रिकॉर्डर', category: 'vivo', packageName: 'com.android.bbksoundrecorder', webUrl: '', iconColor: 'from-red-500 to-pink-600', supportsInAppAction: true, quickCommand: 'Open Recorder' },
  { id: 'safety', name: 'Safety', hindiName: 'सेफ्टी', category: 'tools', packageName: 'com.google.android.apps.safetyhub', webUrl: '', iconColor: 'from-rose-600 to-red-700', supportsInAppAction: true, quickCommand: 'Open Safety' },
  { id: 'settings', name: 'Settings', hindiName: 'सेटिंग्स', category: 'tools', packageName: 'com.android.settings', webUrl: '', iconColor: 'from-slate-600 to-slate-800', supportsInAppAction: true, quickCommand: 'Open Settings' },
  { id: 'simpleview', name: 'Simple View', hindiName: 'सिंपल व्यू', category: 'vivo', packageName: 'com.vivo.simplelauncher', webUrl: '', iconColor: 'from-teal-500 to-emerald-600', quickCommand: 'Open Simple View' },
  { id: 'snapchat', name: 'Snapchat', hindiName: 'स्नैपचैट', category: 'social', packageName: 'com.snapchat.android', webUrl: 'https://www.snapchat.com', deepLink: 'snapchat://', iconColor: 'from-yellow-400 to-amber-500', quickCommand: 'Open Snapchat' },
  { id: 'telegram', name: 'Telegram', hindiName: 'टेलीग्राम', category: 'social', packageName: 'org.telegram.messenger', webUrl: 'https://web.telegram.org', deepLink: 'tg://', iconColor: 'from-sky-400 to-blue-600', supportsInAppAction: true, quickCommand: 'Open Telegram' },
  { id: 'themes', name: 'Themes', hindiName: 'थीम्स', category: 'vivo', packageName: 'com.bbk.theme', webUrl: '', iconColor: 'from-purple-500 to-pink-500', quickCommand: 'Open Themes' },
  { id: 'tips', name: 'Tips', hindiName: 'टिप्स', category: 'vivo', packageName: 'com.vivo.tips', webUrl: 'https://www.vivo.com/in/support', iconColor: 'from-amber-500 to-yellow-500', quickCommand: 'Open Tips' },
  { id: 'vappstore', name: 'V-Appstore', hindiName: 'वी-ऐपस्टोर', category: 'vivo', packageName: 'com.vivo.appstore', webUrl: 'https://www.vivo.com/in', iconColor: 'from-blue-600 to-indigo-700', supportsInAppAction: true, quickCommand: 'Open V-Appstore' },
  { id: 'video', name: 'Video', hindiName: 'वीडियो', category: 'media', packageName: 'com.vivo.videoeditor', webUrl: 'https://www.youtube.com', iconColor: 'from-indigo-500 to-purple-600', quickCommand: 'Open Video' },
  { id: 'vivocloud', name: 'vivo Cloud', hindiName: 'वीवो क्लाउड', category: 'vivo', packageName: 'com.vivo.cloud', webUrl: 'https://cloud.vivo.com', iconColor: 'from-sky-500 to-blue-600', quickCommand: 'Open vivo Cloud' },
  { id: 'vivostore', name: 'vivo Store', hindiName: 'वीवो स्टोर', category: 'vivo', packageName: 'com.vivo.website', webUrl: 'https://shop.vivo.com/in', iconColor: 'from-blue-500 to-violet-600', quickCommand: 'Open vivo Store' },
  { id: 'weather', name: 'Weather', hindiName: 'मौसम', category: 'vivo', packageName: 'com.vivo.weather', webUrl: 'https://www.google.com/search?q=weather+today', iconColor: 'from-cyan-400 to-blue-500', supportsInAppAction: true, quickCommand: 'Open Weather' },
  { id: 'whatsapp', name: 'WhatsApp', hindiName: 'व्हाट्सएप', category: 'social', packageName: 'com.whatsapp', webUrl: 'https://web.whatsapp.com', deepLink: 'whatsapp://', iconColor: 'from-emerald-500 to-green-600', supportsInAppAction: true, quickCommand: 'Open WhatsApp' },
  { id: 'youtube', name: 'YouTube', hindiName: 'यूट्यूब', category: 'media', packageName: 'com.google.android.youtube', webUrl: 'https://www.youtube.com', deepLink: 'vnd.youtube://', iconColor: 'from-red-600 to-rose-700', supportsInAppAction: true, quickCommand: 'Open YouTube' },

  // Extra Daily Utility Apps
  { id: 'chrome', name: 'Chrome', hindiName: 'क्रोम', category: 'google', packageName: 'com.android.chrome', webUrl: 'https://www.google.com', iconColor: 'from-blue-500 via-amber-500 to-emerald-500', supportsInAppAction: true, quickCommand: 'Open Chrome' },
  { id: 'instagram', name: 'Instagram', hindiName: 'इंस्टाग्राम', category: 'social', packageName: 'com.instagram.android', webUrl: 'https://www.instagram.com', deepLink: 'instagram://', iconColor: 'from-pink-500 via-rose-500 to-purple-600', quickCommand: 'Open Instagram' },
  { id: 'phonepe', name: 'PhonePe', hindiName: 'फोनपे', category: 'upi', packageName: 'com.phonepe.app', webUrl: 'https://www.phonepe.com', iconColor: 'from-purple-600 to-indigo-600', quickCommand: 'Open PhonePe' },
  { id: 'gpay', name: 'Google Pay', hindiName: 'गूगल पे', category: 'upi', packageName: 'com.google.android.apps.nbu.paisa.user', webUrl: 'https://pay.google.com', iconColor: 'from-blue-500 to-emerald-500', quickCommand: 'Open Google Pay' },
  { id: 'paytm', name: 'Paytm', hindiName: 'पेटीएम', category: 'upi', packageName: 'net.one97.paytm', webUrl: 'https://paytm.com', iconColor: 'from-cyan-600 to-blue-700', quickCommand: 'Open Paytm' },
  { id: 'spotify', name: 'Spotify', hindiName: 'स्पॉटिफाई', category: 'media', packageName: 'com.spotify.music', webUrl: 'https://open.spotify.com', iconColor: 'from-emerald-600 to-green-700', supportsInAppAction: true, quickCommand: 'Open Spotify' },
  { id: 'camera', name: 'Camera', hindiName: 'कैमरा', category: 'tools', packageName: 'com.android.camera', webUrl: '', iconColor: 'from-slate-600 to-zinc-700', quickCommand: 'Open Camera' },
  { id: 'calculator', name: 'Calculator', hindiName: 'कैलकुलेटर', category: 'tools', packageName: 'com.google.android.calculator', webUrl: '', iconColor: 'from-teal-600 to-emerald-600', quickCommand: 'Open Calculator' },
];

interface AppAutomationHubProps {
  onSpeak: (text: string) => void;
  onExecuteCommand: (command: string) => void;
}

export const AppAutomationHub: React.FC<AppAutomationHubProps> = ({
  onSpeak,
  onExecuteCommand,
}) => {
  const [apps, setApps] = useState<AppDefinition[]>(() => {
    const saved = localStorage.getItem('jarvis_custom_apps');
    if (saved) {
      try {
        return [...JSON.parse(saved), ...DEFAULT_APPS];
      } catch {
        // fallback
      }
    }
    return DEFAULT_APPS;
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // In-App Action Builder state
  const [youtubeQuery, setYoutubeQuery] = useState('Cricket videos');
  const [whatsappMsg, setWhatsappMsg] = useState('Hello! Main abhi pahunch raha hoon.');
  const [mapDestination, setMapDestination] = useState('Nearest Petrol Pump');
  const [chromeSearchQuery, setChromeSearchQuery] = useState('wikipedia.org');
  const [gmailRecipient, setGmailRecipient] = useState('');
  const [pinterestQuery, setPinterestQuery] = useState('Aesthetic wallpaper 4k');
  const [storeSearchQuery, setStoreSearchQuery] = useState('WhatsApp');
  const [meetCode, setMeetCode] = useState('');

  // Real Native Android App Discovery & Per-App Permission Controls
  const discoverySnapshot = androidBridge.getDiscoveredInstalledApps();
  const [discoveredApps, setDiscoveredApps] = useState<DiscoveredAndroidApp[]>(
    discoverySnapshot.apps
  );
  const [appPermissionsMap, setAppPermissionsMap] = useState<Record<string, boolean>>(() =>
    androidBridge.getAppPermissionsMap()
  );
  const [accessibilityConsented, setAccessibilityConsented] = useState<boolean>(() =>
    androidBridge.hasAccessibilityUserConsent()
  );

  // Custom App Form
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAppName, setNewAppName] = useState('');
  const [newPackageName, setNewPackageName] = useState('');
  const [newWebUrl, setNewWebUrl] = useState('');

  const handleToggleAppPermission = (e: React.MouseEvent, packageName: string) => {
    e.stopPropagation();
    const currentlyAllowed = appPermissionsMap[packageName] !== false;
    const nextAllowed = !currentlyAllowed;
    androidBridge.setAppControlAllowed(packageName, nextAllowed);
    setAppPermissionsMap((prev) => ({ ...prev, [packageName]: nextAllowed }));
    setDiscoveredApps((prev) =>
      prev.map((a) => (a.packageName === packageName ? { ...a, isAllowed: nextAllowed } : a))
    );
  };

  const handleGrantAccessibilityConsent = () => {
    androidBridge.setAccessibilityUserConsent(true);
    setAccessibilityConsented(true);
    onSpeak('Accessibility assistance permission authorized!');
  };

  const filteredApps = apps.filter((app) => {
    const matchesSearch =
      app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.hindiName.includes(searchQuery) ||
      app.packageName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === 'all' || app.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const handleLaunchApp = (app: AppDefinition) => {
    onExecuteCommand(app.quickCommand || `Open ${app.name}`);
  };

  const handleDeleteCustomApp = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const updated = apps.filter((a) => a.id !== id);
    setApps(updated);
    const customOnly = updated.filter((a) => a.id.startsWith('custom_'));
    localStorage.setItem('jarvis_custom_apps', JSON.stringify(customOnly));
  };

  const handleAddCustomApp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAppName.trim()) return;

    const customApp: AppDefinition = {
      id: 'custom_' + Date.now(),
      name: newAppName.trim(),
      hindiName: newAppName.trim(),
      category: 'tools',
      packageName: newPackageName.trim() || `com.example.${newAppName.toLowerCase().replace(/\s+/g, '')}`,
      webUrl: newWebUrl.trim() || `https://www.google.com/search?q=${encodeURIComponent(newAppName)}`,
      iconColor: 'from-cyan-600 to-indigo-600',
      quickCommand: `Open ${newAppName.trim()}`,
    };

    const updated = [customApp, ...apps];
    setApps(updated);

    const customOnly = updated.filter((a) => a.id.startsWith('custom_'));
    localStorage.setItem('jarvis_custom_apps', JSON.stringify(customOnly));

    setShowAddModal(false);
    setNewAppName('');
    setNewPackageName('');
    setNewWebUrl('');
    onSpeak(`${customApp.name} successfully add ho gaya hai!`);
  };

  return (
    <div className="space-y-6 pb-6 text-slate-100 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="p-4 rounded-3xl bg-gradient-to-r from-blue-900/50 via-purple-900/40 to-slate-900/50 border border-cyan-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-2xl bg-cyan-500/20 text-cyan-300 mt-1">
            <Smartphone className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-extrabold text-base text-white">
                Android Universal App Control Hub
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 font-bold">
                {discoverySnapshot.nativeDiscovery
                  ? `${discoveredApps.length} REAL INSTALLED APPS`
                  : `${apps.length} SUPPORTED INTENTS`}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              {discoverySnapshot.nativeDiscovery
                ? 'Native Android Bridge connected! PackageManager se phone ke real installed apps discovered hain.'
                : 'Browser Mode: Standard website phone ke sabhi installed apps scan nahi kar sakti. Supported Android Intents & Native Bridge yahan ready hain.'}
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Any App</span>
        </button>
      </div>

      {/* WEBSITE vs NATIVE ANDROID CAPABILITY ARCHITECTURE MATRIX */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-cyan-500/25 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-300">
            1. Website Mode (Current)
          </span>
          <p className="text-slate-300 text-[11px] leading-relaxed">
            AI Voice/Chat, ElevenLabs Speech, Offline Math, Deep Links (YouTube, WhatsApp, Maps, Chrome, Dialer, Mailto).
          </p>
        </div>
        <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-emerald-500/25 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">
            2. Native Android Companion
          </span>
          <p className="text-slate-300 text-[11px] leading-relaxed">
            Real <code className="text-emerald-200">PackageManager</code> Installed App Discovery, zero-tab package launch, Torch, System Volume/Brightness, WebView Bridge.
          </p>
        </div>
        <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-purple-500/25 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-purple-300">
            3. Individual App Permissions
          </span>
          <p className="text-slate-300 text-[11px] leading-relaxed">
            Per-app JARVIS Allow/Block toggle, explicit Accessibility consent, aur sending/payment actions se pehle User Confirmation.
          </p>
        </div>
      </div>

      {/* REAL NATIVE INSTALLED APPS DISCOVERY LIST (Only shown with real PackageManager data) */}
      {discoverySnapshot.nativeDiscovery && discoveredApps.length > 0 && (
        <div className="p-5 rounded-3xl bg-slate-900/80 border border-emerald-500/35 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <h4 className="text-xs font-bold text-emerald-200 uppercase tracking-wider">
                Real Installed Phone Apps ({discoveredApps.length} Discovered via PackageManager)
              </h4>
            </div>
            <span className="text-[10px] text-slate-400">
              Toggle karein kaunse apps JARVIS control kar sakta hai
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-64 overflow-y-auto pr-1">
            {discoveredApps
              .filter(
                (a) =>
                  !searchQuery.trim() ||
                  a.appName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  a.packageName.toLowerCase().includes(searchQuery.toLowerCase())
              )
              .map((dApp) => (
                <div
                  key={dApp.packageName}
                  onClick={() => onExecuteCommand(`Open ${dApp.appName}`)}
                  className="p-2.5 rounded-xl bg-slate-950/75 border border-slate-800 hover:border-cyan-400/40 flex items-center justify-between gap-2 cursor-pointer transition"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-white truncate">{dApp.appName}</p>
                    <p className="text-[10px] text-slate-500 font-mono truncate">{dApp.packageName}</p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => handleToggleAppPermission(e, dApp.packageName)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold shrink-0 transition ${
                      dApp.isAllowed
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    }`}
                  >
                    {dApp.isAllowed ? 'Allowed' : 'Blocked'}
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* SECTION 1: BASIC TO ADVANCED IN-APP AUTOMATOR */}
      <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            In-App Action Automator (Basic to Advanced Actions)
          </h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {/* YouTube Search & Play */}
          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-red-500/30 flex flex-col justify-between gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white">YouTube Play / Search</span>
              <span className="text-[10px] text-red-400 bg-red-500/10 px-2 py-0.5 rounded-md">Video</span>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={youtubeQuery}
                onChange={(e) => setYoutubeQuery(e.target.value)}
                placeholder="Song or video..."
                className="flex-1 bg-slate-900 text-xs text-white px-3 py-1.5 rounded-xl border border-slate-800 focus:outline-none focus:border-red-500"
              />
              <button
                onClick={() => onExecuteCommand(`YouTube par ${youtubeQuery} play karo`)}
                className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-medium flex items-center gap-1 transition"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>Play</span>
              </button>
            </div>
          </div>

          {/* WhatsApp Direct Message */}
          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-emerald-500/30 flex flex-col justify-between gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white">WhatsApp Quick Send</span>
              <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">Chat</span>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={whatsappMsg}
                onChange={(e) => setWhatsappMsg(e.target.value)}
                placeholder="Message text..."
                className="flex-1 bg-slate-900 text-xs text-white px-3 py-1.5 rounded-xl border border-slate-800 focus:outline-none focus:border-emerald-500"
              />
              <button
                onClick={() => onExecuteCommand(`WhatsApp par message bhejo ${whatsappMsg}`)}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium flex items-center gap-1 transition"
              >
                <MessageCircle className="w-3 h-3" />
                <span>Send</span>
              </button>
            </div>
          </div>

          {/* Google Maps Navigation */}
          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-teal-500/30 flex flex-col justify-between gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white">Maps Navigation</span>
              <span className="text-[10px] text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded-md">Route</span>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={mapDestination}
                onChange={(e) => setMapDestination(e.target.value)}
                placeholder="Search place..."
                className="flex-1 bg-slate-900 text-xs text-white px-3 py-1.5 rounded-xl border border-slate-800 focus:outline-none focus:border-teal-500"
              />
              <button
                onClick={() => onExecuteCommand(`Maps me ${mapDestination} ka rasta dikhao`)}
                className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-medium flex items-center gap-1 transition"
              >
                <MapPin className="w-3 h-3" />
                <span>Go</span>
              </button>
            </div>
          </div>

          {/* Pinterest Search */}
          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-rose-500/30 flex flex-col justify-between gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white">Pinterest Ideas / Wallpaper</span>
              <span className="text-[10px] text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-md">Pins</span>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={pinterestQuery}
                onChange={(e) => setPinterestQuery(e.target.value)}
                placeholder="Search pins..."
                className="flex-1 bg-slate-900 text-xs text-white px-3 py-1.5 rounded-xl border border-slate-800 focus:outline-none focus:border-rose-500"
              />
              <button
                onClick={() => onExecuteCommand(`Pinterest par ${pinterestQuery} search karo`)}
                className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium flex items-center gap-1 transition"
              >
                <ImageIcon className="w-3 h-3" />
                <span>Find</span>
              </button>
            </div>
          </div>

          {/* Play Store / V-Appstore Search */}
          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-cyan-500/30 flex flex-col justify-between gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white">Play Store / V-Appstore</span>
              <span className="text-[10px] text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-md">Apps</span>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={storeSearchQuery}
                onChange={(e) => setStoreSearchQuery(e.target.value)}
                placeholder="App name..."
                className="flex-1 bg-slate-900 text-xs text-white px-3 py-1.5 rounded-xl border border-slate-800 focus:outline-none focus:border-cyan-500"
              />
              <button
                onClick={() => onExecuteCommand(`Play Store par ${storeSearchQuery} search karo`)}
                className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium flex items-center gap-1 transition"
              >
                <Store className="w-3 h-3" />
                <span>Search</span>
              </button>
            </div>
          </div>

          {/* Google Meet Join / Start */}
          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-blue-500/30 flex flex-col justify-between gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white">Google Meet Video Call</span>
              <span className="text-[10px] text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md">Meet</span>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={meetCode}
                onChange={(e) => setMeetCode(e.target.value)}
                placeholder="Code (abc-defg-hij) or blank"
                className="flex-1 bg-slate-900 text-xs text-white px-3 py-1.5 rounded-xl border border-slate-800 focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={() =>
                  onExecuteCommand(meetCode.trim() ? `Meet join ${meetCode.trim()}` : 'Meet start new meeting')
                }
                className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium flex items-center gap-1 transition"
              >
                <Video className="w-3 h-3" />
                <span>{meetCode.trim() ? 'Join' : 'New'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Music, Chrome Website & Gmail Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-1">
          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-purple-500/30 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Music className="w-4 h-4 text-purple-400 shrink-0" />
              <span className="text-xs font-semibold text-white">Music</span>
            </div>
            <div className="flex gap-1">
              {['Prev', 'Pause', 'Play', 'Next'].map((action) => (
                <button
                  key={action}
                  onClick={() =>
                    onExecuteCommand(`Music ${action === 'Prev' ? 'previous' : action.toLowerCase()}`)
                  }
                  className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-purple-600 text-[10px] font-medium text-slate-200 transition"
                >
                  {action}
                </button>
              ))}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-blue-500/30 flex items-center gap-2">
            <Globe className="w-4 h-4 text-blue-400 shrink-0" />
            <input
              type="text"
              value={chromeSearchQuery}
              onChange={(e) => setChromeSearchQuery(e.target.value)}
              placeholder="Website (e.g. wikipedia.org)"
              className="flex-1 bg-slate-900 text-xs text-white px-2.5 py-1.5 rounded-xl border border-slate-800 focus:outline-none focus:border-blue-500"
            />
            <button
              onClick={() => onExecuteCommand(`Open ${chromeSearchQuery} in Chrome`)}
              className="px-2.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition shrink-0"
            >
              Chrome
            </button>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-rose-500/30 flex items-center gap-2">
            <Mail className="w-4 h-4 text-rose-400 shrink-0" />
            <input
              type="email"
              value={gmailRecipient}
              onChange={(e) => setGmailRecipient(e.target.value)}
              placeholder="Email address (optional)..."
              className="flex-1 bg-slate-900 text-xs text-white px-2.5 py-1.5 rounded-xl border border-slate-800 focus:outline-none focus:border-rose-500"
            />
            <button
              onClick={() =>
                onExecuteCommand(
                  gmailRecipient.trim() ? `Send email to ${gmailRecipient.trim()}` : 'Compose email in Gmail'
                )
              }
              className="px-2.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium transition shrink-0"
            >
              Gmail
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 2: ACCESSIBILITY SCREEN AUTO-CONTROLLER */}
      <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <MousePointer className="w-4 h-4 text-purple-400" />
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Optional Accessibility Assistance (Explicit User Permission Required)
            </h4>
          </div>
          {accessibilityConsented ? (
            <span className="text-[10px] text-emerald-300 bg-emerald-500/20 px-2.5 py-0.5 rounded-full font-semibold border border-emerald-500/30">
              Authorized by User
            </span>
          ) : (
            <button
              type="button"
              onClick={handleGrantAccessibilityConsent}
              className="text-[10px] text-amber-200 bg-amber-500/20 hover:bg-amber-500/30 px-2.5 py-1 rounded-full font-semibold border border-amber-400/40 transition"
            >
              Authorize Accessibility Service
            </button>
          )}
        </div>

        <p className="text-xs text-slate-400">
          Transparent user-authorized UI assistance: screen scroll, accessible click, Home/Back navigation. Kabhi bhi OTP, lock screen ya login security bypass nahi karta.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 pt-1">
          {[
            { cmd: 'Scroll down', label: 'Scroll Down', icon: <ArrowDown className="w-4 h-4 text-cyan-400" /> },
            { cmd: 'Scroll up', label: 'Scroll Up', icon: <ArrowUp className="w-4 h-4 text-cyan-400" /> },
            { cmd: 'Click Search', label: 'Click Search', icon: <Search className="w-4 h-4 text-purple-400" /> },
            { cmd: 'Click Send', label: 'Click Send', icon: <MessageCircle className="w-4 h-4 text-emerald-400" /> },
            { cmd: 'Take screenshot', label: 'Screenshot', icon: <Camera className="w-4 h-4 text-amber-400" /> },
            { cmd: 'Recent apps', label: 'Recent Apps', icon: <Layers className="w-4 h-4 text-pink-400" /> },
          ].map((btn) => (
            <button
              key={btn.cmd}
              onClick={() => onExecuteCommand(btn.cmd)}
              className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs flex flex-col items-center justify-center gap-1 border border-slate-700 transition"
            >
              {btn.icon}
              <span>{btn.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* SECTION 3: ALL APPS CATALOG */}
      <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Your Phone Apps Library ({filteredApps.length} Apps)
            </h4>
            <p className="text-[11px] text-slate-400">
              Tap karein ya voice me bolein: "Open MovieBox+", "V-Appstore kholo", "MyJio open karo"
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search app (e.g. MovieBox+, V-Appstore)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 text-xs text-white pl-9 pr-3 py-2 rounded-xl border border-slate-800 focus:outline-none focus:border-cyan-400 placeholder:text-slate-500"
            />
          </div>
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {[
            { id: 'all', label: 'All Apps' },
            { id: 'vivo', label: 'vivo Apps' },
            { id: 'google', label: 'Google' },
            { id: 'social', label: 'Social & Chat' },
            { id: 'media', label: 'Media & OTT' },
            { id: 'tools', label: 'System & Safety' },
            { id: 'upi', label: 'Jio & UPI' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1 rounded-xl text-xs font-medium whitespace-nowrap transition ${
                selectedCategory === cat.id
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 pt-1">
          {filteredApps.map((app) => {
            const isAllowed = appPermissionsMap[app.packageName] !== false;
            return (
              <div
                key={app.id}
                onClick={() => handleLaunchApp(app)}
                className={`p-3 rounded-2xl bg-slate-950/70 hover:bg-slate-800/80 border transition cursor-pointer flex flex-col items-center text-center gap-2 group relative overflow-hidden shadow-sm ${
                  isAllowed ? 'border-slate-800/80 hover:border-cyan-400/50' : 'border-rose-500/30 opacity-65'
                }`}
              >
                <button
                  type="button"
                  onClick={(e) => handleToggleAppPermission(e, app.packageName)}
                  title={isAllowed ? 'Disable JARVIS control for this app' : 'Allow JARVIS control for this app'}
                  className={`absolute top-1.5 left-1.5 p-1 rounded-lg text-[9px] font-bold transition ${
                    isAllowed
                      ? 'bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-300 hover:bg-rose-500/35'
                  }`}
                >
                  {isAllowed ? <ShieldCheck className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                </button>

                {app.id.startsWith('custom_') && (
                  <button
                    onClick={(e) => handleDeleteCustomApp(e, app.id)}
                    className="absolute top-1.5 right-1.5 p-1 rounded-lg bg-slate-900/90 text-slate-400 hover:text-red-400 opacity-0 group-hover:opacity-100 transition"
                    title="Remove custom app"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}

                <div
                  className={`w-11 h-11 rounded-2xl bg-gradient-to-tr ${app.iconColor} flex items-center justify-center text-white font-extrabold text-sm shadow-md group-hover:scale-105 transition-transform`}
                >
                  {app.name.slice(0, 2).toUpperCase()}
                </div>

                <div className="w-full">
                  <span className="text-xs font-semibold text-slate-200 block truncate group-hover:text-cyan-300">
                    {app.name}
                  </span>
                  <span className="text-[10px] text-slate-500 block truncate font-mono">
                    {app.packageName}
                  </span>
                </div>

                {!isAllowed ? (
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    Blocked
                  </span>
                ) : (
                  app.supportsInAppAction && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      Intent Ready
                    </span>
                  )
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* MODAL: ADD CUSTOM APP */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-cyan-500/40 p-6 shadow-2xl text-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="font-bold text-sm text-white">Add Any Custom Phone App</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddCustomApp} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">App Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Truecaller, BGMI, Hotstar"
                  value={newAppName}
                  onChange={(e) => setNewAppName(e.target.value)}
                  className="w-full bg-slate-950 text-white px-3 py-2 rounded-xl border border-slate-800 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Android Package Name (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. com.truecaller"
                  value={newPackageName}
                  onChange={(e) => setNewPackageName(e.target.value)}
                  className="w-full bg-slate-950 text-white px-3 py-2 rounded-xl border border-slate-800 focus:outline-none focus:border-cyan-400 font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Web / Deep Link URL (Optional)</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={newWebUrl}
                  onChange={(e) => setNewWebUrl(e.target.value)}
                  className="w-full bg-slate-950 text-white px-3 py-2 rounded-xl border border-slate-800 focus:outline-none focus:border-cyan-400 text-[11px]"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold shadow-md transition"
                >
                  Save App
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
