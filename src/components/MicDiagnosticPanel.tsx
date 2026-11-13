import React, { useEffect, useRef, useState } from 'react';
import { MicDiagnosticReport, voiceEngine } from '../services/voiceEngine';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Mic,
  RefreshCw,
  ShieldAlert,
  Volume2,
  XCircle,
} from 'lucide-react';

interface MicDiagnosticPanelProps {
  onUseRecorderMode?: () => void;
}

export const MicDiagnosticPanel: React.FC<MicDiagnosticPanelProps> = ({ onUseRecorderMode }) => {
  const [report, setReport] = useState<MicDiagnosticReport | null>(null);
  const [isTestingSignal, setIsTestingSignal] = useState(false);
  const [rmsLevel, setRmsLevel] = useState(0);
  const [peakLevel, setPeakLevel] = useState(0);
  const [signalError, setSignalError] = useState<string>('');
  const [activeDeviceLabel, setActiveDeviceLabel] = useState<string>('');
  const stopTestRef = useRef<(() => void) | null>(null);

  const loadDiagnostics = async () => {
    const data = await voiceEngine.getMicDiagnostics();
    setReport(data);
  };

  useEffect(() => {
    loadDiagnostics();
    return () => {
      if (stopTestRef.current) {
        stopTestRef.current();
        stopTestRef.current = null;
      }
    };
  }, []);

  const handleToggleSignalTest = async () => {
    if (isTestingSignal) {
      if (stopTestRef.current) {
        stopTestRef.current();
        stopTestRef.current = null;
      }
      setIsTestingSignal(false);
      setRmsLevel(0);
      setPeakLevel(0);
      return;
    }

    setSignalError('');
    const result = await voiceEngine.startHardwareMicTest((rms, peak) => {
      setRmsLevel(rms);
      setPeakLevel(peak);
    });

    if (!result.ok) {
      setSignalError(result.error || 'Could not access microphone hardware.');
      setIsTestingSignal(false);
      loadDiagnostics();
      return;
    }

    stopTestRef.current = result.stop;
    setActiveDeviceLabel(result.deviceLabel || 'Default Microphone');
    setIsTestingSignal(true);
    loadDiagnostics();
  };

  const StatusIcon = ({ ok, warn = false }: { ok: boolean; warn?: boolean }) =>
    ok ? (
      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
    ) : warn ? (
      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
    ) : (
      <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
    );

  return (
    <div className="p-4 rounded-2xl bg-slate-900/80 border border-cyan-500/30 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" />
          <h4 className="text-xs font-bold text-cyan-200 uppercase tracking-wider">
            Mic Connectivity Debugger
          </h4>
        </div>
        <button
          onClick={loadDiagnostics}
          className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 flex items-center gap-1 transition"
        >
          <RefreshCw className="w-3 h-3" />
          <span>Re-Check</span>
        </button>
      </div>

      {/* Environment & Permission Checks */}
      {report && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center gap-2">
            <StatusIcon ok={report.secureContext} />
            <div>
              <span className="font-semibold text-slate-200 block">HTTPS / Secure Context</span>
              <span className="text-[10px] text-slate-400">
                {report.secureContext ? 'Valid secure origin' : 'Blocked (HTTPS required)'}
              </span>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center gap-2">
            <StatusIcon
              ok={report.permissionState === 'granted'}
              warn={report.permissionState === 'prompt' || report.permissionState === 'unsupported'}
            />
            <div>
              <span className="font-semibold text-slate-200 block">Browser Mic Permission</span>
              <span className="text-[10px] text-slate-400 capitalize">
                Status: {report.permissionState}
              </span>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center gap-2">
            <StatusIcon ok={report.speechApiSupported} warn={!report.speechApiSupported && report.mediaRecorderSupported} />
            <div>
              <span className="font-semibold text-slate-200 block">Web Speech Recognition</span>
              <span className="text-[10px] text-slate-400">
                {report.speechApiSupported
                  ? 'Supported (hi-IN / en-IN)'
                  : 'Unsupported — use HD Audio Mic'}
              </span>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center gap-2">
            <StatusIcon ok={report.inputDevices.length > 0} warn={report.inputDevices.length === 0} />
            <div>
              <span className="font-semibold text-slate-200 block">
                Detected Mics ({report.inputDevices.length})
              </span>
              <span className="text-[10px] text-slate-400 truncate block max-w-[180px]">
                {report.inputDevices[0]?.label || 'No audioinput device found'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Iframe Notice if Embedded */}
      {report?.iframeEmbedded && (
        <div className="p-2.5 rounded-xl bg-blue-950/40 border border-blue-500/30 text-[11px] text-blue-200 flex items-start gap-2">
          <ShieldAlert className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
          <span>
            App iframe preview me chal rahi hai: Agar Web Speech API preview iframe me silent ho, to{' '}
            <strong>Shared App URL ko direct new browser tab me open karein</strong> ya neeche{' '}
            <strong>HD Audio Mic</strong> mode use karein.
          </span>
        </div>
      )}

      {/* Live Hardware Audio Signal Tester */}
      <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2.5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <span className="text-xs font-semibold text-white flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
              Live Hardware Mic Signal Test
            </span>
            <span className="text-[10px] text-slate-400">
              {isTestingSignal
                ? `Active Device: ${activeDeviceLabel} — ab kuch bolein!`
                : 'Check karein ki aapke phone/PC mic se live audio signal aa raha hai ya nahi'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {onUseRecorderMode && (
              <button
                onClick={onUseRecorderMode}
                className="px-2.5 py-1.5 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 border border-purple-400/40 text-[11px] font-semibold text-purple-200 transition"
              >
                Use HD Audio Mic
              </button>
            )}
            <button
              onClick={handleToggleSignalTest}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                isTestingSignal
                  ? 'bg-rose-600 hover:bg-rose-500 text-white'
                  : 'bg-cyan-600 hover:bg-cyan-500 text-white'
              }`}
            >
              <Mic className="w-3.5 h-3.5" />
              <span>{isTestingSignal ? 'Stop Test' : 'Test Mic Signal'}</span>
            </button>
          </div>
        </div>

        {/* Real-time Meter Bar */}
        <div className="space-y-1">
          <div className="w-full h-3 rounded-full bg-slate-900 border border-slate-800 overflow-hidden p-0.5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-cyan-400 to-purple-500 transition-all duration-75"
              style={{ width: `${Math.round(rmsLevel * 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] font-mono text-slate-400">
            <span>RMS Level: {Math.round(rmsLevel * 100)}%</span>
            <span>Peak: {Math.round(peakLevel * 100)}%</span>
          </div>
        </div>

        {signalError && (
          <div className="p-2 rounded-lg bg-rose-500/15 border border-rose-500/40 text-[11px] text-rose-200">
            {signalError}
          </div>
        )}
      </div>
    </div>
  );
};
