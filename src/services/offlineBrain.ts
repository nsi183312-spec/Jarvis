export interface OfflineBrainReply {
  reply: string;
  intent: 'ai_chat' | 'device_control' | 'app_launch' | 'communication' | 'productivity' | 'search';
  action: any;
  detectedLanguage: string;
}

const DEVANAGARI_CONSONANTS: Record<string, string> = {
  क: 'k', ख़: 'kh', ख: 'kh', ग: 'g', ग़: 'gh', घ: 'gh', ङ: 'ng',
  च: 'ch', छ: 'chh', ज: 'j', ज़: 'z', झ: 'jh', ञ: 'ny',
  ट: 't', ठ: 'th', ड: 'd', ड़: 'r', ढ: 'dh', ढ़: 'rh', ण: 'n',
  त: 't', थ: 'th', द: 'd', ध: 'dh', न: 'n',
  प: 'p', फ: 'f', फ़: 'f', ब: 'b', भ: 'bh', म: 'm',
  य: 'y', र: 'r', ल: 'l', व: 'v', श: 'sh', ष: 'sh', स: 's', ह: 'h',
  क्ष: 'ksh', त्र: 'tr', ज्ञ: 'gy',
};

const DEVANAGARI_INDEPENDENT_VOWELS: Record<string, string> = {
  अ: 'a', आ: 'a', इ: 'i', ई: 'ee', उ: 'u', ऊ: 'oo', ऋ: 'ri',
  ए: 'e', ऐ: 'ai', ओ: 'o', औ: 'au', ऑ: 'o',
};

const DEVANAGARI_MATRAS: Record<string, string> = {
  'ा': 'a', 'ि': 'i', 'ी': 'ee', 'ु': 'u', 'ू': 'oo', 'ृ': 'ri',
  'े': 'e', 'ै': 'ai', 'ो': 'o', 'ौ': 'au', 'ॉ': 'o',
  'ं': 'n', 'ँ': 'n', 'ः': 'h', '्': '', '़': '',
};

/**
 * Converts arbitrary Devanagari Hindi words (such as any installed third-party app name)
 * into phonetic Latin characters so dynamic app matching works for every app, not just a hardcoded list.
 */
export function transliterateDevanagariToLatin(input: string): string {
  if (!/[\u0900-\u097F]/.test(input)) return input;
  let out = '';
  const chars = Array.from(input);
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    const next = chars[i + 1];
    const pair = next === '़' ? ch + next : '';

    if (pair && DEVANAGARI_CONSONANTS[pair]) {
      i++;
      const after = chars[i + 1];
      out += DEVANAGARI_CONSONANTS[pair];
      if (!after || (!DEVANAGARI_MATRAS[after] && !DEVANAGARI_CONSONANTS[after] && after !== ' ')) {
        // Keep implicit 'a' only inside words unless followed by halant or vowel matra
      } else if (after && DEVANAGARI_CONSONANTS[after]) {
        out += 'a';
      }
      continue;
    }

    if (DEVANAGARI_CONSONANTS[ch]) {
      out += DEVANAGARI_CONSONANTS[ch];
      if (next && DEVANAGARI_CONSONANTS[next]) {
        out += 'a';
      }
      continue;
    }

    if (DEVANAGARI_INDEPENDENT_VOWELS[ch]) {
      out += DEVANAGARI_INDEPENDENT_VOWELS[ch];
      continue;
    }

    if (DEVANAGARI_MATRAS[ch] !== undefined) {
      out += DEVANAGARI_MATRAS[ch];
      continue;
    }

    out += ch;
  }
  return out;
}

/**
 * Normalizes Devanagari Hindi speech transcripts into Hinglish/English equivalents
 * so both local voice commands and dynamic app discovery understand spoken Hindi seamlessly.
 */
export function normalizeHindiToHinglish(input: string): string {
  let s = input.toLowerCase().trim();

  const replacements: Array<[RegExp, string]> = [
    // Device Controls
    [/फ्लैश\s*लाइट|फ्लैशलाइट|टॉर्च|टार्च|फ्लैश/g, 'flashlight'],
    [/मोबाइल\s*डेटा|मोबाइल\s*डाटा|मोबाइल\s*नेट|इंटरनेट|डेटा|डाटा/g, 'mobile data'],
    [/वाई[\s\-]*फाई/g, 'wifi'],
    [/ब्लू\s*टूथ|ब्लूटूथ/g, 'bluetooth'],
    [/हॉट\s*स्पॉट|हॉटस्पॉट/g, 'hotspot'],
    [/बैटरी|बैट्री/g, 'battery'],
    [/वॉल्यूम|आवाज़|आवाज|साउंड/g, 'volume'],
    [/ब्राइटनेस|रोशनी|चमक|स्क्रीन\s*ब्राइटनेस/g, 'brightness'],
    [/ऑन|चालू|जलाओ|जला\s*दो|ऑन\s*करो|ऑन\s*कर\s*दो/g, 'on'],
    [/ऑफ|ऑफ़|बंद|बन्द|बुझाओ|बुझा\s*दो/g, 'off'],
    [/बढ़ाओ|बढाओ|तेज़|तेज|ज़्यादा|ज्यादा|ऊपर/g, 'up'],
    [/कम\s*करो|कम|धीमा|धीमे|घटाओ|नीचे/g, 'down'],
    [/खोलो|खोल\s*दो|खोल|ओपन|लॉन्च|चलाओ/g, 'open'],
    [/कर\s*दो|करो|कीजिए|दीजिए/g, 'karo'],
    [/में|मे|अंदर/g, 'mein'],
    [/पर|पे/g, 'par'],
    [/वेबसाइट|साइट/g, 'website'],
    [/ऐप|एप्प|एप्लिकेशन/g, 'app'],
    // Popular Hindi App Names & System Apps
    [/यूट्यूब|यू\s*ट्यूब/g, 'youtube'],
    [/व्हाट्सएप|व्हाट्सऐप|वॉट्सऐप|वाट्सएप/g, 'whatsapp'],
    [/फेसबुक|फ़ेसबुक|फेस\s*बुक/g, 'facebook'],
    [/इंस्टाग्राम|इंस्टा/g, 'instagram'],
    [/फ्लिपकार्ट|फ्लिप\s*कार्ट/g, 'flipkart'],
    [/अमेज़न|अमेजन|अमाजॉन/g, 'amazon'],
    [/ज़ोमैटो|जोमैटो/g, 'zomato'],
    [/स्विगी/g, 'swiggy'],
    [/पेटीएम|पे\s*टीएम/g, 'paytm'],
    [/फोनपे|फ़ोनपे|फोन\s*पे/g, 'phonepe'],
    [/गूगल\s*पे|जीपे/g, 'google pay'],
    [/हॉटस्टार|डिज़्नी\s*हॉटस्टार/g, 'hotstar'],
    [/नेटफ्लिक्स/g, 'netflix'],
    [/ट्रूकॉलर|ट्रू\s*कॉलर/g, 'truecaller'],
    [/मैप्स|मैप|गूगल\s*मैप/g, 'maps'],
    [/मीट|गूगल\s*मीट/g, 'meet'],
    [/मैसेज|मैसेजेस|संदेश/g, 'messages'],
    [/मूवी\s*बॉक्स|मूवीबॉक्स/g, 'moviebox'],
    [/म्यूजिक|म्यूज़िक|संगीत/g, 'music'],
    [/गाना|गाने/g, 'song'],
    [/माय\s*जियो|माई\s*जियो|जियो/g, 'myjio'],
    [/नोट्स|नोट/g, 'notes'],
    [/फ़ोन|फोन|डायलर/g, 'phone'],
    [/फोटो|फोटोज|गैलरी/g, 'photos'],
    [/पिंटरेस्ट/g, 'pinterest'],
    [/प्ले\s*स्टोर|प्लेस्टोर/g, 'play store'],
    [/रिकॉर्डर/g, 'recorder'],
    [/सेफ्टी/g, 'safety'],
    [/सेटिंग्स|सेटिंग/g, 'settings'],
    [/सिंपल\s*व्यू/g, 'simple view'],
    [/स्नैपचैट|स्नैप\s*चैट/g, 'snapchat'],
    [/टेलीग्राम/g, 'telegram'],
    [/थीम्स|थीम/g, 'themes'],
    [/टिप्स/g, 'tips'],
    [/वी\s*ऐपस्टोर|वी\s*ऐप\s*स्टोर/g, 'v-appstore'],
    [/वीडियो/g, 'video'],
    [/वीवो\s*क्लाउड/g, 'vivo cloud'],
    [/वीवो\s*स्टोर/g, 'vivo store'],
    [/मौसम|वेदर/g, 'weather'],
    [/कैमरा/g, 'camera'],
    [/कैलकुलेटर/g, 'calculator'],
    [/जीमेल|ईमेल/g, 'gmail'],
    [/स्पॉटिफाई/g, 'spotify'],
    [/क्रोम|ब्राउज़र/g, 'chrome'],
    [/हिंदी/g, 'hindi'],
    [/अंग्रेजी|इंग्लिश/g, 'english'],
    // Math & Common intents
    [/जोड़ो|जोड़|प्लस/g, 'plus'],
    [/घटाओ|माइनस/g, 'minus'],
    [/गुणा|गुना|मल्टीप्लाई/g, 'times'],
    [/भाग|डिवाइड/g, 'divided by'],
    [/प्रतिशत|परसेंट/g, 'percent'],
    [/अलार्म/g, 'alarm'],
    [/समय|टाइम|बजे/g, 'time'],
    [/तारीख|डेट|आज\s*क्या\s*दिन/g, 'date'],
    [/स्क्रॉल/g, 'scroll'],
    [/बैक|पीछे/g, 'back'],
    [/होम/g, 'home'],
    [/कॉल|फोन\s*लगाओ/g, 'call'],
    [/सर्च|ढूंढो|खोजो/g, 'search'],
    [/चुटकुला|जोक|हंसाओ/g, 'joke'],
    [/मोटिवेशन|शायरी|कोट्स/g, 'quote'],
    [/नमस्ते|हेलो|हैलो|हाय/g, 'hello'],
    [/कैसी\s*हो|कैसे\s*हो|क्या\s*हाल/g, 'how are you'],
    [/कौन\s*हो|नाम\s*क्या/g, 'who are you'],
    [/धन्यवाद|शुक्रिया|थैंक्यू|थैंक्स/g, 'thank you'],
    [/सुप्रभात|गुड\s*मॉर्निंग/g, 'good morning'],
    [/शुभ\s*रात्रि|गुड\s*नाइट/g, 'good night'],
    [/मदद|हेल्प|क्या\s*कर\s*सकती/g, 'what can you do'],
  ];

  for (const [pattern, replacement] of replacements) {
    s = s.replace(pattern, ` ${replacement} `);
  }

  // Fallback transliteration for any remaining Devanagari words (e.g. arbitrary third-party app names)
  if (/[\u0900-\u097F]/.test(s)) {
    s = transliterateDevanagariToLatin(s);
  }

  return s.replace(/\s+/g, ' ').trim();
}

const NUMBER_WORDS: Record<string, number> = {
  zero: 0,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
  twenty: 20,
  thirty: 30,
  forty: 40,
  fifty: 50,
  sixty: 60,
  seventy: 70,
  eighty: 80,
  ninety: 90,
  hundred: 100,
  ek: 1,
  do: 2,
  teen: 3,
  chaar: 4,
  paanch: 5,
  chhe: 6,
  saat: 7,
  aath: 8,
  nau: 9,
  das: 10,
};

/**
 * Safe recursive-descent arithmetic evaluator (no eval / Function).
 * Supports +, -, *, /, %, ^, and parentheses.
 */
function evaluateSafeArithmeticExpression(expr: string): number | null {
  const tokens = expr.match(/\d+(?:\.\d+)?|[+\-*/%^()]/g);
  if (!tokens || tokens.length === 0) return null;

  let pos = 0;

  const peek = () => tokens[pos];
  const consume = () => tokens[pos++];

  const parseFactor = (): number | null => {
    const tok = peek();
    if (!tok) return null;
    if (tok === '+' || tok === '-') {
      consume();
      const val = parseFactor();
      if (val === null) return null;
      return tok === '-' ? -val : val;
    }
    if (tok === '(') {
      consume();
      const val = parseExpression();
      if (val === null) return null;
      if (peek() === ')') consume();
      return val;
    }
    if (/^\d+(?:\.\d+)?$/.test(tok)) {
      consume();
      return parseFloat(tok);
    }
    return null;
  };

  const parsePower = (): number | null => {
    let left = parseFactor();
    if (left === null) return null;
    while (peek() === '^') {
      consume();
      const right = parseFactor();
      if (right === null) return null;
      left = Math.pow(left, right);
    }
    return left;
  };

  const parseTerm = (): number | null => {
    let left = parsePower();
    if (left === null) return null;
    while (peek() === '*' || peek() === '/' || peek() === '%') {
      const op = consume();
      const right = parsePower();
      if (right === null) return null;
      if (op === '*') left *= right;
      else if (op === '/') {
        if (right === 0) return NaN;
        left /= right;
      } else if (op === '%') {
        if (right === 0) return NaN;
        left %= right;
      }
    }
    return left;
  };

  const parseExpression = (): number | null => {
    let left = parseTerm();
    if (left === null) return null;
    while (peek() === '+' || peek() === '-') {
      const op = consume();
      const right = parseTerm();
      if (right === null) return null;
      left = op === '+' ? left + right : left - right;
    }
    return left;
  };

  const result = parseExpression();
  if (result === null || pos < tokens.length) return null;
  return result;
}

/**
 * Extracts and solves natural-language & symbolic arithmetic queries offline:
 * e.g. "what is 5 plus 10", "subtract 4 from 20", "25% of 200", "square root of 144", "5 + 10 * 2".
 */
export function tryEvaluateOfflineArithmetic(
  input: string
): { expression: string; result: number; formattedReply: string } | null {
  let q = normalizeHindiToHinglish(input).replace(/\?/g, '').trim();

  // Replace standalone number words (e.g. "five plus ten" -> "5 plus 10")
  q = q.replace(/\b([a-z]+)\b/g, (word) => {
    return word in NUMBER_WORDS ? String(NUMBER_WORDS[word]) : word;
  });

  // 1. Square root: "square root of 144" / "sqrt 144"
  const sqrtMatch = q.match(/(?:square root of|sqrt of|sqrt|vargmul)\s+(\d+(?:\.\d+)?)/i);
  if (sqrtMatch) {
    const n = parseFloat(sqrtMatch[1]);
    const res = Number(Math.sqrt(n).toFixed(4));
    return {
      expression: `sqrt(${n})`,
      result: res,
      formattedReply: `${n} ka square root hai ${res}!`,
    };
  }

  // 2. Square: "square of 12"
  const sqMatch = q.match(/square of\s+(\d+(?:\.\d+)?)/i);
  if (sqMatch) {
    const n = parseFloat(sqMatch[1]);
    const res = Number((n * n).toFixed(4));
    return {
      expression: `${n}^2`,
      result: res,
      formattedReply: `${n} ka square hai ${res}!`,
    };
  }

  // 3. Percentage: "25% of 200" or "25 percent of 200" or "200 ka 25 percent"
  const pctOfMatch = q.match(/(\d+(?:\.\d+)?)\s*(?:%|percent)\s+of\s+(\d+(?:\.\d+)?)/i);
  if (pctOfMatch) {
    const pct = parseFloat(pctOfMatch[1]);
    const total = parseFloat(pctOfMatch[2]);
    const res = Number(((pct / 100) * total).toFixed(4));
    return {
      expression: `${pct}% of ${total}`,
      result: res,
      formattedReply: `${total} ka ${pct}% hota hai ${res}!`,
    };
  }
  const pctHindiMatch = q.match(/(\d+(?:\.\d+)?)\s+ka\s+(\d+(?:\.\d+)?)\s*(?:%|percent)/i);
  if (pctHindiMatch) {
    const total = parseFloat(pctHindiMatch[1]);
    const pct = parseFloat(pctHindiMatch[2]);
    const res = Number(((pct / 100) * total).toFixed(4));
    return {
      expression: `${pct}% of ${total}`,
      result: res,
      formattedReply: `${total} ka ${pct}% hota hai ${res}!`,
    };
  }

  // 4. Reverse-order English phrasings: "subtract 4 from 20", "add 5 and 10", "multiply 6 and 7", "divide 45 by 5"
  const subFromMatch = q.match(/subtract\s+(\d+(?:\.\d+)?)\s+from\s+(\d+(?:\.\d+)?)/i);
  if (subFromMatch) {
    const a = parseFloat(subFromMatch[2]);
    const b = parseFloat(subFromMatch[1]);
    const res = Number((a - b).toFixed(4));
    return {
      expression: `${a} - ${b}`,
      result: res,
      formattedReply: `${a} minus ${b} ka answer hai ${res}!`,
    };
  }

  const addAndMatch = q.match(/add\s+(\d+(?:\.\d+)?)\s+(?:and|to|with)\s+(\d+(?:\.\d+)?)/i);
  if (addAndMatch) {
    const a = parseFloat(addAndMatch[1]);
    const b = parseFloat(addAndMatch[2]);
    const res = Number((a + b).toFixed(4));
    return {
      expression: `${a} + ${b}`,
      result: res,
      formattedReply: `${a} plus ${b} ka answer hai ${res}!`,
    };
  }

  const mulAndMatch = q.match(/multiply\s+(\d+(?:\.\d+)?)\s+(?:and|by|with)\s+(\d+(?:\.\d+)?)/i);
  if (mulAndMatch) {
    const a = parseFloat(mulAndMatch[1]);
    const b = parseFloat(mulAndMatch[2]);
    const res = Number((a * b).toFixed(4));
    return {
      expression: `${a} * ${b}`,
      result: res,
      formattedReply: `${a} multiplied by ${b} ka answer hai ${res}!`,
    };
  }

  const divByMatch = q.match(/divide\s+(\d+(?:\.\d+)?)\s+by\s+(\d+(?:\.\d+)?)/i);
  if (divByMatch) {
    const a = parseFloat(divByMatch[1]);
    const b = parseFloat(divByMatch[2]);
    if (b === 0) {
      return {
        expression: `${a} / 0`,
        result: NaN,
        formattedReply: 'Kisi bhi number ko zero se divide nahi kiya ja sakta!',
      };
    }
    const res = Number((a / b).toFixed(4));
    return {
      expression: `${a} / ${b}`,
      result: res,
      formattedReply: `${a} divided by ${b} ka answer hai ${res}!`,
    };
  }

  // 5. General natural-language arithmetic expressions:
  // e.g. "what is 5 plus 10", "calculate 5 + 10 * 2", "12 times 4", "20 minus 5 plus 3"
  const normalizedExpr = q
    .replace(/\b(what is|whats|what's|calculate|compute|solve|tell me|find|answer of|kitna hota hai|kitna hoga|batao|karo)\b/gi, ' ')
    .replace(/\b(plus|added to|jodo|aur)\b/gi, ' + ')
    .replace(/\b(minus|subtracted by|less|ghatao)\b/gi, ' - ')
    .replace(/\b(multiplied by|multiply by|multiply|times|into|gunna|guna)\b/gi, ' * ')
    .replace(/\b(divided by|divide by|divide|over|bhaag)\b/gi, ' / ')
    .replace(/\b(modulo|mod|remainder)\b/gi, ' % ')
    .replace(/\b(to the power of|power)\b/gi, ' ^ ')
    .replace(/(\d)\s*[xX×]\s*(\d)/g, '$1 * $2')
    .replace(/÷/g, '/')
    .replace(/\s+/g, ' ')
    .trim();

  // Extract pure arithmetic substring if it contains at least one operator and digits
  const exprMatch = normalizedExpr.match(/^[+\-*/%^()\d.\s]+$/);
  if (exprMatch && /\d/.test(normalizedExpr) && /[+\-*/%^]/.test(normalizedExpr)) {
    const evaluated = evaluateSafeArithmeticExpression(normalizedExpr);
    if (evaluated !== null) {
      if (Number.isNaN(evaluated) || !Number.isFinite(evaluated)) {
        return {
          expression: normalizedExpr,
          result: NaN,
          formattedReply: 'Zero se divide karna possible nahi hai!',
        };
      }
      const rounded = Number(evaluated.toFixed(4));
      return {
        expression: normalizedExpr,
        result: rounded,
        formattedReply: `${normalizedExpr} ka answer hai ${rounded}!`,
      };
    }
  }

  return null;
}

export function generateOfflineSmartReply(message: string): OfflineBrainReply {
  const raw = message.trim();
  const q = normalizeHindiToHinglish(raw);

  // 1. Arithmetic & Calculations
  const mathSolved = tryEvaluateOfflineArithmetic(raw);
  if (mathSolved) {
    return {
      reply: mathSolved.formattedReply,
      intent: 'productivity',
      action: {
        type: 'calculation',
        expression: mathSolved.expression,
        result: mathSolved.result,
      },
      detectedLanguage: 'hinglish',
    };
  }

  // 2. Greetings & Identity
  if (q.includes('who are you') || q.includes('kaun ho') || q.includes('naam kya') || q.includes('jarvis')) {
    if (q === 'jarvis' || q === 'hey jarvis' || q === 'hello jarvis' || q === 'hi jarvis') {
      return {
        reply: 'Ji boliye! Main JARVIS sun rahi hoon. Batayein kya kaam karna hai?',
        intent: 'ai_chat',
        action: null,
        detectedLanguage: 'hinglish',
      };
    }
    return {
      reply: 'Main JARVIS hoon — aapki personal Indian AI voice assistant! Main online aur offline dono me aapke commands, apps aur device controls handle kar sakti hoon.',
      intent: 'ai_chat',
      action: null,
      detectedLanguage: 'hinglish',
    };
  }

  if (q.includes('how are you') || q.includes('kaisi ho') || q.includes('kaise ho') || q.includes('haal')) {
    return {
      reply: 'Main bilkul mast aur active hoon! Aap bataiye, aaj main aapki kya help karoon?',
      intent: 'ai_chat',
      action: null,
      detectedLanguage: 'hinglish',
    };
  }

  if (q === 'hi' || q === 'hello' || q === 'hey' || q.includes('namaste')) {
    return {
      reply: 'Hello! Namaste! Main JARVIS hoon. Aap mujhe koi bhi command de sakte hain — jaise Flashlight on, Data on, ya YouTube open!',
      intent: 'ai_chat',
      action: null,
      detectedLanguage: 'hinglish',
    };
  }

  if (q.includes('good morning') || q.includes('subah')) {
    return {
      reply: 'Good Morning! Aapka din bahut shubh aur energetic rahe!',
      intent: 'ai_chat',
      action: null,
      detectedLanguage: 'hinglish',
    };
  }

  if (q.includes('good night') || q.includes('shubh ratri')) {
    return {
      reply: 'Good Night! Sweet dreams! Kal ke liye alarm lagana ho to bas bol dein.',
      intent: 'ai_chat',
      action: null,
      detectedLanguage: 'hinglish',
    };
  }

  if (q.includes('thank you') || q.includes('thanks') || q.includes('shukriya') || q.includes('dhanyawad')) {
    return {
      reply: 'You are most welcome! Hamesha aapki seva me ready hoon!',
      intent: 'ai_chat',
      action: null,
      detectedLanguage: 'hinglish',
    };
  }

  if (q.includes('joke') || q.includes('funny') || q.includes('hanso')) {
    return {
      reply: 'Teacher ne pucha: Homework kyun nahi kiya? Student bola: Light nahi thi! Teacher: Candle jala lete! Student: Matchbox mandir me rakhi thi aur main nahaaya nahi tha!',
      intent: 'ai_chat',
      action: null,
      detectedLanguage: 'hinglish',
    };
  }

  if (q.includes('quote') || q.includes('shayari') || q.includes('motivation')) {
    return {
      reply: 'Khud par bharosa rakho, mushkilein kitni bhi badi hon, himmat ke aage chhoti pad jaati hain!',
      intent: 'ai_chat',
      action: null,
      detectedLanguage: 'hindi',
    };
  }

  if (q.includes('what can you do') || q.includes('help') || q.includes('features')) {
    return {
      reply: 'Main Flashlight on/off, Data on/off, Wi-Fi, Bluetooth, Volume, Brightness, Alarms, Notes, Math calculations aur YouTube, WhatsApp, Maps jaise sabhi apps control kar sakti hoon — wo bhi offline mode me bhi!',
      intent: 'ai_chat',
      action: null,
      detectedLanguage: 'hinglish',
    };
  }

  if (q.includes('offline')) {
    return {
      reply: 'Ji haan! Main offline mode me bhi kaam kar rahi hoon — Flashlight, Data/Wi-Fi toggles, Alarms, Notes, Calculations aur offline voice sab chalenge!',
      intent: 'ai_chat',
      action: null,
      detectedLanguage: 'hinglish',
    };
  }

  return {
    reply: `Ji! Maine aapka message "${raw}" note kar liya hai. Offline mode me aap Flashlight on/off, Data on/off, Wi-Fi, Bluetooth, Battery, Time, Notes, Alarms aur math calculations direct bolkar karwa sakte hain!`,
    intent: 'ai_chat',
    action: null,
    detectedLanguage: 'hinglish',
  };
}
