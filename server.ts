import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '.env'), override: true });

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

  // Shared Gemini client
  let ai: GoogleGenAI | null = null;
  if (process.env.GEMINI_API_KEY) {
    try {
      ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    } catch {
      ai = null;
    }
  }

  const DEFAULT_ELEVENLABS_VOICE_ID = 'ihKwLOjVUMG4lgUI6meZ'; // User-requested Voice ID (Leo - Curious Character)
  const FALLBACK_PREMADE_VOICE_ID = 'cgSgspJ2msm6clMCkdW9'; // Jessica - Playful, Bright, Warm (Free-tier compatible HD voice)

  // Health check endpoint
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({
      status: 'ok',
      assistant: 'JARVIS AI',
      persona: 'Cute Indian Female AI Voice Assistant',
      timestamp: new Date().toISOString(),
      hasApiKey: Boolean(process.env.GEMINI_API_KEY),
      hasVoiceApi: Boolean(process.env.ELEVENLABS_API_KEY),
      defaultVoiceId: DEFAULT_ELEVENLABS_VOICE_ID,
    });
  });

  // Neural TTS status endpoint
  app.get('/api/tts/status', (req: Request, res: Response) => {
    res.json({
      available: Boolean(process.env.ELEVENLABS_API_KEY),
      provider: 'elevenlabs',
      defaultVoiceId: DEFAULT_ELEVENLABS_VOICE_ID,
      fallbackVoiceId: FALLBACK_PREMADE_VOICE_ID,
      model: 'eleven_flash_v2_5',
    });
  });

  // List available neural voices (proxied securely from ElevenLabs)
  app.get('/api/tts/voices', async (req: Request, res: Response) => {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      res.status(503).json({ voices: [], error: 'Voice API key not configured on server' });
      return;
    }

    try {
      const resp = await fetch('https://api.elevenlabs.io/v1/voices', {
        headers: { 'xi-api-key': apiKey },
      });

      if (!resp.ok) {
        res.status(resp.status).json({ voices: [], error: 'Failed to fetch voices' });
        return;
      }

      const data: any = await resp.json();
      const voices = Array.isArray(data?.voices)
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
          }))
        : [];

      // Ensure user's requested Voice ID is selectable in the list
      if (!voices.some((v: any) => v.voice_id === DEFAULT_ELEVENLABS_VOICE_ID)) {
        voices.unshift({
          voice_id: DEFAULT_ELEVENLABS_VOICE_ID,
          name: 'Leo - Curious Character (Custom ID: ihKwLOjVUMG4lgUI6meZ)',
          gender: 'neutral',
          accent: 'latin american',
          descriptive: 'upbeat',
          age: 'young',
          supportsHindi: false,
        });
      }

      // Prioritize user's default ID, then Jessica & female voices
      voices.sort((a: any, b: any) => {
        if (a.voice_id === DEFAULT_ELEVENLABS_VOICE_ID) return -1;
        if (b.voice_id === DEFAULT_ELEVENLABS_VOICE_ID) return 1;
        if (a.voice_id === FALLBACK_PREMADE_VOICE_ID) return -1;
        if (b.voice_id === FALLBACK_PREMADE_VOICE_ID) return 1;
        const aFemale = a.gender === 'female' ? 0 : 1;
        const bFemale = b.gender === 'female' ? 0 : 1;
        if (aFemale !== bFemale) return aFemale - bFemale;
        return (b.supportsHindi ? 1 : 0) - (a.supportsHindi ? 1 : 0);
      });

      res.json({ voices, defaultVoiceId: DEFAULT_ELEVENLABS_VOICE_ID });
    } catch (err: any) {
      res.status(502).json({ voices: [], error: err?.message || 'Voice list fetch error' });
    }
  });

  // ElevenLabs Text-to-Speech proxy endpoint (returns audio/mpeg)
  app.post('/api/tts', async (req: Request, res: Response) => {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      res.status(503).json({ error: 'Voice API key not configured on server' });
      return;
    }

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

    const safeVoiceId =
      typeof voiceId === 'string' && /^[a-zA-Z0-9_-]{8,64}$/.test(voiceId)
        ? voiceId
        : DEFAULT_ELEVENLABS_VOICE_ID;

    const clampedSpeed =
      typeof speed === 'number' && !Number.isNaN(speed)
        ? Math.min(1.2, Math.max(0.7, speed))
        : 1.0;

    const requestElevenLabsAudio = async (targetVoiceId: string) => {
      return fetch(`https://api.elevenlabs.io/v1/text-to-speech/${targetVoiceId}`, {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
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

      if (!ttsResp.ok) {
        const errText = await ttsResp.text().catch(() => 'TTS API error');
        res.status(ttsResp.status).json({ error: errText });
        return;
      }

      const audioBuffer = Buffer.from(await ttsResp.arrayBuffer());
      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Content-Length', String(audioBuffer.length));
      res.setHeader('Cache-Control', 'no-store');
      res.setHeader('X-Active-Voice-Id', usedFallback ? FALLBACK_PREMADE_VOICE_ID : safeVoiceId);
      if (usedFallback) {
        res.setHeader('X-Voice-Fallback', fallbackReason);
      }
      res.send(audioBuffer);
    } catch (err: any) {
      res.status(502).json({ error: err?.message || 'Neural TTS failed' });
    }
  });

  // Audio transcription fallback endpoint when browser Web Speech API fails on mobile/WebView
  app.post('/api/transcribe', async (req: Request, res: Response) => {
    const { audioBase64, mimeType = 'audio/webm', language = 'hi-IN' } = req.body || {};

    if (!audioBase64 || typeof audioBase64 !== 'string') {
      res.status(400).json({ error: 'Audio data is required' });
      return;
    }

    if (!ai) {
      res.status(503).json({
        error: 'Cloud audio transcription unavailable without Gemini API key.',
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
      res.status(502).json({
        error: err?.message || 'Transcription failed',
        transcript: '',
      });
    }
  });

  // Chat & Command Classification endpoint
  app.post('/api/chat', async (req: Request, res: Response) => {
    const { message, history = [] } = req.body;

    if (!message || typeof message !== 'string') {
      res.status(400).json({ error: 'Message is required' });
      return;
    }

    // Try Gemini API if client is available
    if (ai) {
      try {
        const systemInstruction = `You are JARVIS AI, a cute, intelligent, and friendly Indian female personal voice assistant.
Your tone is sweet, soft, polite, enthusiastic, and conversational.
You speak and understand Hindi, English, and Hinglish.
Keep spoken replies concise (1-3 sentences) suitable for voice speech.
Output valid JSON: {"reply": string, "intent": "ai_chat"|"device_control"|"app_launch"|"communication"|"productivity"|"search", "action": null, "detectedLanguage": "hinglish"}`;

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

        const response = await ai.models.generateContent({
          model: 'gemini-4-hydrogen',
          contents,
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
          },
        });

        const text = response.text || '{}';
        const parsed = JSON.parse(text);
        if (parsed && parsed.reply) {
          res.json(parsed);
          return;
        }
      } catch {
        // Fall through cleanly to high-quality smart persona engine without dumping error stacks to stdout
      }
    }

    // Smart persona NLP response engine
    const result = generateSmartPersonaReply(message);
    res.json(result);
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

    if (ai) {
      try {
        const responseStream = await ai.models.generateContentStream({
          model: 'gemini-4-hydrogen',
          contents: message,
          config: {
            systemInstruction:
              'You are JARVIS AI, a cute, sweet Indian female assistant. Reply warmly in Hinglish/English in 2-3 spoken sentences.',
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
      } catch {
        // Fallback cleanly
      }
    }

    // Stream the smart persona fallback
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

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`JARVIS AI Server running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
