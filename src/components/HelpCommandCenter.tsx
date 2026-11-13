import React, { useState } from 'react';
import { ThemeConfig } from '../theme';
import {
  Calculator,
  Compass,
  Mic,
  Search,
  Share2,
  Smartphone,
  Sparkles,
  Volume2,
  Check,
  Copy,
  SlidersHorizontal,
} from 'lucide-react';

interface HelpCommandCenterProps {
  theme: ThemeConfig;
  onRunCommand: (command: string) => void;
  onOpenVoiceSettings: () => void;
  onOpenAllApps: () => void;
}

interface CommandGroup {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  commands: Array<{ label: string; cmd: string; hint: string }>;
}

const COMMAND_GROUPS: CommandGroup[] = [
  {
    id: 'device',
    title: 'Device & Phone Controls',
    description: 'Tap karein ya voice se bolein — instant control',
    icon: <SlidersHorizontal className="w-4 h-4 text-cyan-300" />,
    commands: [
      { label: 'Flashlight On', cmd: 'Flashlight on', hint: 'Torch jalao' },
      { label: 'Flashlight Off', cmd: 'Flashlight off', hint: 'Torch band' },
      { label: 'Data On', cmd: 'Data on', hint: 'Mobile net chalu' },
      { label: 'Data Off', cmd: 'Data off', hint: 'Mobile net band' },
      { label: 'Turn on Wi-Fi', cmd: 'Turn on Wi-Fi', hint: 'Wi-Fi on karo' },
      { label: 'Bluetooth Off', cmd: 'Bluetooth off', hint: 'Bluetooth band' },
      { label: 'Brightness 50%', cmd: 'Set screen brightness to 50%', hint: 'Screen light' },
      { label: 'DND / Silent On', cmd: 'Do not disturb on', hint: 'Silent mode' },
      { label: 'Volume Up', cmd: 'Volume up', hint: 'Awaaz badhao' },
      { label: 'Battery Check', cmd: 'Check battery', hint: 'Battery kitni hai' },
    ],
  },
  {
    id: 'apps',
    title: 'Open Any App (34+ Apps)',
    description: 'YouTube, WhatsApp, Camera, Calculator, Maps, Play Store & more',
    icon: <Smartphone className="w-4 h-4 text-blue-300" />,
    commands: [
      { label: 'Open YouTube', cmd: 'Open YouTube', hint: 'YouTube kholo' },
      { label: 'YouTube Play Song', cmd: 'YouTube par Arijit Singh songs play karo', hint: 'Direct video search' },
      { label: 'Open WhatsApp', cmd: 'Open WhatsApp', hint: 'WhatsApp kholo' },
      { label: 'Maps Navigation', cmd: 'Maps me nearest petrol pump ka rasta dikhao', hint: 'Directions' },
      { label: 'Open Camera', cmd: 'Open Camera', hint: 'Live Camera' },
      { label: 'Open Calculator', cmd: 'Open Calculator', hint: 'Offline Calculator' },
      { label: 'Open Recorder', cmd: 'Open Recorder', hint: 'Audio memo' },
      { label: 'Open Safety SOS', cmd: 'Open Safety', hint: '112 / 100 / 108' },
      { label: 'Open MyJio', cmd: 'Open MyJio', hint: 'Jio balance' },
      { label: 'Open Play Store', cmd: 'Open Play Store', hint: 'Download apps' },
    ],
  },
  {
    id: 'math_tools',
    title: 'Offline Math, Timers, Alarms & Notes',
    description: 'Internet ke bina bhi 100% kaam karta hai',
    icon: <Calculator className="w-4 h-4 text-purple-300" />,
    commands: [
      { label: 'What is 5 plus 10', cmd: 'what is 5 plus 10', hint: 'Offline calculation' },
      { label: '25% of 200', cmd: '25% of 200', hint: 'Percentage' },
      { label: 'Square root of 144', cmd: 'square root of 144', hint: 'Math root' },
      { label: 'Set Timer 1 min', cmd: 'Set timer for 1 minute', hint: 'Countdown timer' },
      { label: 'Set Alarm 7 AM', cmd: 'Set alarm 7:00 AM', hint: 'Morning alarm' },
      { label: 'Create Note', cmd: 'Note likho Buy milk and fruits', hint: 'Save note' },
      { label: 'Check Time', cmd: 'What is the time', hint: 'Abhi samay' },
      { label: 'Check Weather', cmd: 'Weather today', hint: 'Aaj ka mausam' },
    ],
  },
  {
    id: 'nav',
    title: 'Calls, SMS & Screen Navigation',
    description: 'Safe confirmation aur hands-free navigation',
    icon: <Compass className="w-4 h-4 text-emerald-300" />,
    commands: [
      { label: 'Call Contact', cmd: 'Call Mom', hint: 'Safe confirmation' },
      { label: 'Send SMS', cmd: 'Message bhejo Rahul', hint: 'Quick SMS' },
      { label: 'Scroll Down', cmd: 'Scroll down', hint: 'Screen niche' },
      { label: 'Scroll Up', cmd: 'Scroll up', hint: 'Screen upar' },
      { label: 'Open Device Control', cmd: 'Open Device Control', hint: 'All controls' },
      { label: 'Tell me a joke', cmd: 'Tell me a joke', hint: 'Hindi/English joke' },
    ],
  },
];

export const HelpCommandCenter: React.FC<HelpCommandCenterProps> = ({
  theme,
  onRunCommand,
  onOpenVoiceSettings,
  onOpenAllApps,
}) => {
  const [filter, setFilter] = useState('');
  const [copiedUrl, setCopiedUrl] = useState(false);

  const shareUrl = typeof window !== 'undefined' ? window.location.origin : '';

  const filteredGroups = COMMAND_GROUPS.map((group) => ({
    ...group,
    commands: group.commands.filter(
      (c) =>
        !filter.trim() ||
        c.label.toLowerCase().includes(filter.toLowerCase()) ||
        c.cmd.toLowerCase().includes(filter.toLowerCase()) ||
        c.hint.toLowerCase().includes(filter.toLowerCase())
    ),
  })).filter((g) => g.commands.length > 0);

  return (
    <div className="space-y-5 pb-6 text-slate-100 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div
        className={`p-4 sm:p-5 rounded-3xl bg-[#040e2a]/85 backdrop-blur-xl border ${theme.statusCardBorder} ${theme.statusCardShadow} flex flex-col sm:flex-row sm:items-center justify-between gap-4`}
      >
        <div>
          <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <Sparkles className={`w-5 h-5 ${theme.accentText}`} />
            <span>JARVIS Commands & App Help Center</span>
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Neeche kisi bhi command par tap karein — JARVIS turant execute karegi. Voice mic ya text input dono se sabhi commands chalte hain!
          </p>
        </div>

        <div className="flex flex-wrap gap-2 shrink-0">
          <button
            type="button"
            onClick={onOpenVoiceSettings}
            className="min-h-[42px] px-3.5 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/50 text-cyan-200 text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <Mic className="w-3.5 h-3.5" />
            <span>Mic Diagnostics</span>
          </button>
          <button
            type="button"
            onClick={onOpenAllApps}
            className="min-h-[42px] px-3.5 py-2 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/50 text-blue-200 text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Browse 34+ Apps</span>
          </button>
        </div>
      </div>

      {/* Search Commands */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
        <input
          type="text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Search any command (e.g. wifi, youtube, calculator, timer, torch)..."
          className={`w-full bg-[#040c24]/90 text-xs sm:text-sm text-white pl-10 pr-4 py-3 rounded-2xl border border-blue-500/35 focus:outline-none ${theme.inputFocusBorder} placeholder:text-slate-500`}
        />
      </div>

      {/* Interactive Command Groups */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredGroups.map((group) => (
          <div
            key={group.id}
            className="p-4 rounded-3xl bg-[#040c24]/80 border border-blue-500/30 space-y-3"
          >
            <div className="flex items-start gap-2.5 border-b border-slate-800/80 pb-2.5">
              <div className="p-2 rounded-xl bg-slate-900 border border-blue-500/30 shrink-0">
                {group.icon}
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">{group.title}</h3>
                <p className="text-[11px] text-slate-400">{group.description}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {group.commands.map((item) => (
                <button
                  key={item.cmd}
                  type="button"
                  onClick={() => onRunCommand(item.cmd)}
                  className="min-h-[46px] p-2.5 rounded-2xl bg-slate-950/75 hover:bg-cyan-500/15 border border-slate-800 hover:border-cyan-400/60 text-left transition flex items-center justify-between gap-2 group"
                >
                  <div className="min-w-0">
                    <span className="text-xs font-semibold text-slate-100 group-hover:text-cyan-200 block truncate">
                      {item.label}
                    </span>
                    <span className="text-[10px] text-slate-400 block truncate">
                      “{item.hint}”
                    </span>
                  </div>
                  <Volume2 className="w-3.5 h-3.5 text-cyan-400/70 group-hover:text-cyan-300 shrink-0" />
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Share / Browser Tips Card */}
      <div className="p-4 rounded-3xl bg-[#040c24]/80 border border-blue-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
            <Share2 className="w-4 h-4 text-cyan-400" />
            <span>Open in Other Browser / Mobile Mic Tip</span>
          </h3>
          <p className="text-[11px] text-slate-300">
            Agar iframe preview me mic blocked ho, to link copy karke Chrome/Safari me kholein — wahan direct voice aur flashlight hardware dono chalenge.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            if (shareUrl) {
              navigator.clipboard.writeText(shareUrl);
              setCopiedUrl(true);
              setTimeout(() => setCopiedUrl(false), 1800);
            }
          }}
          className="min-h-[42px] px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 shrink-0"
        >
          {copiedUrl ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          <span>{copiedUrl ? 'Link Copied!' : 'Copy App Link'}</span>
        </button>
      </div>
    </div>
  );
};
