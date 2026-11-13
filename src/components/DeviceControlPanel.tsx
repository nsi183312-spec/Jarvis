import React, { useState } from 'react';
import { DeviceState, QuickNote, AlarmItem } from '../types';
import {
  Flashlight,
  Volume2,
  Battery,
  BatteryCharging,
  Wifi,
  Bluetooth,
  Sun,
  Clock,
  FileText,
  Plus,
  Trash2,
  ExternalLink,
  Camera,
  Image as ImageIcon,
  Calculator,
  Compass,
  CheckCircle,
  Home,
  ArrowLeft,
  Signal,
  Moon,
} from 'lucide-react';

interface DeviceControlPanelProps {
  deviceState: DeviceState;
  onUpdateDeviceState: (update: Partial<DeviceState>) => void;
  onToggleFlashlight: () => void;
  notes: QuickNote[];
  onAddNote: (note: QuickNote) => void;
  onDeleteNote: (id: string) => void;
  alarms: AlarmItem[];
  onToggleAlarm: (id: string) => void;
  onAddAlarm: (alarm: AlarmItem) => void;
  onDeleteAlarm: (id: string) => void;
  onLaunchApp: (appName: string, url?: string) => void;
  onSpeakStatus: (text: string) => void;
  onExecuteCommand?: (command: string) => void;
}

export const DeviceControlPanel: React.FC<DeviceControlPanelProps> = ({
  deviceState,
  onUpdateDeviceState,
  onToggleFlashlight,
  notes,
  onAddNote,
  onDeleteNote,
  alarms,
  onToggleAlarm,
  onAddAlarm,
  onDeleteAlarm,
  onLaunchApp,
  onSpeakStatus,
  onExecuteCommand,
}) => {
  const [newNoteText, setNewNoteText] = useState('');
  const [newAlarmTime, setNewAlarmTime] = useState('07:00');
  const [newAlarmPeriod, setNewAlarmPeriod] = useState<'AM' | 'PM'>('AM');

  const handleAddQuickNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;
    const note: QuickNote = {
      id: 'note_' + Date.now(),
      title: newNoteText.slice(0, 24),
      content: newNoteText.trim(),
      createdAt: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    };
    onAddNote(note);
    setNewNoteText('');
    onSpeakStatus(`Note add kar diya hai: ${note.title}`);
  };

  const handleAddQuickAlarm = (e: React.FormEvent) => {
    e.preventDefault();
    const alarmTime = `${newAlarmTime} ${newAlarmPeriod}`;
    const alarm: AlarmItem = {
      id: 'alarm_' + Date.now(),
      time: alarmTime,
      label: 'JARVIS Alarm',
      enabled: true,
      days: ['Daily'],
    };
    onAddAlarm(alarm);
    onSpeakStatus(`Alarm set ho gaya hai ${alarmTime} ke liye.`);
  };

  return (
    <div className="space-y-6 pb-6 text-slate-100">
      {/* Device Quick Status Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Flashlight Tile */}
        <button
          onClick={onToggleFlashlight}
          className={`p-3.5 rounded-2xl border transition-all duration-300 flex flex-col items-center justify-center gap-2 relative overflow-hidden group ${
            deviceState.flashlight
              ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.3)]'
              : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
          }`}
        >
          {deviceState.flashlight && (
            <div className="absolute inset-0 bg-amber-400/10 animate-pulse pointer-events-none" />
          )}
          <Flashlight
            className={`w-6 h-6 transition-transform duration-300 ${
              deviceState.flashlight ? 'scale-110 text-amber-300' : 'text-slate-400'
            }`}
          />
          <div className="text-center">
            <span className="text-xs font-semibold block">Flashlight</span>
            <span className="text-[10px] uppercase tracking-wider opacity-80">
              {deviceState.flashlight ? 'Active / On' : 'Off'}
            </span>
          </div>
        </button>

        {/* Mobile Data Tile */}
        <button
          onClick={() => {
            const next = !deviceState.mobileDataEnabled;
            if (onExecuteCommand) {
              onExecuteCommand(next ? 'Mobile data on' : 'Mobile data off');
            } else {
              onUpdateDeviceState({ mobileDataEnabled: next });
              onSpeakStatus(next ? 'Mobile Data on kar diya hai.' : 'Mobile Data band kar diya hai.');
            }
          }}
          className={`p-3.5 rounded-2xl border transition-all duration-300 flex flex-col items-center justify-center gap-2 ${
            deviceState.mobileDataEnabled
              ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.25)]'
              : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
          }`}
        >
          <Signal className="w-6 h-6" />
          <div className="text-center">
            <span className="text-xs font-semibold block">Mobile Data</span>
            <span className="text-[10px] uppercase opacity-80">
              {deviceState.mobileDataEnabled ? 'Active / On' : 'Off'}
            </span>
          </div>
        </button>

        {/* Battery Tile */}
        <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col items-center justify-center gap-2">
          {deviceState.isCharging ? (
            <BatteryCharging className="w-6 h-6 text-emerald-400 animate-pulse" />
          ) : (
            <Battery className="w-6 h-6 text-cyan-400" />
          )}
          <div className="text-center">
            <span className="text-xs font-semibold block">Battery</span>
            <span className="text-sm font-bold text-cyan-300">{deviceState.batteryLevel}%</span>
          </div>
        </div>

        {/* Wi-Fi Tile */}
        <button
          onClick={() => {
            const next = !deviceState.wifiEnabled;
            if (onExecuteCommand) {
              onExecuteCommand(next ? 'Wi-Fi on' : 'Wi-Fi off');
            } else {
              onUpdateDeviceState({ wifiEnabled: next });
              onSpeakStatus(next ? 'Wi-Fi chalu kar diya hai.' : 'Wi-Fi band ho gaya.');
            }
          }}
          className={`p-3.5 rounded-2xl border transition-all duration-300 flex flex-col items-center justify-center gap-2 ${
            deviceState.wifiEnabled
              ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.25)]'
              : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
          }`}
        >
          <Wifi className="w-6 h-6" />
          <div className="text-center">
            <span className="text-xs font-semibold block">Wi-Fi</span>
            <span className="text-[10px] uppercase opacity-80">
              {deviceState.wifiEnabled ? 'Connected' : 'Off'}
            </span>
          </div>
        </button>

        {/* Bluetooth Tile */}
        <button
          onClick={() => {
            const next = !deviceState.bluetoothEnabled;
            if (onExecuteCommand) {
              onExecuteCommand(next ? 'Bluetooth on' : 'Bluetooth off');
            } else {
              onUpdateDeviceState({ bluetoothEnabled: next });
              onSpeakStatus(next ? 'Bluetooth on ho gaya hai.' : 'Bluetooth band ho gaya.');
            }
          }}
          className={`p-3.5 rounded-2xl border transition-all duration-300 flex flex-col items-center justify-center gap-2 ${
            deviceState.bluetoothEnabled
              ? 'bg-blue-500/20 border-blue-400 text-blue-300 shadow-[0_0_15px_rgba(59,130,246,0.25)]'
              : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
          }`}
        >
          <Bluetooth className="w-6 h-6" />
          <div className="text-center">
            <span className="text-xs font-semibold block">Bluetooth</span>
            <span className="text-[10px] uppercase opacity-80">
              {deviceState.bluetoothEnabled ? 'Enabled' : 'Off'}
            </span>
          </div>
        </button>

        {/* Do Not Disturb (DND) Tile */}
        <button
          onClick={() => {
            const next = !deviceState.dndEnabled;
            if (onExecuteCommand) {
              onExecuteCommand(next ? 'DND on' : 'DND off');
            } else {
              onUpdateDeviceState({ dndEnabled: next });
              onSpeakStatus(
                next ? 'Do Not Disturb mode ON kar diya hai.' : 'Do Not Disturb mode OFF kar diya hai.'
              );
            }
          }}
          className={`p-3.5 rounded-2xl border transition-all duration-300 flex flex-col items-center justify-center gap-2 ${
            deviceState.dndEnabled
              ? 'bg-purple-500/20 border-purple-400 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.25)]'
              : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
          }`}
        >
          <Moon className="w-6 h-6" />
          <div className="text-center">
            <span className="text-xs font-semibold block">DND / Silent</span>
            <span className="text-[10px] uppercase opacity-80">
              {deviceState.dndEnabled ? 'Active / On' : 'Off'}
            </span>
          </div>
        </button>
      </div>

      {/* Sliders: Volume & Brightness */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Media Volume Slider */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Media Volume
              </span>
            </div>
            <span className="text-xs font-bold text-cyan-300">{deviceState.volume}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={deviceState.volume}
            onChange={(e) => onUpdateDeviceState({ volume: parseInt(e.target.value, 10) })}
            className="w-full accent-cyan-400 bg-slate-800 h-2 rounded-lg cursor-pointer"
          />
        </div>

        {/* Screen Brightness Slider */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Sun className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Brightness
              </span>
            </div>
            <span className="text-xs font-bold text-amber-300">{deviceState.brightness}%</span>
          </div>
          <input
            type="range"
            min="10"
            max="100"
            value={deviceState.brightness}
            onChange={(e) => onUpdateDeviceState({ brightness: parseInt(e.target.value, 10) })}
            className="w-full accent-amber-400 bg-slate-800 h-2 rounded-lg cursor-pointer"
          />
        </div>
      </div>

      {/* App Shortcuts Drawer */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Voice App & Settings Shortcuts
        </h4>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
          {[
            { name: 'YouTube', color: 'hover:border-red-500 hover:text-red-400', cmd: 'Open YouTube' },
            { name: 'WhatsApp', color: 'hover:border-emerald-500 hover:text-emerald-400', cmd: 'Open WhatsApp' },
            { name: 'Maps', color: 'hover:border-green-500 hover:text-green-400', cmd: 'Open Maps' },
            { name: 'MyJio', color: 'hover:border-blue-500 hover:text-blue-400', cmd: 'Open MyJio' },
            { name: 'V-Appstore', color: 'hover:border-indigo-500 hover:text-indigo-400', cmd: 'Open V-Appstore' },
            { name: 'Play Store', color: 'hover:border-cyan-500 hover:text-cyan-400', cmd: 'Open Play Store' },
            { name: 'Settings', color: 'hover:border-slate-400 hover:text-white', cmd: 'Open Settings' },
            { name: 'Safety', color: 'hover:border-rose-500 hover:text-rose-400', cmd: 'Open Safety' },
          ].map((app) => (
            <button
              key={app.name}
              onClick={() => (onExecuteCommand ? onExecuteCommand(app.cmd) : onLaunchApp(app.name))}
              className={`p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 text-slate-300 text-center transition flex flex-col items-center justify-center gap-1 text-[11px] font-medium ${app.color}`}
            >
              <ExternalLink className="w-3.5 h-3.5 opacity-60" />
              <span className="truncate w-full">{app.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Alarms and Quick Notes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Alarms Panel */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Alarms & Reminders
              </h4>
            </div>
          </div>

          <form onSubmit={handleAddQuickAlarm} className="flex gap-2 mb-3">
            <input
              type="time"
              value={newAlarmTime}
              onChange={(e) => setNewAlarmTime(e.target.value)}
              className="bg-slate-800 text-xs text-white px-2.5 py-1.5 rounded-lg border border-slate-700 focus:outline-none focus:border-cyan-400"
            />
            <select
              value={newAlarmPeriod}
              onChange={(e) => setNewAlarmPeriod(e.target.value as any)}
              className="bg-slate-800 text-xs text-white px-2 py-1.5 rounded-lg border border-slate-700"
            >
              <option value="AM">AM</option>
              <option value="PM">PM</option>
            </select>
            <button
              type="submit"
              className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium flex items-center gap-1 transition"
            >
              <Plus className="w-3 h-3" />
              <span>Set</span>
            </button>
          </form>

          <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
            {alarms.map((alarm) => (
              <div
                key={alarm.id}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/40 border border-slate-800 text-xs"
              >
                <div>
                  <span className="font-bold text-sm text-cyan-300">{alarm.time}</span>
                  <span className="text-[10px] text-slate-400 ml-2">{alarm.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onToggleAlarm(alarm.id)}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      alarm.enabled ? 'bg-cyan-500/20 text-cyan-300' : 'bg-slate-700 text-slate-400'
                    }`}
                  >
                    {alarm.enabled ? 'Active' : 'Off'}
                  </button>
                  <button
                    onClick={() => onDeleteAlarm(alarm.id)}
                    className="text-slate-500 hover:text-red-400 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Notes Panel */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-purple-400" />
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Voice Notes
              </h4>
            </div>
          </div>

          <form onSubmit={handleAddQuickNote} className="flex gap-2 mb-3">
            <input
              type="text"
              placeholder="e.g. Note likho: Buy groceries..."
              value={newNoteText}
              onChange={(e) => setNewNoteText(e.target.value)}
              className="flex-1 bg-slate-800 text-xs text-white px-3 py-1.5 rounded-lg border border-slate-700 focus:outline-none focus:border-purple-400 placeholder:text-slate-500"
            />
            <button
              type="submit"
              className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium flex items-center gap-1 transition"
            >
              <Plus className="w-3 h-3" />
              <span>Save</span>
            </button>
          </form>

          <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
            {notes.map((note) => (
              <div
                key={note.id}
                className="flex items-start justify-between p-2.5 rounded-xl bg-slate-800/40 border border-slate-800 text-xs"
              >
                <div>
                  <p className="text-slate-200">{note.content}</p>
                  <span className="text-[10px] text-slate-500">{note.createdAt}</span>
                </div>
                <button
                  onClick={() => onDeleteNote(note.id)}
                  className="text-slate-500 hover:text-red-400 transition ml-2 mt-0.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Screen Navigation Emulation (Accessibility Service) */}
      <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between flex-wrap gap-2">
        <div className="text-xs">
          <span className="font-semibold text-slate-200">System Navigation Actions</span>
          <p className="text-[11px] text-slate-400">
            Assisted by JarvisAccessibilityService for hands-free Android control
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => (onExecuteCommand ? onExecuteCommand('Go back') : onSpeakStatus('Back navigation action execute kiya.'))}
            className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-300 hover:text-white flex items-center gap-1.5 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </button>
          <button
            onClick={() => (onExecuteCommand ? onExecuteCommand('Go home') : onSpeakStatus('Home screen par pahunch gaye.'))}
            className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-300 hover:text-white flex items-center gap-1.5 transition"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Home</span>
          </button>
        </div>
      </div>
    </div>
  );
};
