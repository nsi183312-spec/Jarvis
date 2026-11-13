import React, { useEffect, useRef, useState } from 'react';
import { BuiltInAppModalType } from '../types';
import { tryEvaluateOfflineArithmetic } from '../services/offlineBrain';
import {
  Calculator,
  Camera,
  Download,
  Mic,
  PhoneCall,
  RefreshCw,
  ShieldAlert,
  Square,
  X,
} from 'lucide-react';

interface BuiltInAppModalsProps {
  activeModal: BuiltInAppModalType | null;
  onClose: () => void;
  onSpeak?: (text: string) => void;
}

export const BuiltInAppModals: React.FC<BuiltInAppModalsProps> = ({
  activeModal,
  onClose,
  onSpeak,
}) => {
  if (!activeModal) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-md rounded-3xl bg-[#040c24] border border-cyan-400/60 shadow-[0_0_40px_rgba(34,211,238,0.28)] overflow-hidden text-slate-100">
        {activeModal === 'calculator' && <CalculatorView onClose={onClose} onSpeak={onSpeak} />}
        {activeModal === 'camera' && <CameraView onClose={onClose} onSpeak={onSpeak} />}
        {activeModal === 'recorder' && <RecorderView onClose={onClose} onSpeak={onSpeak} />}
        {activeModal === 'safety' && <SafetyView onClose={onClose} onSpeak={onSpeak} />}
      </div>
    </div>
  );
};

const CalculatorView: React.FC<{ onClose: () => void; onSpeak?: (t: string) => void }> = ({
  onClose,
  onSpeak,
}) => {
  const [expr, setExpr] = useState('');
  const [result, setResult] = useState('0');

  const evaluateNow = (nextExpr: string) => {
    const solved = tryEvaluateOfflineArithmetic(nextExpr);
    if (solved && !Number.isNaN(solved.result)) {
      setResult(String(solved.result));
      if (onSpeak) onSpeak(`${nextExpr} equals ${solved.result}`);
    } else if (/^\d+(?:\.\d+)?$/.test(nextExpr.trim())) {
      setResult(nextExpr.trim());
    } else {
      setResult('Error');
    }
  };

  const handlePress = (val: string) => {
    if (val === 'C') {
      setExpr('');
      setResult('0');
      return;
    }
    if (val === '⌫') {
      setExpr((prev) => prev.slice(0, -1));
      return;
    }
    if (val === '=') {
      if (expr.trim()) evaluateNow(expr);
      return;
    }
    setExpr((prev) => prev + val);
  };

  const keys = ['C', '(', ')', '/', '7', '8', '9', '*', '4', '5', '6', '-', '1', '2', '3', '+', '0', '.', '⌫', '='];

  return (
    <div className="p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-cyan-500/20 pb-3">
        <div className="flex items-center gap-2 text-cyan-300 font-semibold text-sm">
          <Calculator className="w-4 h-4" />
          <span>Calculator (Offline)</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="min-w-[40px] min-h-[40px] rounded-xl bg-slate-900 hover:bg-slate-800 flex items-center justify-center text-slate-300"
          aria-label="Close calculator"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 rounded-2xl bg-slate-950/90 border border-cyan-500/30 text-right space-y-1">
        <div className="text-xs font-mono text-slate-400 min-h-[18px] break-all">
          {expr || '0'}
        </div>
        <div className="text-3xl font-bold font-mono tabular-nums text-cyan-300 break-all">
          {result}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {keys.map((k) => {
          const isEquals = k === '=';
          const isOp = ['/', '*', '-', '+', 'C', '⌫', '(', ')'].includes(k);
          return (
            <button
              key={k}
              type="button"
              onClick={() => handlePress(k)}
              className={`min-h-[48px] rounded-xl font-mono text-base font-bold transition ${
                isEquals
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_0_15px_rgba(34,211,238,0.4)]'
                  : isOp
                  ? 'bg-slate-900 border border-cyan-500/30 text-cyan-300 hover:bg-slate-800'
                  : 'bg-slate-900/70 border border-slate-800 text-slate-100 hover:bg-slate-800'
              }`}
            >
              {k}
            </button>
          );
        })}
      </div>
    </div>
  );
};

const CameraView: React.FC<{ onClose: () => void; onSpeak?: (t: string) => void }> = ({
  onClose,
  onSpeak,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [capturedUrl, setCapturedUrl] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    let active = true;

    const startCam = async () => {
      try {
        setError('');
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
        }
        if (!navigator.mediaDevices?.getUserMedia) {
          setError('Camera API is not available in this browser context.');
          return;
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode },
          audio: false,
        });
        if (!active) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch {
        setError('Camera permission denied or camera unavailable on this device.');
      }
    };

    startCam();
    return () => {
      active = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, [facingMode]);

  const handleCapture = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/png');
      setCapturedUrl(dataUrl);
      if (onSpeak) onSpeak('Photo click kar liya hai!');
    }
  };

  return (
    <div className="p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-cyan-500/20 pb-3">
        <div className="flex items-center gap-2 text-cyan-300 font-semibold text-sm">
          <Camera className="w-4 h-4" />
          <span>JARVIS Camera</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="min-w-[40px] min-h-[40px] rounded-xl bg-slate-900 hover:bg-slate-800 flex items-center justify-center text-slate-300"
          aria-label="Close camera"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-cyan-500/30 aspect-[4/3] flex items-center justify-center">
        {error ? (
          <p className="text-xs text-amber-300 text-center px-4">{error}</p>
        ) : capturedUrl ? (
          <img src={capturedUrl} alt="Captured photo" className="w-full h-full object-cover" />
        ) : (
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
        )}
      </div>

      <div className="flex items-center gap-2">
        {!capturedUrl ? (
          <>
            <button
              type="button"
              onClick={() => setFacingMode((m) => (m === 'user' ? 'environment' : 'user'))}
              className="min-h-[44px] px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Flip</span>
            </button>
            <button
              type="button"
              onClick={handleCapture}
              disabled={Boolean(error)}
              className="flex-1 min-h-[44px] px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-40"
            >
              <Camera className="w-4 h-4" />
              <span>Capture Photo</span>
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setCapturedUrl('')}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-semibold text-slate-200"
            >
              Retake
            </button>
            <a
              href={capturedUrl}
              download={`jarvis_photo_${Date.now()}.png`}
              className="flex-1 min-h-[44px] px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 text-xs font-bold flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>Save Photo</span>
            </a>
          </>
        )}
      </div>
    </div>
  );
};

const RecorderView: React.FC<{ onClose: () => void; onSpeak?: (t: string) => void }> = ({
  onClose,
  onSpeak,
}) => {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [audioUrl, setAudioUrl] = useState('');
  const [error, setError] = useState('');
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (!recording) return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [recording]);

  useEffect(() => {
    return () => {
      if (recorderRef.current && recorderRef.current.state !== 'inactive') {
        recorderRef.current.stop();
      }
    };
  }, []);

  const toggleRecording = async () => {
    if (recording && recorderRef.current) {
      recorderRef.current.stop();
      setRecording(false);
      return;
    }

    try {
      setError('');
      setAudioUrl('');
      setSeconds(0);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      chunksRef.current = [];
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      rec.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((t) => t.stop());
        if (onSpeak) onSpeak('Voice recording save ho gayi hai!');
      };
      recorderRef.current = rec;
      rec.start();
      setRecording(true);
    } catch {
      setError('Microphone permission allow karein recording start karne ke liye.');
    }
  };

  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');

  return (
    <div className="p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-cyan-500/20 pb-3">
        <div className="flex items-center gap-2 text-cyan-300 font-semibold text-sm">
          <Mic className="w-4 h-4" />
          <span>Voice Recorder</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="min-w-[40px] min-h-[40px] rounded-xl bg-slate-900 hover:bg-slate-800 flex items-center justify-center text-slate-300"
          aria-label="Close recorder"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-6 rounded-2xl bg-slate-950/80 border border-cyan-500/30 flex flex-col items-center gap-3">
        <span className="text-3xl font-mono font-bold tabular-nums text-cyan-300">
          {mm}:{ss}
        </span>
        <span className="text-xs text-slate-400">
          {recording ? 'Recording in progress...' : audioUrl ? 'Recording ready to play' : 'Tap Start to record audio'}
        </span>
        {error && <p className="text-xs text-amber-300 text-center">{error}</p>}
      </div>

      {audioUrl && (
        <audio controls src={audioUrl} className="w-full" />
      )}

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={toggleRecording}
          className={`flex-1 min-h-[46px] px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition ${
            recording
              ? 'bg-rose-600 hover:bg-rose-500 text-white'
              : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white'
          }`}
        >
          {recording ? <Square className="w-4 h-4 fill-current" /> : <Mic className="w-4 h-4" />}
          <span>{recording ? 'Stop Recording' : 'Start Recording'}</span>
        </button>
        {audioUrl && (
          <a
            href={audioUrl}
            download={`jarvis_recording_${Date.now()}.webm`}
            className="min-h-[46px] px-4 py-2.5 rounded-xl bg-emerald-500 text-slate-950 text-xs font-bold flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" />
            <span>Save</span>
          </a>
        )}
      </div>
    </div>
  );
};

const SafetyView: React.FC<{ onClose: () => void; onSpeak?: (t: string) => void }> = ({
  onClose,
  onSpeak,
}) => {
  const helplines = [
    { label: 'National Emergency (SOS)', num: '112' },
    { label: 'Police Helpline', num: '100' },
    { label: 'Ambulance', num: '108' },
    { label: 'Women Helpline', num: '1091' },
    { label: 'Fire Brigade', num: '101' },
  ];

  return (
    <div className="p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-rose-500/30 pb-3">
        <div className="flex items-center gap-2 text-rose-300 font-semibold text-sm">
          <ShieldAlert className="w-4 h-4" />
          <span>Safety & Emergency SOS</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="min-w-[40px] min-h-[40px] rounded-xl bg-slate-900 hover:bg-slate-800 flex items-center justify-center text-slate-300"
          aria-label="Close safety modal"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <p className="text-xs text-slate-300">
        Emergency me turant call karne ke liye kisi bhi helpline par tap karein:
      </p>

      <div className="space-y-2">
        {helplines.map((item) => (
          <a
            key={item.num}
            href={`tel:${item.num}`}
            onClick={() => onSpeak && onSpeak(`${item.label} ${item.num} dial kar rahi hoon.`)}
            className="min-h-[48px] px-4 py-2.5 rounded-2xl bg-slate-900/90 hover:bg-rose-950/60 border border-rose-500/30 flex items-center justify-between transition"
          >
            <span className="text-xs font-semibold text-white">{item.label}</span>
            <span className="text-sm font-mono font-bold text-rose-300 flex items-center gap-1.5">
              <PhoneCall className="w-3.5 h-3.5" />
              {item.num}
            </span>
          </a>
        ))}
      </div>
    </div>
  );
};
