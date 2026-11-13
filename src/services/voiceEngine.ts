import { CloudVoiceItem, VoiceSettings } from '../types';

export type MicListeningMode = 'speech-api' | 'audio-recorder';

export interface MicDiagnosticReport {
  secureContext: boolean;
  iframeEmbedded: boolean;
  speechApiSupported: boolean;
  mediaDevicesSupported: boolean;
  mediaRecorderSupported: boolean;
  permissionState: PermissionState | 'unsupported';
  inputDevices: Array<{ deviceId: string; label: string }>;
  userAgent: string;
}

export class VoiceEngine {
  private recognition: any = null;
  private isListening = false;
  private isSpeaking = false;
  private isWakeWordMode = false;
  private listeningMode: MicListeningMode = 'speech-api';

  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private micStream: MediaStream | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: BlobPart[] = [];
  private recorderAutoStopTimer: any = null;

  private animationFrameId: number | null = null;
  private speakingAnimationFrameId: number | null = null;
  private speechSyllablePulse = 0;
  private ttsWatchdogTimer: any = null;
  private noSoundWatchdogTimer: any = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private activeAudioElement: HTMLAudioElement | null = null;
  private activeAudioUrl: string | null = null;
  private ttsAbortController: AbortController | null = null;
  private ttsAnalyser: AnalyserNode | null = null;

  // Speech recognition state tracking
  private currentTranscript = '';
  private silenceTimer: any = null;
  private noSpeechRestartCount = 0;
  private hasDispatchedFinal = false;
  private soundDetected = false;
  private activeLang = 'hi-IN';

  private onStateChange: (state: 'idle' | 'listening' | 'speaking') => void = () => {};
  private onResultCallback: (text: string, isFinal: boolean) => void = () => {};
  private onErrorCallback: (error: string) => void = () => {};
  private onAudioLevelCallback: (level: number) => void = () => {};
  private onStatusDetailCallback: (detail: string) => void = () => {};

  constructor() {
    this.createFreshRecognitionInstance();
  }

  public isSpeechRecognitionSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return Boolean((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
  }

  public isMobileBrowser(): boolean {
    if (typeof navigator === 'undefined') return false;
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  public getActiveMode(): MicListeningMode {
    return this.listeningMode;
  }

  public async getMicDiagnostics(): Promise<MicDiagnosticReport> {
    const secureContext = typeof window !== 'undefined' ? window.isSecureContext : false;
    const iframeEmbedded =
      typeof window !== 'undefined' ? window.self !== window.top : false;
    const speechApiSupported = this.isSpeechRecognitionSupported();
    const mediaDevicesSupported =
      typeof navigator !== 'undefined' &&
      Boolean(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    const mediaRecorderSupported = typeof MediaRecorder !== 'undefined';

    let permissionState: PermissionState | 'unsupported' = 'unsupported';
    try {
      if (navigator.permissions && navigator.permissions.query) {
        const status = await navigator.permissions.query({
          name: 'microphone' as PermissionName,
        });
        permissionState = status.state;
      }
    } catch {
      permissionState = 'unsupported';
    }

    let inputDevices: Array<{ deviceId: string; label: string }> = [];
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
        const devices = await navigator.mediaDevices.enumerateDevices();
        inputDevices = devices
          .filter((d) => d.kind === 'audioinput')
          .map((d, idx) => ({
            deviceId: d.deviceId || `mic_${idx}`,
            label: d.label || `Microphone ${idx + 1} (label hidden until permitted)`,
          }));
      }
    } catch {
      inputDevices = [];
    }

    return {
      secureContext,
      iframeEmbedded,
      speechApiSupported,
      mediaDevicesSupported,
      mediaRecorderSupported,
      permissionState,
      inputDevices,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
    };
  }

  /**
   * Starts a standalone hardware mic signal monitor (for Mic Connectivity Debugger).
   * Ensures SpeechRecognition is stopped first so hardware is not locked.
   */
  public async startHardwareMicTest(
    onSignal: (rms: number, peak: number) => void
  ): Promise<{ ok: boolean; error?: string; deviceLabel?: string; stop: () => void }> {
    this.stopListening(true);
    this.stopSpeaking();

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return {
        ok: false,
        error: 'navigator.mediaDevices.getUserMedia is not available (requires HTTPS).',
        stop: () => {},
      };
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      const track = stream.getAudioTracks()[0];
      const deviceLabel = track?.label || 'Default Microphone';

      const ctx = this.getAudioContext();
      if (!ctx) {
        stream.getTracks().forEach((t) => t.stop());
        return { ok: false, error: 'AudioContext unavailable.', stop: () => {} };
      }

      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      const timeData = new Uint8Array(analyser.fftSize);
      let active = true;
      let rafId = 0;

      const sample = () => {
        if (!active) return;
        analyser.getByteTimeDomainData(timeData);
        let sumSq = 0;
        let peak = 0;
        for (let i = 0; i < timeData.length; i++) {
          const v = (timeData[i] - 128) / 128;
          sumSq += v * v;
          if (Math.abs(v) > peak) peak = Math.abs(v);
        }
        const rms = Math.sqrt(sumSq / timeData.length);
        onSignal(Math.min(1, rms * 3.5), Math.min(1, peak));
        rafId = requestAnimationFrame(sample);
      };
      sample();

      const stop = () => {
        active = false;
        if (rafId) cancelAnimationFrame(rafId);
        try {
          source.disconnect();
        } catch {
          // ignore
        }
        stream.getTracks().forEach((t) => t.stop());
      };

      return { ok: true, deviceLabel, stop };
    } catch (err: any) {
      const name = err?.name || 'Error';
      let friendly = err?.message || 'Microphone access failed.';
      if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
        friendly = 'Permission Denied: Browser or iframe blocked microphone access.';
      } else if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
        friendly = 'No Microphone Found: Connect or enable an audio input device.';
      } else if (name === 'NotReadableError' || name === 'TrackStartError') {
        friendly = 'Mic Busy: Another app (call, recorder, or tab) is holding the microphone.';
      }
      return { ok: false, error: `${name}: ${friendly}`, stop: () => {} };
    }
  }

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioContext) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.audioContext = new AudioCtx();
      }
    }
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume().catch(() => {});
    }
    return this.audioContext;
  }

  public playActivationChime() {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(660, now);
      osc1.frequency.exponentialRampToValueAtTime(990, now + 0.08);

      gainNode.gain.setValueAtTime(0.001, now);
      gainNode.gain.linearRampToValueAtTime(0.06, now + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.11);

      osc1.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc1.start(now);
      osc1.stop(now + 0.12);
    } catch {
      // ignore
    }
  }

  public playDeactivationChime() {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(780, now);
      osc.frequency.exponentialRampToValueAtTime(440, now + 0.1);

      gainNode.gain.setValueAtTime(0.05, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.13);
    } catch {
      // ignore
    }
  }

  private createFreshRecognitionInstance() {
    if (typeof window === 'undefined') return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      this.recognition = null;
      return;
    }

    if (this.recognition) {
      try {
        this.recognition.onstart = null;
        this.recognition.onresult = null;
        this.recognition.onerror = null;
        this.recognition.onend = null;
        this.recognition.abort();
      } catch {
        // ignore
      }
    }

    try {
      const rec = new SpeechRecognition();
      const isMobile = this.isMobileBrowser();
      rec.continuous = !isMobile;
      rec.interimResults = true;
      rec.maxAlternatives = 3;
      rec.lang = this.activeLang;

      rec.onstart = () => {
        this.isListening = true;
        this.currentTranscript = '';
        this.hasDispatchedFinal = false;
        this.soundDetected = false;
        this.onStateChange('listening');
        this.onStatusDetailCallback(`Mic active (${this.activeLang}) — boliye...`);
        this.startListeningWaveformLoop();

        if (this.noSoundWatchdogTimer) clearTimeout(this.noSoundWatchdogTimer);
        this.noSoundWatchdogTimer = setTimeout(() => {
          if (this.isListening && !this.soundDetected && !this.currentTranscript.trim()) {
            const inIframe = typeof window !== 'undefined' && window.self !== window.top;
            const isOnline = typeof navigator === 'undefined' ? true : navigator.onLine;
            if (inIframe && isOnline && typeof MediaRecorder !== 'undefined') {
              this.onStatusDetailCallback('Preview iframe me Web Speech silent hai — HD Audio Mic shuru ho raha hai...');
              this.stopListening(true);
              this.startAudioRecorderListening(this.activeLang);
            } else {
              this.onStatusDetailCallback(
                'Awaaz detect nahi ho rahi — mic ke paas bolein ya HD Audio Mic use karein'
              );
            }
          }
        }, 3500);
      };

      rec.onaudiostart = () => {
        this.onStatusDetailCallback('Audio stream connected — sun rahi hoon!');
      };

      rec.onsoundstart = () => {
        this.soundDetected = true;
        if (this.noSoundWatchdogTimer) clearTimeout(this.noSoundWatchdogTimer);
        this.onStatusDetailCallback('Awaaz sunai de rahi hai...');
      };

      rec.onspeechstart = () => {
        this.soundDetected = true;
        this.noSpeechRestartCount = 0;
        if (this.noSoundWatchdogTimer) clearTimeout(this.noSoundWatchdogTimer);
        this.onStatusDetailCallback('Speech capture ho raha hai...');
      };

      rec.onspeechend = () => {
        if (this.currentTranscript.trim() && !this.hasDispatchedFinal) {
          if (this.silenceTimer) clearTimeout(this.silenceTimer);
          this.silenceTimer = setTimeout(() => {
            if (this.currentTranscript.trim() && !this.hasDispatchedFinal && this.isListening) {
              this.commitCurrentSpeech();
            }
          }, 850);
        }
      };

      rec.onresult = (event: any) => {
        let finalText = '';
        let interimText = '';

        for (let i = 0; i < event.results.length; ++i) {
          const result = event.results[i];
          const transcript = result[0]?.transcript || '';
          if (result.isFinal) {
            finalText += transcript + ' ';
          } else {
            interimText += transcript;
          }
        }

        const combined = (finalText + interimText).replace(/\s+/g, ' ').trim();
        if (combined) {
          this.soundDetected = true;
          this.noSpeechRestartCount = 0;
          if (this.noSoundWatchdogTimer) clearTimeout(this.noSoundWatchdogTimer);
          this.currentTranscript = combined;
          this.onResultCallback(combined, false);

          const lastResult = event.results[event.results.length - 1];
          if (lastResult && lastResult.isFinal && this.isMobileBrowser()) {
            this.commitCurrentSpeech();
            return;
          }

          if (this.silenceTimer) clearTimeout(this.silenceTimer);
          this.silenceTimer = setTimeout(() => {
            if (this.currentTranscript.trim() && !this.hasDispatchedFinal && this.isListening) {
              this.commitCurrentSpeech();
            }
          }, 1150);
        }
      };

      rec.onerror = (event: any) => {
        const errCode = event?.error || 'unknown';
        if (this.silenceTimer) clearTimeout(this.silenceTimer);
        if (this.noSoundWatchdogTimer) clearTimeout(this.noSoundWatchdogTimer);

        if (this.currentTranscript.trim() && !this.hasDispatchedFinal) {
          this.commitCurrentSpeech();
          return;
        }

        if (errCode === 'no-speech') {
          this.noSpeechRestartCount += 1;
          if (this.isListening && (this.isWakeWordMode || this.noSpeechRestartCount <= 1)) {
            this.onStatusDetailCallback('Koi awaaz nahi mili, phir se sun rahi hoon...');
            return;
          }
        }

        this.stopListeningWaveformLoop();
        this.isListening = false;
        this.onStateChange('idle');

        const isOnline = typeof navigator === 'undefined' ? true : navigator.onLine;

        if (
          errCode === 'network' ||
          errCode === 'service-not-allowed' ||
          errCode === 'language-not-supported' ||
          errCode === 'audio-capture'
        ) {
          if (!isOnline) {
            this.onErrorCallback(
              'Offline mode me Google Speech network band hai. Neeche command likhkar ya Phone Control buttons se chalayein.'
            );
            return;
          }
          this.onStatusDetailCallback('Web Speech blocked — switching to HD Audio Recorder...');
          this.startAudioRecorderListening(this.activeLang);
          return;
        }

        if (errCode !== 'aborted') {
          this.onErrorCallback(errCode);
        }
      };

      rec.onend = () => {
        if (this.noSoundWatchdogTimer) clearTimeout(this.noSoundWatchdogTimer);

        if (this.currentTranscript.trim() && !this.hasDispatchedFinal) {
          this.commitCurrentSpeech();
          return;
        }

        if (
          this.isListening &&
          this.listeningMode === 'speech-api' &&
          (this.isWakeWordMode || (this.noSpeechRestartCount > 0 && this.noSpeechRestartCount <= 1))
        ) {
          try {
            rec.lang = this.activeLang;
            rec.start();
            return;
          } catch {
            // Fall through to idle cleanly
          }
        }

        this.isListening = false;
        this.stopListeningWaveformLoop();
        if (!this.isSpeaking) {
          this.onStateChange('idle');
        }
      };

      this.recognition = rec;
    } catch (err) {
      console.warn('Failed to initialize SpeechRecognition:', err);
      this.recognition = null;
    }
  }

  public commitCurrentSpeech() {
    if (!this.currentTranscript.trim() || this.hasDispatchedFinal) return;
    this.hasDispatchedFinal = true;
    const textToSubmit = this.currentTranscript.trim();
    this.currentTranscript = '';
    if (this.silenceTimer) clearTimeout(this.silenceTimer);
    if (this.noSoundWatchdogTimer) clearTimeout(this.noSoundWatchdogTimer);

    this.stopListening(true);
    this.onResultCallback(textToSubmit, true);
  }

  private startListeningWaveformLoop() {
    this.stopListeningWaveformLoop();
    let phase = 0;
    const tick = () => {
      if (!this.isListening || this.listeningMode !== 'speech-api') {
        if (!this.isSpeaking) this.onAudioLevelCallback(0);
        return;
      }
      phase += this.soundDetected ? 0.24 : 0.09;
      // Only show reactive voice energy once real sound is detected (honest feedback)
      const level = this.soundDetected
        ? Math.min(1, Math.max(0.18, 0.42 + Math.sin(phase) * 0.35 + Math.random() * 0.14))
        : 0.05 + (Math.sin(phase) + 1) * 0.025;
      this.onAudioLevelCallback(level);
      this.animationFrameId = requestAnimationFrame(tick);
    };
    tick();
  }

  private stopListeningWaveformLoop() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.releaseMicStream();
    if (!this.isSpeaking) {
      this.onAudioLevelCallback(0);
    }
  }

  private releaseMicStream() {
    if (this.micStream) {
      this.micStream.getTracks().forEach((track) => track.stop());
      this.micStream = null;
    }
    this.analyser = null;
  }

  public async startAudioRecorderListening(lang: string = 'hi-IN') {
    this.stopSpeaking();
    this.listeningMode = 'audio-recorder';
    this.activeLang = lang;
    this.recordedChunks = [];

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      this.onErrorCallback('Microphone API is not available in this browser (HTTPS required).');
      return;
    }

    try {
      this.micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      this.isListening = true;
      this.onStateChange('listening');
      this.onStatusDetailCallback('HD Audio Recorder active — bolne ke baad Mic dabayein');

      const ctx = this.getAudioContext();
      if (ctx) {
        const source = ctx.createMediaStreamSource(this.micStream);
        this.analyser = ctx.createAnalyser();
        this.analyser.fftSize = 256;
        source.connect(this.analyser);
        const dataArray = new Uint8Array(this.analyser.frequencyBinCount);

        const checkVolume = () => {
          if (!this.isListening || !this.analyser || this.listeningMode !== 'audio-recorder') {
            return;
          }
          this.analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
          const avg = sum / dataArray.length;
          this.onAudioLevelCallback(Math.min(1, avg / 90));
          this.animationFrameId = requestAnimationFrame(checkVolume);
        };
        checkVolume();
      }

      const preferredMime =
        typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported('audio/mp4')
          ? 'audio/mp4'
          : '';

      this.mediaRecorder = preferredMime
        ? new MediaRecorder(this.micStream, { mimeType: preferredMime })
        : new MediaRecorder(this.micStream);

      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          this.recordedChunks.push(e.data);
        }
      };

      this.mediaRecorder.onstop = async () => {
        const mime = this.mediaRecorder?.mimeType || 'audio/webm';
        const chunks = [...this.recordedChunks];
        this.recordedChunks = [];
        this.releaseMicStream();

        if (chunks.length === 0) {
          this.onStateChange('idle');
          return;
        }

        const blob = new Blob(chunks, { type: mime });
        if (blob.size < 800) {
          this.onStateChange('idle');
          this.onErrorCallback('Audio bahut chhota tha, kripya thoda zor se bolein.');
          return;
        }

        await this.transcribeRecordedAudio(blob, mime);
      };

      this.mediaRecorder.start();

      if (this.recorderAutoStopTimer) clearTimeout(this.recorderAutoStopTimer);
      this.recorderAutoStopTimer = setTimeout(() => {
        if (this.isListening && this.listeningMode === 'audio-recorder') {
          this.stopListening();
        }
      }, 8000);
    } catch (err: any) {
      this.isListening = false;
      this.stopListeningWaveformLoop();
      this.onStateChange('idle');
      const msg = err?.name === 'NotAllowedError' ? 'not-allowed' : err?.message || 'audio-capture';
      this.onErrorCallback(msg);
    }
  }

  private async transcribeRecordedAudio(blob: Blob, mimeType: string) {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      this.onStateChange('idle');
      this.onErrorCallback(
        'Offline mode me HD Audio transcription unavailable hai. Neeche text/command buttons use karein.'
      );
      return;
    }

    try {
      this.onStatusDetailCallback('Awaaz process ho rahi hai...');
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          const idx = result.indexOf(',');
          resolve(idx >= 0 ? result.slice(idx + 1) : result);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      const resp = await fetch('/api/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioBase64: base64,
          mimeType,
          language: this.activeLang,
        }),
      });

      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        this.onErrorCallback(
          data.error || 'Voice transcription requires Web Speech browser support or an active Gemini API key.'
        );
        return;
      }

      const data = await resp.json();
      if (data.transcript && data.transcript.trim()) {
        this.onResultCallback(data.transcript.trim(), true);
      } else {
        this.onErrorCallback('Kuch sunai nahi diya, kripya phir se bolein.');
      }
    } catch {
      this.onErrorCallback('Audio process karne me error aaya.');
    }
  }

  public setCallbacks(callbacks: {
    onStateChange: (state: 'idle' | 'listening' | 'speaking') => void;
    onResult: (text: string, isFinal: boolean) => void;
    onError: (err: string) => void;
    onAudioLevel?: (level: number) => void;
    onStatusDetail?: (detail: string) => void;
  }) {
    this.onStateChange = callbacks.onStateChange;
    this.onResultCallback = callbacks.onResult;
    this.onErrorCallback = callbacks.onError;
    if (callbacks.onAudioLevel) {
      this.onAudioLevelCallback = callbacks.onAudioLevel;
    }
    if (callbacks.onStatusDetail) {
      this.onStatusDetailCallback = callbacks.onStatusDetail;
    }
  }

  public setWakeWordMode(enabled: boolean) {
    this.isWakeWordMode = enabled;
  }

  /**
   * Starts speech listening SYNCHRONOUSLY inside user gesture handler
   * so mobile Chrome / WebView / iframe permissions never get rejected.
   */
  public startListening(lang: string = 'hi-IN', forceRecorderMode: boolean = false) {
    this.stopSpeaking();
    this.activeLang = lang === 'auto' ? 'hi-IN' : lang;
    this.noSpeechRestartCount = 0;

    if (forceRecorderMode || !this.isSpeechRecognitionSupported()) {
      this.startAudioRecorderListening(this.activeLang);
      return;
    }

    // Create a clean instance on every start so stale error state never blocks recognition
    this.createFreshRecognitionInstance();

    if (!this.recognition) {
      this.startAudioRecorderListening(this.activeLang);
      return;
    }

    this.listeningMode = 'speech-api';
    this.isListening = true;
    this.currentTranscript = '';
    this.hasDispatchedFinal = false;
    this.onStateChange('listening');
    this.onStatusDetailCallback('Mic chalu ho raha hai...');

    try {
      this.recognition.lang = this.activeLang;
      // SYNCHRONOUS call inside user click gesture!
      this.recognition.start();
    } catch {
      this.startAudioRecorderListening(this.activeLang);
    }
  }

  public stopListening(silent: boolean = false) {
    if (!silent) {
      this.playDeactivationChime();
    }
    if (this.silenceTimer) clearTimeout(this.silenceTimer);
    if (this.noSoundWatchdogTimer) clearTimeout(this.noSoundWatchdogTimer);
    if (this.recorderAutoStopTimer) clearTimeout(this.recorderAutoStopTimer);

    // If user already spoke interim speech before tapping stop, dispatch it instead of dropping it
    if (
      !silent &&
      this.listeningMode === 'speech-api' &&
      this.currentTranscript.trim() &&
      !this.hasDispatchedFinal
    ) {
      this.commitCurrentSpeech();
      return;
    }

    const stoppingRecorder =
      this.listeningMode === 'audio-recorder' &&
      this.mediaRecorder &&
      this.mediaRecorder.state !== 'inactive';

    if (stoppingRecorder && this.mediaRecorder) {
      try {
        this.mediaRecorder.stop();
      } catch {
        // ignore
      }
    }

    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch {
        // ignore
      }
    }

    this.isListening = false;
    this.stopListeningWaveformLoop();
    if (!stoppingRecorder) {
      this.onStatusDetailCallback('');
    }
    if (!this.isSpeaking) {
      this.onStateChange('idle');
    }
  }

  public getAvailableVoices(): SpeechSynthesisVoice[] {
    if (typeof window === 'undefined' || !window.speechSynthesis) return [];
    return window.speechSynthesis.getVoices();
  }

  public findBestIndianFemaleVoice(): { voice: SpeechSynthesisVoice | null; isIndianFemale: boolean } {
    const voices = this.getAvailableVoices();
    if (voices.length === 0) return { voice: null, isIndianFemale: false };

    const hindiFemale = voices.find((v) => {
      const lang = v.lang.toLowerCase();
      const name = v.name.toLowerCase();
      const isHindi = lang.includes('hi') || lang.includes('hin');
      const isFemale =
        name.includes('female') ||
        name.includes('lekha') ||
        name.includes('swara') ||
        name.includes('kalpana') ||
        name.includes('neerja');
      return isHindi && isFemale;
    });
    if (hindiFemale) return { voice: hindiFemale, isIndianFemale: true };

    const indianEnglishFemale = voices.find((v) => {
      const lang = v.lang.toLowerCase();
      const name = v.name.toLowerCase();
      const isIndian = lang.includes('en-in') || lang.includes('en_in');
      const isFemale =
        name.includes('female') ||
        name.includes('raveena') ||
        name.includes('heera') ||
        name.includes('priya') ||
        name.includes('veena');
      return isIndian && isFemale;
    });
    if (indianEnglishFemale) return { voice: indianEnglishFemale, isIndianFemale: true };

    const anyHindi = voices.find((v) => v.lang.toLowerCase().startsWith('hi'));
    if (anyHindi) return { voice: anyHindi, isIndianFemale: true };

    const anyIndian = voices.find((v) => v.lang.toLowerCase().includes('in'));
    if (anyIndian) return { voice: anyIndian, isIndianFemale: true };

    const friendlyFemale = voices.find((v) => {
      const name = v.name.toLowerCase();
      return (
        name.includes('samantha') ||
        name.includes('karen') ||
        name.includes('female') ||
        name.includes('zira')
      );
    });

    return { voice: friendlyFemale || voices[0], isIndianFemale: false };
  }

  public async fetchCloudVoices(): Promise<{ voices: CloudVoiceItem[]; defaultVoiceId: string }> {
    try {
      const resp = await fetch('/api/tts/voices');
      if (!resp.ok) return { voices: [], defaultVoiceId: 'ihKwLOjVUMG4lgUI6meZ' };
      const data = await resp.json();
      return {
        voices: Array.isArray(data?.voices) ? data.voices : [],
        defaultVoiceId: data?.defaultVoiceId || 'ihKwLOjVUMG4lgUI6meZ',
      };
    } catch {
      return { voices: [], defaultVoiceId: 'ihKwLOjVUMG4lgUI6meZ' };
    }
  }

  public speak(
    text: string,
    settings: VoiceSettings,
    onWordOrBoundary?: (charIndex: number) => void,
    onComplete?: () => void
  ) {
    if (typeof window === 'undefined') return;

    this.stopSpeaking();

    const cleanText = text
      .replace(/[*_#`~]/g, '')
      .replace(/\[.*?\]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanText) return;

    const isOnline = typeof navigator === 'undefined' ? true : navigator.onLine;
    if (settings.useCloudVoice !== false && isOnline) {
      this.speakWithCloudTts(cleanText, settings, onWordOrBoundary, onComplete);
      return;
    }

    this.speakWithBrowserSynthesis(cleanText, settings, onWordOrBoundary, onComplete);
  }

  private async speakWithCloudTts(
    cleanText: string,
    settings: VoiceSettings,
    onWordOrBoundary?: (charIndex: number) => void,
    onComplete?: () => void
  ) {
    const controller = new AbortController();
    this.ttsAbortController = controller;
    this.isSpeaking = true;
    this.onStateChange('speaking');
    this.startSpeakingLevelMonitoring();

    const finishCloudSpeaking = () => {
      if (this.ttsWatchdogTimer) {
        clearTimeout(this.ttsWatchdogTimer);
        this.ttsWatchdogTimer = null;
      }
      this.cleanupActiveAudioElement();
      this.ttsAbortController = null;
      this.isSpeaking = false;
      this.stopSpeakingLevelMonitoring();
      this.onStateChange('idle');
      if (onComplete) onComplete();
    };

    const fetchTimeout = setTimeout(() => {
      controller.abort();
    }, 6500);

    try {
      const resp = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          text: cleanText,
          voiceId: settings.elevenLabsVoiceId || 'ihKwLOjVUMG4lgUI6meZ',
          speed: settings.rate || 1.0,
        }),
      });
      clearTimeout(fetchTimeout);

      if (controller.signal.aborted) return;

      if (!resp.ok) {
        throw new Error(`Cloud TTS HTTP ${resp.status}`);
      }

      const audioBlob = await resp.blob();
      if (controller.signal.aborted) return;

      const objectUrl = URL.createObjectURL(audioBlob);
      this.activeAudioUrl = objectUrl;

      const audio = new Audio(objectUrl);
      this.activeAudioElement = audio;

      // Connect real-time audio analyser for organic avatar & waveform sync
      try {
        const ctx = this.getAudioContext();
        if (ctx) {
          if (ctx.state === 'suspended') {
            await ctx.resume();
          }
          const mediaSource = ctx.createMediaElementSource(audio);
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 256;
          mediaSource.connect(analyser);
          analyser.connect(ctx.destination);
          this.ttsAnalyser = analyser;
        }
      } catch {
        this.ttsAnalyser = null;
      }

      audio.onended = () => {
        finishCloudSpeaking();
      };

      audio.onerror = () => {
        if (!controller.signal.aborted) {
          this.cleanupActiveAudioElement();
          this.speakWithBrowserSynthesis(cleanText, settings, onWordOrBoundary, onComplete);
        }
      };

      const estimatedMs = Math.max(8000, cleanText.length * 130 + 4000);
      this.ttsWatchdogTimer = setTimeout(() => {
        if (this.isSpeaking) {
          finishCloudSpeaking();
        }
      }, estimatedMs);

      await audio.play();
    } catch (err: any) {
      if (err?.name === 'AbortError' || controller.signal.aborted) {
        return;
      }
      this.cleanupActiveAudioElement();
      this.ttsAbortController = null;
      this.speakWithBrowserSynthesis(cleanText, settings, onWordOrBoundary, onComplete);
    }
  }

  private speakWithBrowserSynthesis(
    cleanText: string,
    settings: VoiceSettings,
    onWordOrBoundary?: (charIndex: number) => void,
    onComplete?: () => void
  ) {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      this.isSpeaking = false;
      this.onStateChange('idle');
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    this.currentUtterance = utterance;

    const voices = this.getAvailableVoices();
    let selectedVoice: SpeechSynthesisVoice | undefined;

    if (settings.voiceURI) {
      selectedVoice = voices.find((v) => v.voiceURI === settings.voiceURI);
    }
    if (!selectedVoice) {
      selectedVoice = this.findBestIndianFemaleVoice().voice || undefined;
    }
    if (selectedVoice) {
      utterance.voice = selectedVoice;
      utterance.lang = selectedVoice.lang;
    } else {
      utterance.lang = 'hi-IN';
    }

    utterance.pitch = settings.pitch || 1.15;
    utterance.rate = settings.rate || 1.0;

    const finishSpeaking = () => {
      if (this.ttsWatchdogTimer) {
        clearTimeout(this.ttsWatchdogTimer);
        this.ttsWatchdogTimer = null;
      }
      this.isSpeaking = false;
      this.currentUtterance = null;
      this.stopSpeakingLevelMonitoring();
      this.onStateChange('idle');
      if (onComplete) onComplete();
    };

    utterance.onstart = () => {
      this.isSpeaking = true;
      this.onStateChange('speaking');
      this.startSpeakingLevelMonitoring();
    };

    utterance.onboundary = (e) => {
      this.speechSyllablePulse = 0.85;
      if (onWordOrBoundary) {
        onWordOrBoundary(e.charIndex);
      }
    };

    utterance.onend = finishSpeaking;
    utterance.onerror = () => finishSpeaking();

    const estimatedMs = Math.max(4000, cleanText.length * 110 + 2500);
    this.ttsWatchdogTimer = setTimeout(() => {
      if (this.isSpeaking) {
        finishSpeaking();
      }
    }, estimatedMs);

    window.speechSynthesis.speak(utterance);
  }

  private cleanupActiveAudioElement() {
    this.ttsAnalyser = null;
    if (this.activeAudioElement) {
      try {
        this.activeAudioElement.onended = null;
        this.activeAudioElement.onerror = null;
        this.activeAudioElement.pause();
        this.activeAudioElement.src = '';
      } catch {
        // ignore
      }
      this.activeAudioElement = null;
    }
    if (this.activeAudioUrl) {
      try {
        URL.revokeObjectURL(this.activeAudioUrl);
      } catch {
        // ignore
      }
      this.activeAudioUrl = null;
    }
  }

  private startSpeakingLevelMonitoring() {
    this.stopSpeakingLevelMonitoring();
    let phase = 0;
    const freqData = this.ttsAnalyser ? new Uint8Array(this.ttsAnalyser.frequencyBinCount) : null;

    const tick = () => {
      if (!this.isSpeaking) {
        if (!this.isListening) this.onAudioLevelCallback(0);
        return;
      }

      if (this.ttsAnalyser && this.activeAudioElement && !this.activeAudioElement.paused) {
        const buffer =
          freqData && freqData.length === this.ttsAnalyser.frequencyBinCount
            ? freqData
            : new Uint8Array(this.ttsAnalyser.frequencyBinCount);
        this.ttsAnalyser.getByteFrequencyData(buffer);
        let sum = 0;
        for (let i = 0; i < buffer.length; i++) sum += buffer[i];
        const avg = sum / buffer.length;
        const level = Math.min(1, Math.max(0.06, avg / 75));
        this.onAudioLevelCallback(level);
      } else {
        phase += 0.22;
        this.speechSyllablePulse *= 0.88;
        const baseSpeechWave = 0.28 + 0.22 * Math.sin(phase) + 0.12 * Math.cos(phase * 1.9);
        const level = Math.min(1, Math.max(0.08, baseSpeechWave + this.speechSyllablePulse * 0.45));
        this.onAudioLevelCallback(level);
      }

      this.speakingAnimationFrameId = requestAnimationFrame(tick);
    };
    tick();
  }

  private stopSpeakingLevelMonitoring() {
    if (this.speakingAnimationFrameId) {
      cancelAnimationFrame(this.speakingAnimationFrameId);
      this.speakingAnimationFrameId = null;
    }
    this.speechSyllablePulse = 0;
    if (!this.isListening) {
      this.onAudioLevelCallback(0);
    }
  }

  public stopSpeaking() {
    if (this.ttsWatchdogTimer) {
      clearTimeout(this.ttsWatchdogTimer);
      this.ttsWatchdogTimer = null;
    }
    if (this.ttsAbortController) {
      try {
        this.ttsAbortController.abort();
      } catch {
        // ignore
      }
      this.ttsAbortController = null;
    }
    this.cleanupActiveAudioElement();
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    this.isSpeaking = false;
    this.currentUtterance = null;
    this.stopSpeakingLevelMonitoring();
  }

  public isVoiceSpeaking(): boolean {
    return this.isSpeaking;
  }
}

export const voiceEngine = new VoiceEngine();
