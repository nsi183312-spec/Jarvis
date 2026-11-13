import React, { useState } from 'react';
import { PermissionStatus, ThemeId } from '../types';
import { ThemeSelector } from './ThemeSelector';
import {
  Mic,
  Camera,
  Users,
  PhoneCall,
  Bell,
  Eye,
  ShieldCheck,
  CheckCircle,
  XCircle,
  Share2,
  Copy,
  Globe,
  Check,
} from 'lucide-react';

interface PermissionsPanelProps {
  permissions: PermissionStatus;
  onTogglePermission: (key: keyof PermissionStatus) => void;
  onRequestMicrophone: () => void;
  onRequestCamera: () => void;
  onRequestNotification: () => void;
  activeThemeId: ThemeId;
  onSelectTheme: (themeId: ThemeId) => void;
}

export const PermissionsPanel: React.FC<PermissionsPanelProps> = ({
  permissions,
  onTogglePermission,
  onRequestMicrophone,
  onRequestCamera,
  onRequestNotification,
  activeThemeId,
  onSelectTheme,
}) => {
  const [copiedUrl, setCopiedUrl] = useState(false);
  const publicUrl =
    typeof window !== 'undefined'
      ? window.location.origin
      : 'https://ais-pre-q47hvojn7ote7pwkpdldda-473929764636.asia-southeast1.run.app';

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } catch {
      // clipboard unavailable
    }
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'JARVIS AI - Personal Voice Assistant',
          text: 'Try JARVIS AI Voice Assistant with 3D Avatar & Hindi/English voice!',
          url: publicUrl,
        });
        return;
      } catch {
        // user cancelled or unsupported
      }
    }
    await handleCopyUrl();
  };

  const permissionsList = [
    {
      key: 'microphone' as keyof PermissionStatus,
      title: 'Microphone (Audio Record)',
      desc: 'Allows JARVIS to listen to your voice commands, process speech, and detect "Hey JARVIS" wake-word.',
      icon: <Mic className="w-5 h-5 text-cyan-400" />,
      actionLabel: 'Request Mic Access',
      onAction: onRequestMicrophone,
      mandatory: true,
    },
    {
      key: 'camera' as keyof PermissionStatus,
      title: 'Camera & Flashlight (Torch)',
      desc: 'Controls camera hardware for flashlight toggle and opening the camera viewfinder upon voice command.',
      icon: <Camera className="w-5 h-5 text-amber-400" />,
      actionLabel: 'Request Camera Access',
      onAction: onRequestCamera,
      mandatory: false,
    },
    {
      key: 'contacts' as keyof PermissionStatus,
      title: 'Contacts (Read Contacts)',
      desc: 'Allows JARVIS to find contact names when you say "Call Rahul" or "Message Mom".',
      icon: <Users className="w-5 h-5 text-indigo-400" />,
      actionLabel: 'Enable Contacts',
      onAction: () => onTogglePermission('contacts'),
      mandatory: false,
    },
    {
      key: 'phone' as keyof PermissionStatus,
      title: 'Phone Calls & SMS (With User Confirmation)',
      desc: 'Allows JARVIS to dial numbers and prepare SMS messages. Mandatory confirmation modal is shown before any call.',
      icon: <PhoneCall className="w-5 h-5 text-emerald-400" />,
      actionLabel: 'Enable Calls & SMS',
      onAction: () => onTogglePermission('phone'),
      mandatory: false,
    },
    {
      key: 'notifications' as keyof PermissionStatus,
      title: 'Push Notifications',
      desc: 'Displays persistent background assistant indicator and alerts for alarms and reminders.',
      icon: <Bell className="w-5 h-5 text-pink-400" />,
      actionLabel: 'Enable Notifications',
      onAction: onRequestNotification,
      mandatory: false,
    },
    {
      key: 'accessibility' as keyof PermissionStatus,
      title: 'Accessibility Service (Navigation & Control)',
      desc: 'Optional Android AccessibilityService for hands-free Home, Back, Recents, and accessible element clicks.',
      icon: <Eye className="w-5 h-5 text-purple-400" />,
      actionLabel: 'Toggle Service',
      onAction: () => onTogglePermission('accessibility'),
      mandatory: false,
    },
  ];

  return (
    <div className="space-y-6 pb-6 text-slate-100 max-w-2xl mx-auto">
      {/* Global Color Theme & UI Accent Selector */}
      <ThemeSelector activeThemeId={activeThemeId} onSelectTheme={onSelectTheme} />

      {/* Public App Link & Share Card */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-cyan-500/30 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-cyan-200 uppercase tracking-wider">
                Public App URL & Share
              </h3>
              <p className="text-[11px] text-slate-400">
                Open on Android Chrome to install as PWA or share with anyone
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleNativeShare}
            className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share</span>
          </button>
        </div>

        <div className="flex items-center gap-2 bg-slate-950/90 border border-slate-800 rounded-xl px-3 py-2">
          <code className="text-[11px] text-cyan-300 truncate flex-1">{publicUrl}</code>
          <button
            type="button"
            onClick={handleCopyUrl}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium flex items-center gap-1 shrink-0 transition"
          >
            {copiedUrl ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-300">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Privacy Guarantee Card */}
      <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 flex items-start gap-3">
        <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 mt-0.5">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div className="text-xs">
          <h3 className="font-semibold text-sm text-emerald-200">
            Privacy & Trust Architecture
          </h3>
          <p className="text-slate-300 mt-1">
            JARVIS AI strictly adheres to Android privacy guidelines:
          </p>
          <ul className="mt-2 space-y-1 text-slate-300 list-disc list-inside text-[11px]">
            <li>No hidden background audio recording — active indicator is always visible.</li>
            <li>Calls and messages require explicit affirmative user confirmation dialogs.</li>
            <li>No unauthorized screen inspection or credential harvesting.</li>
            <li>Stop listening immediately at any time by tapping the microphone.</li>
          </ul>
        </div>
      </div>

      {/* Permissions List */}
      <div className="space-y-3">
        {permissionsList.map((item) => {
          const isGranted = permissions[item.key];
          return (
            <div
              key={item.key}
              className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-700 transition"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-slate-800/80 shrink-0 mt-0.5">
                  {item.icon}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-semibold text-slate-200">{item.title}</h4>
                    {item.mandatory && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-medium">
                        Essential
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">{item.desc}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                <button
                  onClick={item.onAction}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition ${
                    isGranted
                      ? 'bg-emerald-500/20 border border-emerald-400/40 text-emerald-300'
                      : 'bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300'
                  }`}
                >
                  {isGranted ? (
                    <>
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Granted</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3.5 h-3.5 opacity-60" />
                      <span>{item.actionLabel}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
