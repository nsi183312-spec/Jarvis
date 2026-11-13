import React, { useEffect, useState } from 'react';
import { CloudVoiceItem, ThemeId, VoiceSettings } from '../types';
import { voiceEngine } from '../services/voiceEngine';
import { MicDiagnosticPanel } from './MicDiagnosticPanel';
import { ThemeSelector } from './ThemeSelector';
import { Play, Sliders, Shield, Sparkles } from 'lucide-react';

interface SettingsPanelProps {
  settings: VoiceSettings;
  onUpdateSettings: (newSettings: Partial<VoiceSettings>) => void;
  onTestVoice: () => void;
  onStartRecorderMode?: () => void;
  activeThemeId: ThemeId;
  onSelectTheme: (themeId: ThemeId) => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  settings,
  onUpdateSettings,
  onTestVoice,
  onStartRecorderMode,
  activeThemeId,
  onSelectTheme,
}) => {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [cloudVoices, setCloudVoices] = useState<CloudVoiceItem[]>([]);
  const [verifiedIndianFemale, setVerifiedIndianFemale] = useState<boolean>(false);

  useEffect(() => {
    const updateVoiceList = () => {
      const list = voiceEngine.getAvailableVoices();
      setVoices(list);
      const detection = voiceEngine.findBestIndianFemaleVoice();
      setVerifiedIndianFemale(detection.isIndianFemale);
    };

    updateVoiceList();
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = updateVoiceList;
    }

    voiceEngine.fetchCloudVoices().then((res) => {
      if (res.voices.length > 0) {
        setCloudVoices(res.voices);
      }
    });
  }, []);

  return (
    <div className="space-y-6 pb-6 text-slate-100 max-w-2xl mx-auto">
      {/* Global Color Theme & UI Accent Selector */}
      <ThemeSelector activeThemeId={activeThemeId} onSelectTheme={onSelectTheme} />

      {/* Live Mic Connectivity Debugger */}
      <MicDiagnosticPanel onUseRecorderMode={onStartRecorderMode} />

      {/* Gemini AI Brain Status & Billing Card */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-blue-950/30 to-slate-900/40 border border-cyan-500/30 flex items-start gap-3">
        <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300 mt-0.5">
          <Shield className="w-5 h-5" />
        </div>
        <div className="text-xs">
          <h3 className="font-semibold text-sm text-cyan-200">
            Gemini AI Cloud Brain &amp; Live Voice Engine
          </h3>
          <p className="text-slate-300 mt-1">
            JARVIS uses <strong className="text-cyan-200">Gemini 4 Hydrogen</strong> for Q&amp;A, <strong className="text-cyan-200">Gemini 3.8 Live</strong> for real-time voice conversations, and <strong className="text-cyan-200">Gemini 3.8 TTS</strong> for natural speech.
          </p>
          <div className="mt-2.5 p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-300">
            <span className="font-semibold text-cyan-300 block mb-0.5">Tip for Cloud AI Generation:</span>
            Ensure your billing-enabled <strong className="text-white">GEMINI_API_KEY</strong> is selected in AI Studio&apos;s <strong className="text-white">Settings &gt; Secrets</strong> panel so Live Voice, TTS, and Q&amp;A respond without 403 limits.
          </div>
          {!verifiedIndianFemale && voices.length > 0 && (
            <p className="text-[10px] text-amber-300/90 mt-2">
              Note: System default voices active (hi-IN/en-IN female pack may require device TTS download).
            </p>
          )}
        </div>
      </div>

      {/* Voice Synthesizer Configuration */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Voice Engine Settings
            </h4>
          </div>
          <button
            onClick={onTestVoice}
            className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium flex items-center gap-1.5 transition shadow-sm"
          >
            <Play className="w-3 h-3 fill-current" />
            <span>Voice Preview</span>
          </button>
        </div>

        {/* HD Neural Voice Engine Toggle & Selector */}
        <div className="p-3 rounded-xl bg-gradient-to-r from-purple-950/40 via-cyan-950/30 to-slate-900/60 border border-cyan-500/30 space-y-3">
          <label className="flex items-center justify-between cursor-pointer">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-300" />
              <div>
                <span className="text-xs font-semibold text-cyan-200 block">
                  HD Neural Voice (Hindi + Hinglish + English)
                </span>
                <span className="text-[11px] text-slate-400">
                  Studio-quality natural female voice with automatic offline fallback
                </span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.useCloudVoice !== false}
              onChange={(e) => onUpdateSettings({ useCloudVoice: e.target.checked })}
              className="w-4 h-4 accent-cyan-400 rounded"
            />
          </label>

          {settings.useCloudVoice !== false && (
            <div className="space-y-2.5">
              <div>
                <label className="text-[11px] text-slate-300 block mb-1">
                  Neural Voice Persona
                </label>
                <select
                  value={settings.elevenLabsVoiceId || 'ihKwLOjVUMG4lgUI6meZ'}
                  onChange={(e) => onUpdateSettings({ elevenLabsVoiceId: e.target.value })}
                  className="w-full bg-slate-900 text-xs text-white px-3 py-2 rounded-xl border border-cyan-500/40 focus:outline-none focus:border-cyan-400"
                >
                  {cloudVoices.length === 0 ? (
                    <>
                      <option value="gemini:Kore">JARVIS Gemini Voice — Kore (Warm Female)</option>
                      <option value="gemini:Zephyr">JARVIS Gemini Voice — Zephyr (Bright Female)</option>
                      <option value="ihKwLOjVUMG4lgUI6meZ">
                        Leo - Curious Character (ElevenLabs ID: ihKwLOjVUMG4lgUI6meZ)
                      </option>
                    </>
                  ) : (
                    cloudVoices.map((cv) => (
                      <option key={cv.voice_id} value={cv.voice_id}>
                        {cv.name}
                        {cv.gender ? ` (${cv.gender}` : ''}
                        {cv.supportsHindi ? ' • Hindi+EN' : ''}
                        {cv.gender ? ')' : ''}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">
                  Custom Voice ID (Active: <code className="text-cyan-300">{settings.elevenLabsVoiceId || 'ihKwLOjVUMG4lgUI6meZ'}</code>)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={settings.elevenLabsVoiceId || 'ihKwLOjVUMG4lgUI6meZ'}
                    onChange={(e) => onUpdateSettings({ elevenLabsVoiceId: e.target.value.trim() })}
                    placeholder="Enter Voice ID or gemini:Kore"
                    className="flex-1 bg-slate-950 text-xs text-cyan-200 px-3 py-1.5 rounded-xl border border-slate-700 focus:outline-none focus:border-cyan-400 font-mono"
                  />
                  <button
                    type="button"
                    onClick={onTestVoice}
                    className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-cyan-200 text-xs font-medium transition"
                  >
                    Test ID
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-1.5 leading-relaxed">
                  Server automatically uses <strong className="text-cyan-300">Gemini 3.8 TTS</strong> fallback whenever ElevenLabs is unavailable, or select a <code className="text-cyan-300">gemini:Kore</code> / <code className="text-cyan-300">gemini:Zephyr</code> voice directly.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Browser Fallback Voice Selector */}
        <div>
          <label className="text-xs text-slate-400 block mb-1.5">
            Fallback Browser Voice (Offline)
          </label>
          <select
            value={settings.voiceURI}
            onChange={(e) => onUpdateSettings({ voiceURI: e.target.value })}
            className="w-full bg-slate-800 text-xs text-white px-3 py-2 rounded-xl border border-slate-700 focus:outline-none focus:border-cyan-400"
          >
            <option value="">Default Recommended Indian Female Voice</option>
            {voices.map((v, index) => {
              const uniqueKey = `${v.voiceURI || v.name}_${v.lang}_${index}`;
              return (
                <option key={uniqueKey} value={v.voiceURI}>
                  {v.name} ({v.lang}) {v.default ? '— Default' : ''}
                </option>
              );
            })}
          </select>
        </div>

        {/* Pitch Slider (Cute / Soft voice) */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-400">Sweetness / Vocal Pitch</span>
            <span className="text-cyan-300 font-semibold">{settings.pitch.toFixed(2)}x</span>
          </div>
          <input
            type="range"
            min="0.8"
            max="1.5"
            step="0.05"
            value={settings.pitch}
            onChange={(e) => onUpdateSettings({ pitch: parseFloat(e.target.value) })}
            className="w-full accent-cyan-400 bg-slate-800 h-2 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500 mt-1">
            <span>Deeper (0.8x)</span>
            <span className="text-cyan-400">Cute & Sweet (1.15x recommended)</span>
            <span>Higher (1.5x)</span>
          </div>
        </div>

        {/* Speed / Rate Slider */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-400">Conversational Speed</span>
            <span className="text-cyan-300 font-semibold">{settings.rate.toFixed(2)}x</span>
          </div>
          <input
            type="range"
            min="0.7"
            max="1.4"
            step="0.05"
            value={settings.rate}
            onChange={(e) => onUpdateSettings({ rate: parseFloat(e.target.value) })}
            className="w-full accent-cyan-400 bg-slate-800 h-2 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500 mt-1">
            <span>Slow (0.7x)</span>
            <span className="text-cyan-400">Natural (1.0x)</span>
            <span>Fast (1.4x)</span>
          </div>
        </div>
      </div>

      {/* Assistant Behavioral Options */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
        <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
          Assistant Behavior
        </h4>

        {/* Auto-Speak Responses */}
        <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/40 border border-slate-800 cursor-pointer hover:bg-slate-800/60 transition">
          <div>
            <span className="text-xs font-medium text-slate-200 block">Auto-Speak Responses</span>
            <span className="text-[11px] text-slate-400">
              Speak replies out loud automatically in JARVIS sweet voice
            </span>
          </div>
          <input
            type="checkbox"
            checked={settings.autoSpeak}
            onChange={(e) => onUpdateSettings({ autoSpeak: e.target.checked })}
            className="w-4 h-4 accent-cyan-500 rounded"
          />
        </label>

        {/* Wake-Word Continuous Listening ("Hey JARVIS") */}
        <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/40 border border-slate-800 cursor-pointer hover:bg-slate-800/60 transition">
          <div>
            <span className="text-xs font-medium text-slate-200 block">
              Wake-Word Service ("Hey JARVIS")
            </span>
            <span className="text-[11px] text-slate-400">
              Emulates Android foreground voice service with persistent microphone badge
            </span>
          </div>
          <input
            type="checkbox"
            checked={settings.wakeWordEnabled}
            onChange={(e) => onUpdateSettings({ wakeWordEnabled: e.target.checked })}
            className="w-4 h-4 accent-cyan-500 rounded"
          />
        </label>

        {/* Preferred Language Mode */}
        <div>
          <label className="text-xs text-slate-400 block mb-1.5">Preferred Interaction Mode</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'auto', label: 'Bilingual Hinglish', desc: 'Hindi + English mix' },
              { id: 'hi-IN', label: 'Pure Hindi', desc: 'हिन्दी संवाद' },
              { id: 'en-IN', label: 'Indian English', desc: 'English (India)' },
            ].map((mode) => (
              <button
                key={mode.id}
                onClick={() => onUpdateSettings({ preferredLanguage: mode.id as any })}
                className={`p-2.5 rounded-xl border text-left transition ${
                  settings.preferredLanguage === mode.id
                    ? 'bg-purple-600/20 border-purple-400 text-purple-200 shadow-sm'
                    : 'bg-slate-800/50 border-slate-700/60 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className="text-xs font-semibold block">{mode.label}</span>
                <span className="text-[10px] opacity-70 block">{mode.desc}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
