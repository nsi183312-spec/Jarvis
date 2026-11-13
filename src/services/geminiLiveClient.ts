export interface GeminiLiveCallbacks {
  onStatusChange: (status: 'disconnected' | 'connecting' | 'live') => void;
  onInputTranscript: (text: string) => void;
  onOutputTranscript: (text: string, isFinal: boolean) => void;
  onAudioLevel: (level: number) => void;
  onError: (message: string, code?: number | string) => void;
}

function float32ToPcm16Base64(float32: Float32Array): string {
  const pcm16 = new Int16Array(float32.length);
  for (let i = 0; i < float32.length; i++) {
    const clamped = Math.max(-1, Math.min(1, float32[i]));
    pcm16[i] = clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff;
  }
  const bytes = new Uint8Array(pcm16.buffer);
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

function base64Pcm16ToFloat32(base64: string): Float32Array {
  const binary = atob(base64);
  const byteLen = binary.length;
  const bytes = new Uint8Array(byteLen);
  for (let i = 0; i < byteLen; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const int16 = new Int16Array(bytes.buffer);
  const float32 = new Float32Array(int16.length);
  for (let i = 0; i < int16.length; i++) {
    float32[i] = int16[i] / 32768;
  }
  return float32;
}

export class GeminiLiveClient {
  private ws: WebSocket | null = null;
  private inputCtx: AudioContext | null = null;
  private outputCtx: AudioContext | null = null;
  private micStream: MediaStream | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private processorNode: ScriptProcessorNode | null = null;
  private scheduledSources: AudioBufferSourceNode[] = [];
  private nextStartTime = 0;
  private isActive = false;
  private currentOutputText = '';
  private currentInputText = '';

  private callbacks: GeminiLiveCallbacks = {
    onStatusChange: () => {},
    onInputTranscript: () => {},
    onOutputTranscript: () => {},
    onAudioLevel: () => {},
    onError: () => {},
  };

  public setCallbacks(callbacks: GeminiLiveCallbacks) {
    this.callbacks = callbacks;
  }

  public isRunning(): boolean {
    return this.isActive;
  }

  public async start(options?: { voiceId?: string; language?: string }) {
    if (this.isActive) return;
    if (typeof window === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      this.callbacks.onError('Microphone access HTTPS browser me hi available hota hai.');
      return;
    }

    this.callbacks.onStatusChange('connecting');
    this.currentOutputText = '';
    this.currentInputText = '';

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
    } catch (err: any) {
      this.callbacks.onStatusChange('disconnected');
      const name = err?.name || '';
      if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
        this.callbacks.onError('Microphone permission allow karein taaki Gemini Live Voice chal sake.');
      } else {
        this.callbacks.onError(err?.message || 'Microphone start nahi ho paya.');
      }
      return;
    }

    this.micStream = stream;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const voiceParam = encodeURIComponent((options?.voiceId || 'Kore').replace(/^gemini:/, ''));
    const langParam = encodeURIComponent(options?.language || 'auto');
    const wsUrl = `${protocol}//${window.location.host}/ws/live?voice=${voiceParam}&lang=${langParam}`;

    const ws = new WebSocket(wsUrl);
    this.ws = ws;
    this.isActive = true;

    ws.onmessage = async (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'ready') {
          await this.startAudioPipelines();
          this.callbacks.onStatusChange('live');
        } else if (msg.type === 'input_transcript' && msg.text) {
          this.currentInputText = `${this.currentInputText} ${msg.text}`.replace(/\s+/g, ' ').trim();
          this.callbacks.onInputTranscript(this.currentInputText);
        } else if (msg.type === 'output_transcript' && msg.text) {
          this.currentOutputText = `${this.currentOutputText}${msg.text}`;
          this.callbacks.onOutputTranscript(this.currentOutputText.trim(), false);
        } else if (msg.type === 'audio' && msg.audio) {
          this.schedulePcm24kChunk(msg.audio);
        } else if (msg.type === 'interrupted') {
          this.clearScheduledAudio();
        } else if (msg.type === 'turn_complete') {
          if (this.currentOutputText.trim()) {
            this.callbacks.onOutputTranscript(this.currentOutputText.trim(), true);
          }
          this.currentOutputText = '';
          this.currentInputText = '';
        } else if (msg.type === 'error') {
          const message = msg.message || 'Gemini Live Voice error.';
          this.callbacks.onError(message, msg.code);
          this.stop();
        }
      } catch {
        // ignore malformed packets
      }
    };

    ws.onerror = () => {
      if (this.isActive) {
        this.callbacks.onError('Gemini Live WebSocket connection failed.');
        this.stop();
      }
    };

    ws.onclose = () => {
      if (this.isActive) {
        this.stop();
      }
    };
  }

  private async startAudioPipelines() {
    if (!this.micStream || !this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) {
      this.callbacks.onError('Web Audio API supported nahi hai.');
      this.stop();
      return;
    }

    // Separate 16kHz input capture & 24kHz output playback contexts per Gemini Live specification
    const inputCtx: AudioContext = new AudioCtx({ sampleRate: 16000 });
    const outputCtx: AudioContext = new AudioCtx({ sampleRate: 24000 });
    if (inputCtx.state === 'suspended') await inputCtx.resume().catch(() => {});
    if (outputCtx.state === 'suspended') await outputCtx.resume().catch(() => {});

    this.inputCtx = inputCtx;
    this.outputCtx = outputCtx;
    this.nextStartTime = outputCtx.currentTime;

    const source = inputCtx.createMediaStreamSource(this.micStream);
    const processor = inputCtx.createScriptProcessor(4096, 1, 1);

    processor.onaudioprocess = (e) => {
      if (!this.isActive || !this.ws || this.ws.readyState !== WebSocket.OPEN) return;
      const samples = e.inputBuffer.getChannelData(0);

      let sumSq = 0;
      for (let i = 0; i < samples.length; i++) {
        sumSq += samples[i] * samples[i];
      }
      const rms = Math.sqrt(sumSq / samples.length);
      this.callbacks.onAudioLevel(Math.min(1, rms * 4.0));

      const base64Audio = float32ToPcm16Base64(samples);
      this.ws.send(JSON.stringify({ audio: base64Audio }));
    };

    source.connect(processor);
    processor.connect(inputCtx.destination);
    this.sourceNode = source;
    this.processorNode = processor;
  }

  private schedulePcm24kChunk(base64: string) {
    if (!this.outputCtx) return;
    if (this.outputCtx.state === 'suspended') {
      this.outputCtx.resume().catch(() => {});
    }

    const float32 = base64Pcm16ToFloat32(base64);
    if (float32.length === 0) return;

    const buffer = this.outputCtx.createBuffer(1, float32.length, 24000);
    buffer.getChannelData(0).set(float32);

    const src = this.outputCtx.createBufferSource();
    src.buffer = buffer;
    src.connect(this.outputCtx.destination);

    const now = this.outputCtx.currentTime;
    const startAt = Math.max(now + 0.02, this.nextStartTime);
    src.start(startAt);
    this.nextStartTime = startAt + buffer.duration;

    this.scheduledSources.push(src);
    src.onended = () => {
      this.scheduledSources = this.scheduledSources.filter((s) => s !== src);
    };

    let peak = 0;
    for (let i = 0; i < float32.length; i += 16) {
      const v = Math.abs(float32[i]);
      if (v > peak) peak = v;
    }
    this.callbacks.onAudioLevel(Math.min(1, peak * 1.6));
  }

  private clearScheduledAudio() {
    for (const src of this.scheduledSources) {
      try {
        src.stop();
      } catch {
        // ignore
      }
    }
    this.scheduledSources = [];
    if (this.outputCtx) {
      this.nextStartTime = this.outputCtx.currentTime;
    }
  }

  public stop() {
    this.isActive = false;
    this.clearScheduledAudio();

    if (this.processorNode) {
      try {
        this.processorNode.disconnect();
        this.processorNode.onaudioprocess = null;
      } catch {
        // ignore
      }
      this.processorNode = null;
    }
    if (this.sourceNode) {
      try {
        this.sourceNode.disconnect();
      } catch {
        // ignore
      }
      this.sourceNode = null;
    }
    if (this.micStream) {
      this.micStream.getTracks().forEach((t) => t.stop());
      this.micStream = null;
    }
    if (this.inputCtx) {
      this.inputCtx.close().catch(() => {});
      this.inputCtx = null;
    }
    if (this.outputCtx) {
      this.outputCtx.close().catch(() => {});
      this.outputCtx = null;
    }
    if (this.ws) {
      try {
        this.ws.close();
      } catch {
        // ignore
      }
      this.ws = null;
    }

    this.callbacks.onAudioLevel(0);
    this.callbacks.onStatusChange('disconnected');
  }
}

export const geminiLiveClient = new GeminiLiveClient();
