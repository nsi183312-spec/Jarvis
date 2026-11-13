import express, { Request, Response } from 'express';
import http from 'http';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { WebSocketServer, WebSocket } from 'ws';
import { GoogleGenAI, LiveServerMessage, Modality, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '.env'), override: false });

// Helper for offline smart conversational persona logic
function generateSmartPersonaReply(message: string): { reply: string; intent: string; action: any; detectedLanguage: string } {
  const q = message.toLowerCase().trim();

  // Math & Calculations (supports +, -, *, x, /, %, brackets)
  const mathMatch = q.match(/(\d+(?:\.\d+)?)\s*([\+\-\*\/xX]|multiply by|plus|minus|divided by|gunna|jodo|ghatao|bhaag)\s*(\d+(?:\.\d+)?)/);
  if (mathMatch) {
    const num1 = parseFloat(mathMatch[1]);
    const op = mathMatch[2].toLowerCase();
    const num2 = parseFloat(mathMatch[3]);
    let result = 0;
    let opName = 'plus';

    if (op === '+' || op === 'plus' || op === 'jodo') {
      result = num1 + num2;
      opName = 'plus';
    } else if (op === '-' || op === 'minus' || op === 'ghatao') {
      result = num1 - num2;
      opName = 'minus';
    } else if (op === '*' || op === 'x' || op.includes('multiply') || op === 'gunna') {
      result = num1 * num2;
      opName = 'gunna';
    } else if (op === '/' || op.includes('divided') || op === 'bhaag') {
      result = num2 !== 0 ? Number((num1 / num2).toFixed(4)) : 0;
      opName = 'divided by';
    }

    return {
      reply: `${num1} ${opName} ${num2} ka answer hai ${result}! Aur koi calculation karni hai?`,
      intent: 'productivity',
      action: { type: 'calculation', result },
      detectedLanguage: 'hinglish',
    };
  }

  // Greetings & Identity
  if (q.includes('who are you') || q.includes('kaun ho') || q.includes('naam kya hai') || q.includes('tumhara naam')) {
    return {
      reply: 'Main JARVIS hoon — aapki cute, smart aur friendly personal voice assistant! Main aapke phone ke saare apps, settings aur daily kaam handle kar sakti hoon.',
      intent: 'ai_chat',
      action: null,
      detectedLanguage: 'hinglish',
    };
  }

  if (q.includes('kaisi ho') || q.includes('kaise ho') || q.includes('how are you') || q.includes('kya haal')) {
    return {
      reply: 'Main bilkul theek aur super active hoon! Aap bataiye, aaj aapka din kaisa chal raha hai? Kya kaam karoon?',
      intent: 'ai_chat',
      action: null,
      detectedLanguage: 'hinglish',
    };
  }

  if (q === 'hi' || q === 'hello' || q === 'hey' || q.includes('namaste') || q.includes('hey jarvis') || q.includes('hello jarvis')) {
    return {
      reply: 'Hello! Namaste! Main JARVIS hoon. Aap bataiye, main aaj aapki kya help kar sakti hoon?',
      intent: 'ai_chat',
      action: null,
      detectedLanguage: 'hinglish',
    };
  }

  if (q.includes('good morning') || q.includes('subah')) {
    return {
      reply: 'Good Morning! Umeed hai aapka aaj ka din bahut shubh aur energetic rahe! Chai ya coffee ho gayi?',
      intent: 'ai_chat',
      action: null,
      detectedLanguage: 'hinglish',
    };
  }

  if (q.includes('good night') || q.includes('shubh ratri')) {
    return {
      reply: 'Good Night! Sweet dreams! Kal ke liye alarm set karna ho to mujhe zaroor batayiye.',
      intent: 'ai_chat',
      action: null,
      detectedLanguage: 'hinglish',
    };
  }

  if (q.includes('thank you') || q.includes('thanks') || q.includes('dhanyawad') || q.includes('shukriya')) {
    return {
      reply: 'You are most welcome! Aapki madad karke mujhe bahut khushi milti hai!',
      intent: 'ai_chat',
      action: null,
      detectedLanguage: 'hinglish',
    };
  }

  // Study & Knowledge
  if (q.includes('capital of india') || q.includes('bharat ki rajdhani')) {
    return {
      reply: 'Bharat ki rajdhani New Delhi hai!',
      intent: 'ai_chat',
      action: null,
      detectedLanguage: 'hindi',
    };
  }

  if (q.includes('weather') || q.includes('mausam')) {
    return {
      reply: 'Aapke sheher me abhi aasmaan saaf hai aur taapmaan lagbhag 28°C hai, pleasant weather hai! Weather app kholne ke liye "Open Weather" bolein.',
      intent: 'productivity',
      action: null,
      detectedLanguage: 'hinglish',
    };
  }

  if (q.includes('joke') || q.includes('chutkula') || q.includes('hanso') || q.includes('funny')) {
    return {
      reply: 'Ek baar teacher ne pucha: Homework kyun nahi kiya? Student bola: Madam light nahi thi. Teacher: Candle jala lete! Student: Matchbox mandir me rakhi thi aur main nahaaya nahi tha!',
      intent: 'ai_chat',
      action: null,
      detectedLanguage: 'hinglish',
    };
  }

  if (q.includes('quote') || q.includes('shayari') || q.includes('motivation')) {
    return {
      reply: 'Sitaron ko chhoone ki tamanna rakho, raaste khud-b-khud aasan ho jaayenge! Khud par vishwas rakhiye, aap har kaam kar sakte hain!',
      intent: 'ai_chat',
      action: null,
      detectedLanguage: 'hindi',
    };
  }

  if (q.includes('what can you do') || q.includes('features') || q.includes('kya kar sakti ho') || q.includes('help')) {
    return {
      reply: 'Main YouTube, WhatsApp, Maps, Meet, MovieBox+, MyJio, V-Appstore, vivo Cloud, Snapchat, Telegram, Settings aur phone ke saare apps open karke unke andar kaam kar sakti hoon! Flashlight, volume, alarms, notes aur calls bhi handle karti hoon.',
      intent: 'ai_chat',
      action: null,
      detectedLanguage: 'hinglish',
    };
  }

  // Device control intents
  if (q.includes('torch') || q.includes('flashlight')) {
    const isTurnOn = q.includes('on') || q.includes('chalu') || q.includes('jala');
    return {
      reply: isTurnOn ? 'Ji! Flashlight on kar di hai.' : 'Flashlight band kar di gayi hai.',
      intent: 'device_control',
      action: { type: 'torch', value: isTurnOn },
      detectedLanguage: 'hinglish',
    };
  }

  if (q.includes('battery')) {
    return {
      reply: 'Phone ki battery level check kar li hai!',
      intent: 'device_control',
      action: { type: 'get_battery' },
      detectedLanguage: 'hinglish',
    };
  }

  // Default pleasant assistant response
  return {
    reply: `Ji! Maine aapki baat suni: "${message}". Main JARVIS hamesha aapki help ke liye ready hoon! Koi app kholna ho ya kaam karwana ho to bas bolein.`,
    intent: 'ai_chat',
    action: null,
    detectedLanguage: 'hinglish',
  };
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  const isProd = process.env.NODE_ENV === 'production';

  app.use(express.json({ limit: '15mb' }));

  // Shared Gemini client factory (uses server-side process.env.GEMINI_API_KEY from Settings > Secrets)
  const getGeminiClient = (): GoogleGenAI | null => {
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) return null;
    try {
      return new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    } catch {
      return null;
    }
  };

  const DEFAULT_ELEVENLABS_VOICE_ID = 'ihKwLOjVUMG4lgUI6meZ'; // User-requested Voice ID (Leo - Curious Character)
  const FALLBACK_PREMADE_VOICE_ID = 'cgSgspJ2msm6clMCkdW9'; // Jessica - Playful, Bright, Warm (Free-tier compatible HD voice)

  const GEMINI_VOICE_PERSONAS = [
    {
      voice_id: 'gemini:Kore',
      name: 'JARVIS Gemini Voice — Kore (Warm Female)',
      gender: 'female',
      accent: 'multilingual',
      descriptive: 'sweet, clear',
      age: 'young',
      supportsHindi: true,
      provider: 'gemini',
    },
    {
      voice_id: 'gemini:Zephyr',
      name: 'JARVIS Gemini Voice — Zephyr (Bright & Friendly)',
      gender: 'female',
      accent: 'multilingual',
      descriptive: 'bright, energetic',
      age: 'young',
      supportsHindi: true,
      provider: 'gemini',
    },
    {
      voice_id: 'gemini:Puck',
      name: 'Gemini Live Voice — Puck (Upbeat)',
      gender: 'neutral',
      accent: 'multilingual',
      descriptive: 'playful',
      age: 'young',
      supportsHindi: true,
      provider: 'gemini',
    },
    {
      voice_id: 'gemini:Charon',
      name: 'Gemini Voice — Charon (Calm)',
      gender: 'male',
      accent: 'multilingual',
      descriptive: 'calm, clear',
      age: 'adult',
      supportsHindi: true,
      provider: 'gemini',
    },
    {
      voice_id: 'gemini:Fenrir',
      name: 'Gemini Voice — Fenrir (Deep)',
      gender: 'male',
      accent: 'multilingual',
      descriptive: 'deep',
      age: 'adult',
      supportsHindi: true,
      provider: 'gemini',
    },
  ];

  // Health check endpoint
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({
      status: 'ok',
      assistant: 'JARVIS AI',
      persona: 'Cute Indian Female AI Voice Assistant',
      timestamp: new Date().toISOString(),
      hasApiKey: Boolean(process.env.GEMINI_API_KEY),
      hasVoiceApi: Boolean(process.env.ELEVENLABS_API_KEY || process.env.GEMINI_API_KEY),
      geminiLiveReady: Boolean(process.env.GEMINI_API_KEY),
      geminiModel: 'gemini-4-hydrogen',
      geminiLiveModel: 'gemini-3.8-live',
      geminiTtsModel: 'gemini-3.8-flash-lite-tts',
      geminiTranscribeModel: 'gemini-3.5-transcribe',
      defaultVoiceId: DEFAULT_ELEVENLABS_VOICE_ID,
    });
  });

  // Neural TTS status endpoint
  app.get('/api/tts/status', (req: Request, res: Response) => {
    res.json({
      available: Boolean(process.env.ELEVENLABS_API_KEY || process.env.GEMINI_API_KEY),
      provider: process.env.GEMINI_API_KEY ? 'gemini+elevenlabs' : 'elevenlabs',
      defaultVoiceId: DEFAULT_ELEVENLABS_VOICE_ID,
      fallbackVoiceId: FALLBACK_PREMADE_VOICE_ID,
      geminiDefaultVoiceId: 'gemini:Kore',
      model: 'gemini-3.8-flash-lite-tts',
    });
  });

  // List available neural voices (Gemini Voice Assistant voices + ElevenLabs voices if configured)
  app.get('/api/tts/voices', async (req: Request, res: Response) => {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    let elevenLabsVoices: any[] = [];

    if (apiKey) {
      try {
        const resp = await fetch('https://api.elevenlabs.io/v1/voices', {
          headers: { 'xi-api-key': apiKey },
        });

        if (resp.ok) {
          const data: any = await resp.json();
          elevenLabsVoices = Array.isArray(data?.voices)
            ? data.voices.map((v: any) => ({
                voice_id: v.voice_id,
                name: v.name,
                gender: v.labels?.gender || 'unknown',
                accent: v.labels?.accent || '',
                descriptive: v.labels?.descriptive || '',
                age: v.labels?.age || '',
                supportsHindi: Array.isArray(v.verified_languages)
                  ? v.verified_languages.some((l: any) => l.language === 'hi')
                  : false,
                provider: 'elevenlabs',
              }))
            : [];
        }
      } catch {
        // Gracefully ignore ElevenLabs errors and still return Gemini Voice Assistant personas
      }
    }

    const voices = [...GEMINI_VOICE_PERSONAS, ...elevenLabsVoices];

    // Ensure user's requested Voice ID is selectable in the list
    if (!voices.some((v: any) => v.voice_id === DEFAULT_ELEVENLABS_VOICE_ID)) {
      voices.push({
        voice_id: DEFAULT_ELEVENLABS_VOICE_ID,
        name: 'Leo - Curious Character (ElevenLabs ID: ihKwLOjVUMG4lgUI6meZ)',
        gender: 'neutral',
        accent: 'latin american',
        descriptive: 'upbeat',
        age: 'young',
        supportsHindi: false,
        provider: 'elevenlabs',
      });
    }

    res.json({
      voices,
      defaultVoiceId: DEFAULT_ELEVENLABS_VOICE_ID,
      geminiDefaultVoiceId: 'gemini:Kore',
    });
  });

  // Neural Text-to-Speech endpoint (supports Gemini 3.8 Flash Lite TTS + ElevenLabs with automatic Gemini fallback)
  app.post('/api/tts', async (req: Request, res: Response) => {
    const { text, voiceId, speed } = req.body || {};
    if (!text || typeof text !== 'string' || !text.trim()) {
      res.status(400).json({ error: 'Text is required for speech synthesis' });
      return;
    }

    const cleanText = text
      .replace(/[*_#`~]/g, '')
      .replace(/\[.*?\]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 1200);

    if (!cleanText) {
      res.status(400).json({ error: 'Clean text is empty' });
      return;
    }

    const synthesizeWithGeminiTts = async (targetGeminiVoice: string) => {
      const ai = getGeminiClient();
      if (!ai) {
        return { ok: false as const, status: 503, error: 'GEMINI_API_KEY not configured in Settings > Secrets' };
      }

      const validNames = new Set(['Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr']);
      const voiceName = validNames.has(targetGeminiVoice) ? targetGeminiVoice : 'Kore';

      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash-lite-tts',
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: cleanText,
                  speechMetadata: {
                    style: 'Warm, cute, polite Indian female assistant speaking Hindi/Hinglish/English clearly',
                  },
                } as any,
              ],
            },
          ],
          config: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName },
              },
            },
          },
        });

        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!base64Audio) {
          return { ok: false as const, status: 502, error: 'Gemini TTS returned empty audio' };
        }
        return {
          ok: true as const,
          buffer: Buffer.from(base64Audio, 'base64'),
          voiceName,
        };
      } catch (err: any) {
        const status = Number(err?.status) || 502;
        return {
          ok: false as const,
          status,
          error: err?.message || 'Gemini TTS synthesis failed',
        };
      }
    };

    const requestedVoice = typeof voiceId === 'string' ? voiceId.trim() : '';
    const wantsGeminiExplicitly = requestedVoice.startsWith('gemini:');
    const geminiVoiceName = wantsGeminiExplicitly ? requestedVoice.slice('gemini:'.length) : 'Kore';

    // 1. Direct Gemini TTS if selected
    if (wantsGeminiExplicitly) {
      const gRes = await synthesizeWithGeminiTts(geminiVoiceName);
      if (gRes.ok) {
        res.setHeader('Content-Type', 'audio/wav');
        res.setHeader('Content-Length', String(gRes.buffer.length));
        res.setHeader('Cache-Control', 'no-store');
        res.setHeader('X-Voice-Provider', 'gemini');
        res.setHeader('X-Active-Voice-Id', `gemini:${gRes.voiceName}`);
        res.send(gRes.buffer);
        return;
      }
      res.status(gRes.status).json({ error: gRes.error });
      return;
    }

    // 2. Try ElevenLabs if configured, otherwise / on 401/402/error fall back to Gemini TTS
    const elevenApiKey = process.env.ELEVENLABS_API_KEY;
    if (elevenApiKey) {
      const safeVoiceId =
        /^[a-zA-Z0-9_-]{8,64}$/.test(requestedVoice) ? requestedVoice : DEFAULT_ELEVENLABS_VOICE_ID;
      const clampedSpeed =
        typeof speed === 'number' && !Number.isNaN(speed)
          ? Math.min(1.2, Math.max(0.7, speed))
          : 1.0;

      const requestElevenLabsAudio = async (targetVoiceId: string) => {
        return fetch(`https://api.elevenlabs.io/v1/text-to-speech/${targetVoiceId}`, {
          method: 'POST',
          headers: {
            'xi-api-key': elevenApiKey,
            'Content-Type': 'application/json',
            Accept: 'audio/mpeg',
          },
          body: JSON.stringify({
            text: cleanText,
            model_id: 'eleven_flash_v2_5',
            voice_settings: {
              stability: 0.45,
              similarity_boost: 0.78,
              style: 0.35,
              use_speaker_boost: true,
              speed: clampedSpeed,
            },
          }),
        });
      };

      try {
        let ttsResp = await requestElevenLabsAudio(safeVoiceId);
        let usedFallback = false;
        let fallbackReason = '';

        if (
          !ttsResp.ok &&
          (ttsResp.status === 402 || ttsResp.status === 400 || ttsResp.status === 404) &&
          safeVoiceId !== FALLBACK_PREMADE_VOICE_ID
        ) {
          fallbackReason = ttsResp.status === 402 ? 'paid_plan_required' : `http_${ttsResp.status}`;
          ttsResp = await requestElevenLabsAudio(FALLBACK_PREMADE_VOICE_ID);
          usedFallback = true;
        }

        if (ttsResp.ok) {
          const audioBuffer = Buffer.from(await ttsResp.arrayBuffer());
          res.setHeader('Content-Type', 'audio/mpeg');
          res.setHeader('Content-Length', String(audioBuffer.length));
          res.setHeader('Cache-Control', 'no-store');
          res.setHeader('X-Voice-Provider', 'elevenlabs');
          res.setHeader('X-Active-Voice-Id', usedFallback ? FALLBACK_PREMADE_VOICE_ID : safeVoiceId);
          if (usedFallback) {
            res.setHeader('X-Voice-Fallback', fallbackReason);
          }
          res.send(audioBuffer);
          return;
        }
      } catch {
        // Fall through to Gemini TTS
      }
    }

    // 3. Automatic Gemini TTS fallback when ElevenLabs is missing or returns 401/error
    const geminiFallback = await synthesizeWithGeminiTts('Kore');
    if (geminiFallback.ok) {
      res.setHeader('Content-Type', 'audio/wav');
      res.setHeader('Content-Length', String(geminiFallback.buffer.length));
      res.setHeader('Cache-Control', 'no-store');
      res.setHeader('X-Voice-Provider', 'gemini');
      res.setHeader('X-Active-Voice-Id', `gemini:${geminiFallback.voiceName}`);
      res.setHeader('X-Voice-Fallback', 'elevenlabs_unavailable_used_gemini');
      res.send(geminiFallback.buffer);
      return;
    }

    res.status(geminiFallback.status).json({ error: geminiFallback.error });
  });

  // Audio transcription fallback endpoint when browser Web Speech API fails on mobile/WebView
  app.post('/api/transcribe', async (req: Request, res: Response) => {
    const { audioBase64, mimeType = 'audio/webm', language = 'hi-IN' } = req.body || {};

    if (!audioBase64 || typeof audioBase64 !== 'string') {
      res.status(400).json({ error: 'Audio data is required' });
      return;
    }

    const ai = getGeminiClient();
    if (!ai) {
      res.status(503).json({
        error: 'Cloud audio transcription requires GEMINI_API_KEY in Settings > Secrets.',
        transcript: '',
      });
      return;
    }

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-transcribe',
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  mimeType: mimeType.split(';')[0] || 'audio/webm',
                  data: audioBase64,
                },
              },
              {
                text: `Transcribe the spoken voice accurately in its natural language (${language}, Hindi, English, or Hinglish using Roman/Devanagari as spoken). Return ONLY the transcribed words with no extra explanation. If silent or unclear, return empty string.`,
              },
            ],
          },
        ],
      });

      const transcript = (response.text || '').trim();
      res.json({ transcript });
    } catch (err: any) {
      const statusCode = Number(err?.status) || 502;
      const rawMsg = String(err?.message || 'Transcription failed');
      let friendly = 'Voice transcription failed. Kripya type karke command dein ya mic settings check karein.';
      if (statusCode === 403 || rawMsg.includes('PERMISSION_DENIED') || rawMsg.includes('free tier')) {
        friendly =
          'Gemini Voice Transcription par 403 PERMISSION_DENIED aaya hai (billing-enabled key required). AI Studio ke Settings > Secrets me active GEMINI_API_KEY check karein.';
      } else if (statusCode === 400 || rawMsg.includes('API_KEY_INVALID')) {
        friendly = 'GEMINI_API_KEY invalid hai. Settings > Secrets me sahi key check karein.';
      } else if (statusCode === 429 || rawMsg.includes('RESOURCE_EXHAUSTED')) {
        friendly = 'Gemini quota limit poori ho gayi (429). Thodi der baad try karein.';
      }
      res.status(statusCode).json({
        error: friendly,
        transcript: '',
      });
    }
  });

  // Chat & Command Classification endpoint (powered by server-side @google/genai)
  app.post('/api/chat', async (req: Request, res: Response) => {
    const { message, history = [], language = 'auto' } = req.body || {};

    if (!message || typeof message !== 'string') {
      res.status(400).json({ error: 'Message is required' });
      return;
    }

    const ai = getGeminiClient();
    if (!ai) {
      res.status(503).json({
        error: 'GEMINI_API_KEY is not configured in Settings > Secrets.',
        code: 'API_KEY_MISSING',
        reply: 'Gemini API key abhi set nahi hai. Kripya AI Studio ke Settings > Secrets panel me GEMINI_API_KEY add karein.',
      });
      return;
    }

    const systemInstruction = `You are JARVIS AI, a cute, intelligent, and friendly Indian female personal voice assistant.
Your tone is sweet, soft, polite, helpful, and conversational.
You understand and answer general knowledge, coding, science, daily life, and study questions accurately in Hindi, English, or Hinglish (preferred language setting: ${language}).
Keep spoken replies clear and concise (1-4 sentences) suitable for voice speech unless the user asks for details.`;

    const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];
    if (Array.isArray(history)) {
      for (const item of history.slice(-6)) {
        if (item && item.text) {
          const role =
            item.role === 'assistant' || item.role === 'model' || item.sender === 'jarvis'
              ? 'model'
              : 'user';
          contents.push({
            role,
            parts: [{ text: item.text }],
          });
        }
      }
    }
    contents.push({ role: 'user', parts: [{ text: message }] });

    let lastErr: any = null;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-4-hydrogen',
          contents,
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                reply: {
                  type: Type.STRING,
                  description: 'Natural, accurate spoken response to the user query.',
                },
                intent: {
                  type: Type.STRING,
                  description: 'One of ai_chat, device_control, app_launch, communication, productivity, search.',
                },
                detectedLanguage: {
                  type: Type.STRING,
                  description: 'hinglish, hindi, or english.',
                },
              },
              required: ['reply', 'intent', 'detectedLanguage'],
            },
          },
        });

        const rawText = (response.text || '').trim();
        const cleanedJson = rawText.replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
        const parsed = JSON.parse(cleanedJson || '{}');
        if (parsed && parsed.reply) {
          res.json({
            reply: parsed.reply,
            intent: parsed.intent || 'ai_chat',
            action: null,
            detectedLanguage: parsed.detectedLanguage || 'hinglish',
          });
          return;
        }
        if (rawText) {
          res.json({
            reply: rawText,
            intent: 'ai_chat',
            action: null,
            detectedLanguage: 'hinglish',
          });
          return;
        }
      } catch (err: any) {
        lastErr = err;
        const status = Number(err?.status) || 500;
        // Retry only on transient 5xx/network errors
        if (status >= 500 && attempt === 0) {
          await new Promise((r) => setTimeout(r, 400));
          continue;
        }
        break;
      }
    }

    const statusCode = Number(lastErr?.status) || 502;
    const rawMsg = String(lastErr?.message || 'Gemini API request failed');
    let friendlyReply =
      'Gemini AI se jawab laane me dikkat aayi. Kripya AI Studio ke Settings > Secrets me apni GEMINI_API_KEY check karein.';

    if (statusCode === 403 || rawMsg.includes('PERMISSION_DENIED') || rawMsg.includes('free tier')) {
      friendlyReply =
        'Gemini API ne is key par 403 PERMISSION_DENIED diya hai (project me billing/paid tier required hai ya key disabled hai). Kripya AI Studio ke Settings > Secrets me active billing-enabled GEMINI_API_KEY select karein.';
    } else if (statusCode === 400 || rawMsg.includes('API_KEY_INVALID')) {
      friendlyReply =
        'Gemini API key invalid hai. Kripya Settings > Secrets panel me sahi GEMINI_API_KEY check karein.';
    } else if (statusCode === 429 || rawMsg.includes('RESOURCE_EXHAUSTED')) {
      friendlyReply =
        'Gemini API quota limit poori ho gayi hai (429). Kripya thodi der baad try karein ya Settings > Secrets me billing-enabled key use karein.';
    }

    res.status(statusCode).json({
      error: rawMsg,
      code: statusCode,
      reply: friendlyReply,
    });
  });

  // Streaming endpoint for extended conversational queries
  app.post('/api/chat/stream', async (req: Request, res: Response) => {
    const { message } = req.body;
    if (!message) {
      res.status(400).json({ error: 'Message is required' });
      return;
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const ai = getGeminiClient();
    if (ai) {
      try {
        const responseStream = await ai.models.generateContentStream({
          model: 'gemini-4-hydrogen',
          contents: message,
          config: {
            systemInstruction:
              'You are JARVIS AI, a cute, sweet Indian female assistant. Reply warmly and accurately in Hinglish/English in 2-3 spoken sentences.',
          },
        });

        for await (const chunk of responseStream) {
          const textChunk = chunk.text;
          if (textChunk) {
            res.write(`data: ${JSON.stringify({ text: textChunk })}\n\n`);
          }
        }
        res.write('data: [DONE]\n\n');
        res.end();
        return;
      } catch (err: any) {
        res.write(`data: ${JSON.stringify({ error: err?.message || 'Gemini stream failed' })}\n\n`);
        res.write('data: [DONE]\n\n');
        res.end();
        return;
      }
    }

    const fallback = generateSmartPersonaReply(message).reply;
    res.write(`data: ${JSON.stringify({ text: fallback })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
  });

  // Return JSON 404 for unknown API routes instead of HTML fallback
  app.all('/api/*', (req: Request, res: Response) => {
    res.status(404).json({ error: `API route not found: ${req.path}` });
  });

  // Mount Vite or static server
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.get('/manifest.json', (_req: Request, res: Response) => {
      res.type('application/manifest+json');
      res.sendFile(path.join(distDir, 'manifest.json'));
    });
    app.get('/service-worker.js', (_req: Request, res: Response) => {
      res.type('application/javascript');
      res.setHeader('Service-Worker-Allowed', '/');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.sendFile(path.join(distDir, 'service-worker.js'));
    });
    app.use(express.static(distDir));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  const httpServer = http.createServer(app);

  // Real-time Gemini Live Voice Assistant WebSocket bridge (/ws/live)
  const wss = new WebSocketServer({ server: httpServer, path: '/ws/live' });
  wss.on('connection', async (clientWs: WebSocket, req) => {
    const ai = getGeminiClient();
    if (!ai) {
      clientWs.send(
        JSON.stringify({
          type: 'error',
          code: 'API_KEY_MISSING',
          message:
            'GEMINI_API_KEY set nahi hai. Kripya AI Studio ke Settings > Secrets me active GEMINI_API_KEY add karein.',
        })
      );
      clientWs.close();
      return;
    }

    let urlObj: URL | null = null;
    try {
      urlObj = new URL(req.url || '/ws/live', 'http://localhost');
    } catch {
      urlObj = null;
    }
    const requestedVoice = (urlObj?.searchParams.get('voice') || 'Kore').replace(/^gemini:/, '');
    const validLiveVoices = new Set(['Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr']);
    const voiceName = validLiveVoices.has(requestedVoice) ? requestedVoice : 'Kore';
    const langPref = urlObj?.searchParams.get('lang') || 'auto';

    let session: any = null;
    let closedByClient = false;

    try {
      session = await ai.live.connect({
        model: 'gemini-3.8-live',
        config: {
          responseModalities: [Modality.AUDIO],
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName },
            },
          },
          systemInstruction: `You are JARVIS AI, a cute, intelligent, friendly Indian female personal voice assistant.
Speak warmly and concisely (1-3 sentences) in Hindi, Hinglish, or English (preferred language: ${langPref}).
Help the user with any general knowledge, science, study, coding, or daily conversation questions accurately.`,
        },
        callbacks: {
          onopen: () => {
            if (clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({ type: 'ready', voiceName, model: 'gemini-3.8-live' }));
            }
          },
          onmessage: (message: LiveServerMessage) => {
            if (clientWs.readyState !== WebSocket.OPEN) return;
            const content = message.serverContent;

            if (content?.inputTranscription?.text) {
              clientWs.send(
                JSON.stringify({
                  type: 'input_transcript',
                  text: content.inputTranscription.text,
                })
              );
            }
            if (content?.outputTranscription?.text) {
              clientWs.send(
                JSON.stringify({
                  type: 'output_transcript',
                  text: content.outputTranscription.text,
                })
              );
            }
            for (const part of content?.modelTurn?.parts ?? []) {
              if (part.inlineData?.data) {
                clientWs.send(
                  JSON.stringify({
                    type: 'audio',
                    audio: part.inlineData.data,
                  })
                );
              }
            }
            if (content?.interrupted) {
              clientWs.send(JSON.stringify({ type: 'interrupted' }));
            }
            if (content?.turnComplete) {
              clientWs.send(JSON.stringify({ type: 'turn_complete' }));
            }
          },
          onerror: (err: any) => {
            if (clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(
                JSON.stringify({
                  type: 'error',
                  code: 502,
                  message: err?.message || 'Gemini Live session error occurred.',
                })
              );
            }
          },
          onclose: (event: any) => {
            if (closedByClient) return;
            const reason = String(event?.reason || '');
            const code = event?.code || 1000;
            if (clientWs.readyState === WebSocket.OPEN) {
              if (code === 1008 || reason.includes('free tier') || reason.includes('PERMISSION_DENIED')) {
                clientWs.send(
                  JSON.stringify({
                    type: 'error',
                    code: 403,
                    message:
                      'Gemini Live Voice par 403 / billing required aaya hai: is project me Gemini API free tier available nahi hai. Kripya AI Studio ke Settings > Secrets me billing-enabled GEMINI_API_KEY select karein.',
                  })
                );
              } else if (code !== 1000 && reason) {
                clientWs.send(
                  JSON.stringify({
                    type: 'error',
                    code,
                    message: `Gemini Live session band hua (${code}): ${reason}`,
                  })
                );
              }
              clientWs.close();
            }
          },
        },
      });
    } catch (err: any) {
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(
          JSON.stringify({
            type: 'error',
            code: Number(err?.status) || 502,
            message:
              err?.message ||
              'Gemini Live Voice connect nahi ho paya. Kripya Settings > Secrets me GEMINI_API_KEY check karein.',
          })
        );
        clientWs.close();
      }
      return;
    }

    clientWs.on('message', (raw) => {
      if (!session) return;
      try {
        const payload = JSON.parse(raw.toString());
        if (payload?.audio) {
          session.sendRealtimeInput({
            audio: {
              data: payload.audio,
              mimeType: 'audio/pcm;rate=16000',
            },
          });
        } else if (payload?.text && typeof payload.text === 'string') {
          session.sendClientContent({
            turns: [{ role: 'user', parts: [{ text: payload.text }] }],
            turnComplete: true,
          });
        }
      } catch {
        // ignore malformed frames
      }
    });

    clientWs.on('close', () => {
      closedByClient = true;
      try {
        session?.close();
      } catch {
        // ignore
      }
    });
  });

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`JARVIS AI Server running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
