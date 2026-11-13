import express, { Request, Response } from 'express';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envFilePath = path.resolve(__dirname, '.env');
dotenv.config({ path: envFilePath, override: false });
if (fs.existsSync(envFilePath)) {
  try {
    const parsedEnv = dotenv.parse(fs.readFileSync(envFilePath, 'utf8'));
    if (parsedEnv.ELEVENLABS_API_KEY?.trim()) {
      process.env.ELEVENLABS_API_KEY = parsedEnv.ELEVENLABS_API_KEY.trim();
    }
    if (parsedEnv.OLLAMA_API_KEY?.trim()) {
      process.env.OLLAMA_API_KEY = parsedEnv.OLLAMA_API_KEY.trim();
    }
    if (parsedEnv.OLLAMA_MODEL?.trim()) {
      process.env.OLLAMA_MODEL = parsedEnv.OLLAMA_MODEL.trim();
    }
  } catch {
    // ignore .env parse errors
  }
}

const DEFAULT_OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'glm-5.3-flash';
const OLLAMA_BASE_URL = 'https://ollama.com';

async function callOllamaCloudChat(options: {
  message: string;
  history?: Array<{ sender?: string; text?: string }>;
  language?: string;
  model?: string;
}): Promise<{
  ok: boolean;
  reply?: string;
  model: string;
  status?: number;
  error?: string;
}> {
  const apiKey = process.env.OLLAMA_API_KEY?.trim();
  const safeModel =
    typeof options.model === 'string' && /^[a-zA-Z0-9._:-]{2,64}$/.test(options.model.trim())
      ? options.model.trim()
      : DEFAULT_OLLAMA_MODEL;

  if (!apiKey) {
    return { ok: false, model: safeModel, error: 'OLLAMA_API_KEY not configured' };
  }

  const langHint =
    options.language === 'en-IN' || options.language === 'en-US'
      ? 'Reply primarily in natural Indian English.'
      : options.language === 'hi-IN'
      ? 'Reply in friendly Hinglish or clear Hindi.'
      : 'Match the user language (Hindi, Hinglish, or English).';

  const systemPrompt = `You are JARVIS AI, a cute, intelligent, and friendly Indian female personal voice assistant. ${langHint} Keep your response concise (1-3 sentences), natural for text-to-speech playback (no markdown asterisks or heavy formatting), and warm.`;

  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    { role: 'system', content: systemPrompt },
  ];

  if (Array.isArray(options.history)) {
    for (const h of options.history.slice(-6)) {
      if (h && typeof h.text === 'string' && h.text.trim()) {
        messages.push({
          role: h.sender === 'jarvis' ? 'assistant' : 'user',
          content: h.text.trim().slice(0, 600),
        });
      }
    }
  }

  messages.push({ role: 'user', content: options.message.trim() });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 14000);

  try {
    const resp = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: safeModel,
        messages,
        stream: false,
      }),
      signal: controller.signal,
    });

    const data: any = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      const errMsg =
        (typeof data?.error === 'string' ? data.error : data?.error?.message) ||
        `Ollama Cloud HTTP ${resp.status}`;
      return { ok: false, model: safeModel, status: resp.status, error: errMsg };
    }

    const content =
      data?.message?.content?.trim() ||
      data?.choices?.[0]?.message?.content?.trim() ||
      '';

    if (!content) {
      return { ok: false, model: safeModel, status: 502, error: 'Empty response from Ollama Cloud' };
    }

    return { ok: true, reply: content, model: safeModel, status: 200 };
  } catch (err: any) {
    return {
      ok: false,
      model: safeModel,
      status: 504,
      error: err?.name === 'AbortError' ? 'Ollama Cloud timeout' : err?.message || 'Network error',
    };
  } finally {
    clearTimeout(timeout);
  }
}

// Local smart conversational & utility persona engine
function generateSmartPersonaReply(message: string): {
  reply: string;
  intent: string;
  action: any;
  detectedLanguage: string;
} {
  const q = message.toLowerCase().trim();

  // Math & Calculations
  const mathMatch = q.match(
    /(\d+(?:\.\d+)?)\s*([\+\-\*\/xX]|multiply by|plus|minus|divided by|gunna|jodo|ghatao|bhaag)\s*(\d+(?:\.\d+)?)/
  );
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
  if (
    q.includes('who are you') ||
    q.includes('kaun ho') ||
    q.includes('naam kya hai') ||
    q.includes('tumhara naam')
  ) {
    return {
      reply:
        'Main JARVIS hoon — aapki cute, smart aur friendly personal voice assistant! Main aapke phone ke saare apps, settings aur daily kaam direct handle kar sakti hoon.',
      intent: 'ai_chat',
      action: null,
      detectedLanguage: 'hinglish',
    };
  }

  if (
    q.includes('kaisi ho') ||
    q.includes('kaise ho') ||
    q.includes('how are you') ||
    q.includes('kya haal')
  ) {
    return {
      reply:
        'Main bilkul theek aur super active hoon! Aap bataiye, aaj aapka din kaisa chal raha hai? Kya kaam karoon?',
      intent: 'ai_chat',
      action: null,
      detectedLanguage: 'hinglish',
    };
  }

  if (
    q === 'hi' ||
    q === 'hello' ||
    q === 'hey' ||
    q.includes('namaste') ||
    q.includes('hey jarvis') ||
    q.includes('hello jarvis')
  ) {
    return {
      reply: 'Hello! Namaste! Main JARVIS hoon. Aap bataiye, main aaj aapki kya help kar sakti hoon?',
      intent: 'ai_chat',
      action: null,
      detectedLanguage: 'hinglish',
    };
  }

  if (q.includes('good morning') || q.includes('subah')) {
    return {
      reply:
        'Good Morning! Umeed hai aapka aaj ka din bahut shubh aur energetic rahe! Chai ya coffee ho gayi?',
      intent: 'ai_chat',
      action: null,
      detectedLanguage: 'hinglish',
    };
  }

  if (q.includes('good night') || q.includes('shubh ratri')) {
    return {
      reply:
        'Good Night! Sweet dreams! Kal ke liye alarm set karna ho to mujhe zaroor batayiye.',
      intent: 'ai_chat',
      action: null,
      detectedLanguage: 'hinglish',
    };
  }

  if (
    q.includes('thank you') ||
    q.includes('thanks') ||
    q.includes('dhanyawad') ||
    q.includes('shukriya')
  ) {
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
      reply:
        'Weather app kholne ke liye "Open Weather" bolein, ya Home screen par Weather widget check karein!',
      intent: 'productivity',
      action: null,
      detectedLanguage: 'hinglish',
    };
  }

  if (q.includes('joke') || q.includes('chutkula') || q.includes('hanso') || q.includes('funny')) {
    return {
      reply:
        'Ek baar teacher ne pucha: Homework kyun nahi kiya? Student bola: Madam light nahi thi. Teacher: Candle jala lete! Student: Matchbox mandir me rakhi thi aur main nahaaya nahi tha!',
      intent: 'ai_chat',
      action: null,
      detectedLanguage: 'hinglish',
    };
  }

  if (q.includes('quote') || q.includes('shayari') || q.includes('motivation')) {
    return {
      reply:
        'Sitaron ko chhoone ki tamanna rakho, raaste khud-b-khud aasan ho jaayenge! Khud par vishwas rakhiye, aap har kaam kar sakte hain!',
      intent: 'ai_chat',
      action: null,
      detectedLanguage: 'hindi',
    };
  }

  if (
    q.includes('what can you do') ||
    q.includes('features') ||
    q.includes('kya kar sakti ho') ||
    q.includes('help')
  ) {
    return {
      reply:
        'Main YouTube, WhatsApp, Maps, Meet, MovieBox+, MyJio, V-Appstore, vivo Cloud, Snapchat, Telegram, Settings aur phone ke saare apps direct open kar sakti hoon! Flashlight, Data, Wi-Fi, Bluetooth, alarms, notes aur calls bhi direct handle karti hoon.',
      intent: 'ai_chat',
      action: null,
      detectedLanguage: 'hinglish',
    };
  }

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

  return {
    reply: `Ji! Maine aapki baat suni: "${message}". Koi bhi app kholne, call karne, device control ya math calculation ke liye direct command bolein!`,
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

  const DEFAULT_ELEVENLABS_VOICE_ID = 'ihKwLOjVUMG4lgUI6meZ'; // User-requested Voice ID (Leo - Curious Character)
  const FALLBACK_PREMADE_VOICE_ID = 'cgSgspJ2msm6clMCkdW9'; // Jessica - Playful, Bright, Warm (Free-tier compatible HD voice)

  // Health check endpoint
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      assistant: 'JARVIS AI',
      persona: 'Cute Indian Female Voice Assistant',
      timestamp: new Date().toISOString(),
      hasVoiceApi: Boolean(process.env.ELEVENLABS_API_KEY),
      hasAiBrain: Boolean(process.env.OLLAMA_API_KEY),
      aiProvider: process.env.OLLAMA_API_KEY ? 'ollama-cloud' : 'local-smart-brain',
      aiModel: process.env.OLLAMA_MODEL || DEFAULT_OLLAMA_MODEL,
      defaultVoiceId: DEFAULT_ELEVENLABS_VOICE_ID,
    });
  });

  // List available Ollama Cloud AI models (proxied securely)
  app.get('/api/ai/models', async (_req: Request, res: Response) => {
    const apiKey = process.env.OLLAMA_API_KEY?.trim();
    if (!apiKey) {
      res.json({
        configured: false,
        provider: 'ollama-cloud',
        activeModel: DEFAULT_OLLAMA_MODEL,
        models: [],
      });
      return;
    }

    try {
      const resp = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      if (!resp.ok) {
        res.status(resp.status).json({
          configured: true,
          provider: 'ollama-cloud',
          activeModel: DEFAULT_OLLAMA_MODEL,
          models: [],
          error: `Ollama Cloud tags HTTP ${resp.status}`,
        });
        return;
      }
      const data: any = await resp.json().catch(() => ({}));
      const models = Array.isArray(data?.models)
        ? data.models.map((m: any) => ({
            name: m.name || m.model,
            capabilities: Array.isArray(m.capabilities) ? m.capabilities : [],
          }))
        : [];
      res.json({
        configured: true,
        provider: 'ollama-cloud',
        activeModel: process.env.OLLAMA_MODEL || DEFAULT_OLLAMA_MODEL,
        models,
      });
    } catch (err: any) {
      res.status(502).json({
        configured: true,
        provider: 'ollama-cloud',
        activeModel: DEFAULT_OLLAMA_MODEL,
        models: [],
        error: err?.message || 'Failed to reach Ollama Cloud',
      });
    }
  });

  // Neural TTS status endpoint
  app.get('/api/tts/status', (_req: Request, res: Response) => {
    res.json({
      available: Boolean(process.env.ELEVENLABS_API_KEY),
      provider: 'elevenlabs',
      defaultVoiceId: DEFAULT_ELEVENLABS_VOICE_ID,
      fallbackVoiceId: FALLBACK_PREMADE_VOICE_ID,
      model: 'eleven_flash_v2_5',
    });
  });

  // List available neural voices (proxied securely from ElevenLabs)
  app.get('/api/tts/voices', async (_req: Request, res: Response) => {
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
            provider: 'elevenlabs',
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
          provider: 'elevenlabs',
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
      res.setHeader('X-Voice-Provider', 'elevenlabs');
      res.setHeader('X-Active-Voice-Id', usedFallback ? FALLBACK_PREMADE_VOICE_ID : safeVoiceId);
      if (usedFallback) {
        res.setHeader('X-Voice-Fallback', fallbackReason);
      }
      res.send(audioBuffer);
    } catch (err: any) {
      res.status(502).json({ error: err?.message || 'Neural TTS failed' });
    }
  });

  // Smart Conversational Chat endpoint (Ollama Cloud primary + Local Smart fallback)
  app.post('/api/chat', async (req: Request, res: Response) => {
    const { message, history, language, model } = req.body || {};

    if (!message || typeof message !== 'string') {
      res.status(400).json({ error: 'Message is required' });
      return;
    }

    const aiResult = await callOllamaCloudChat({ message, history, language, model });
    if (aiResult.ok && aiResult.reply) {
      res.json({
        reply: aiResult.reply,
        intent: 'ai_chat',
        action: null,
        detectedLanguage: language || 'hinglish',
        provider: 'ollama-cloud',
        model: aiResult.model,
      });
      return;
    }

    const fallback = generateSmartPersonaReply(message);
    res.json({
      ...fallback,
      provider: 'local-fallback',
      upstreamProvider: 'ollama-cloud',
      upstreamModel: aiResult.model,
      upstreamStatus: aiResult.status || 503,
      upstreamNotice: aiResult.error || 'Ollama Cloud unavailable',
    });
  });

  // Streaming endpoint backed by Ollama Cloud with seamless local smart fallback
  app.post('/api/chat/stream', async (req: Request, res: Response) => {
    const { message, history, language, model } = req.body || {};
    if (!message || typeof message !== 'string') {
      res.status(400).json({ error: 'Message is required' });
      return;
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const aiResult = await callOllamaCloudChat({ message, history, language, model });
    const replyText =
      aiResult.ok && aiResult.reply ? aiResult.reply : generateSmartPersonaReply(message).reply;
    res.write(
      `data: ${JSON.stringify({
        text: replyText,
        provider: aiResult.ok ? 'ollama-cloud' : 'local-fallback',
        model: aiResult.model,
      })}\n\n`
    );
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
