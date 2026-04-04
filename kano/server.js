import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';
import PptxGenJS from 'pptxgenjs';
import PDFDocument from 'pdfkit';
import { Resend } from 'resend';

dotenv.config();

// ==========================================
// RESEND EMAIL CLIENT + OTP STORE
// ==========================================
const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

// In-memory OTP store: email -> { otp, expiresAt, attempts }
const otpStore = new Map();

const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

const getOtpEmailHtml = (otp, name = '') => `
<!DOCTYPE html><html><head><meta charset="utf-8"><style>
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;margin:0;padding:0;background:#0f0f1a;}
.wrapper{max-width:520px;margin:40px auto;background:linear-gradient(135deg,#1a1040 0%,#0f0f1a 100%);border-radius:16px;border:1px solid rgba(167,139,250,0.2);overflow:hidden;}
.header{background:linear-gradient(135deg,#7c3aed,#a78bfa);padding:32px 40px;text-align:center;}
.logo{font-size:26px;font-weight:800;color:white;letter-spacing:-0.5px;}
.body{padding:40px;text-align:center;}
.greeting{color:#c4b5fd;font-size:15px;margin-bottom:8px;}
.title{color:#fff;font-size:22px;font-weight:700;margin-bottom:24px;}
.otp-box{display:inline-block;background:linear-gradient(135deg,rgba(124,58,237,0.3),rgba(167,139,250,0.15));border:2px solid rgba(167,139,250,0.5);border-radius:12px;padding:20px 48px;margin:8px 0 24px;}
.otp{font-size:42px;font-weight:800;color:#a78bfa;letter-spacing:10px;}
.note{color:#9ca3af;font-size:13px;line-height:1.6;margin-top:16px;}
.expires{color:#f59e0b;font-weight:600;}
.footer{padding:24px 40px;border-top:1px solid rgba(167,139,250,0.1);text-align:center;color:#6b7280;font-size:12px;}
</style></head>
<body><div class="wrapper">
  <div class="header"><div class="logo">&#x2728; PitchGenie</div></div>
  <div class="body">
    <div class="greeting">Hi ${name || 'there'} &#x1F44B;</div>
    <div class="title">Verify your email address</div>
    <p style="color:#9ca3af;font-size:14px;margin-bottom:24px;">Use the code below to complete your signup. Valid for <span class="expires">10 minutes</span>.</p>
    <div class="otp-box"><div class="otp">${otp}</div></div>
    <p class="note">If you didn't request this, you can safely ignore this email.<br/>Never share this code with anyone.</p>
  </div>
  <div class="footer">&#169; 2025 PitchGenie &middot; AI Startup Pitch Deck Generator</div>
</div></body></html>`;

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3001;

// Global Supabase Admin/Anon Client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.VITE_GEMINI_API_KEY || "dummy-key");
const SLIDES_PER_BATCH = 15;
const MAX_GENERATION_ATTEMPTS = 2;
const MODEL_REQUEST_TIMEOUT_MS = 35000;
const TOTAL_GENERATION_TIMEOUT_MS = 55000;
const MODEL_FALLBACK_CHAIN = [
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
  "gemma-3-4b-it",
];

const chunkArray = (items = [], chunkSize = 3) => {
  const chunks = [];
  for (let i = 0; i < items.length; i += chunkSize) {
    chunks.push(items.slice(i, i + chunkSize));
  }
  return chunks;
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const withTimeout = async (promise, ms, label = "operation") => {
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timeoutId);
  }
};

const clipIdea = (idea = "", maxLength = 120) => {
  const compact = String(idea).replace(/\s+/g, " ").trim();
  if (!compact) return "The startup solves a high-impact market problem.";
  if (compact.length <= maxLength) return compact;
  return `${compact.slice(0, maxLength).trimEnd()}...`;
};

const parseIdeaFields = (idea = "") => {
  const fields = {};
  const text = String(idea);
  const regex = /([A-Za-z][A-Za-z &/_-]{1,40})\s*:\s*([^.\n]+)/g;
  let match = regex.exec(text);
  while (match) {
    const key = normalizeKey(match[1]);
    const value = String(match[2] || "").trim();
    if (key && value) fields[key] = value;
    match = regex.exec(text);
  }
  return fields;
};

const buildDeterministicFallbackBullets = (idea, slideName) => {
  const fields = parseIdeaFields(idea);
  const startup = fields.name || fields.startup || "this startup";
  const problem = fields.problem || "a meaningful customer pain point";
  const solution = fields.solution || "a product-led solution";
  const market = fields.market || "a focused high-intent customer segment";
  const revenue = fields.revenue || "a recurring and scalable monetization model";
  const focus = clipIdea(idea);
  const bySlide = {
    "problem": [
      `${startup} addresses ${problem}, which creates cost, delay, and quality issues for users.`,
      "Current alternatives are fragmented, manual, or expensive, causing repeated churn pain.",
      "The urgency is visible through lost revenue, low productivity, and poor customer outcomes.",
      "This gap is large enough to justify immediate adoption and budget allocation.",
    ],
    "solution": [
      `${startup} delivers ${solution} designed for rapid onboarding and daily usage.`,
      "The product simplifies key workflows with automation, visibility, and measurable outcomes.",
      "Implementation is lightweight, reducing time-to-value for teams and decision makers.",
      "The approach is differentiated by reliability, speed, and user-first experience.",
    ],
    "target market": [
      `Initial ICP is ${market}, where pain intensity and willingness to pay are both high.`,
      "Go-to-market starts with narrow segments to maximize conversion and referenceability.",
      "Expansion follows adjacent customer profiles with similar needs and larger contract values.",
      "Market capture strategy balances fast adoption with sustainable CAC payback.",
    ],
    "business model revenue": [
      `Revenue model: ${revenue}.`,
      "Pricing is structured to align value delivered with customer usage and scale.",
      "Upsell paths include premium automation, advanced analytics, and enterprise controls.",
      "Unit economics target strong gross margins with predictable recurring cash flow.",
    ],
  };

  const normalizedSlide = normalizeKey(slideName);
  const matched = Object.entries(bySlide).find(([k]) => normalizedSlide.includes(k));
  if (matched) return matched[1];

  return [
    `${slideName}: ${startup} focuses on solving ${problem} using ${solution}.`,
    "Execution plan prioritizes MVP delivery, rapid feedback loops, and measurable traction.",
    `Commercial strategy targets ${market} with a repeatable sales and onboarding motion.`,
    `Growth is measured through activation, retention, conversion, and revenue quality. (${focus})`,
  ];
};

const sanitizeAiText = (text = "") =>
  String(text)
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .replace(/\r/g, "")
    .trim();

const extractPlainTextBullets = (text = "") => {
  const lines = sanitizeAiText(text)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const bulletLines = lines
    .filter((line) => /^([-*•]|\d+[.)])\s+/.test(line))
    .map((line) => line.replace(/^([-*•]|\d+[.)])\s+/, "").trim())
    .filter(Boolean);

  if (bulletLines.length) return bulletLines.slice(0, 6);

  const sentenceLines = sanitizeAiText(text)
    .split(/(?<=[.!?])\s+(?=[A-Z0-9])/)
    .map((line) => line.trim())
    .filter((line) => line.length > 10);

  return sentenceLines.slice(0, 6);
};

const isRetriableModelError = (error) => {
  const status = Number(error?.status || 0);
  return status === 429 || status === 503 || status === 500;
};

const generateWithModelFallback = async (prompt) => {
  let lastError = null;

  for (const modelName of MODEL_FALLBACK_CHAIN) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await withTimeout(
        model.generateContent(prompt),
        MODEL_REQUEST_TIMEOUT_MS,
        `Model ${modelName}`
      );
      return result.response?.text?.().trim() || "";
    } catch (error) {
      lastError = error;
      const status = Number(error?.status || 0);
      console.error(`Model ${modelName} failed:`, status, error?.message);
      if (status === 429) {
        console.log(`⚠️ ${modelName} rate-limited, trying next model...`);
      }
      continue;
    }
  }

  throw lastError || new Error("All configured models failed");
};

const normalizeKey = (value = "") =>
  String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const extractJsonObject = (rawText = "") => {
  if (!rawText || typeof rawText !== "string") return null;

  const cleaned = rawText
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) {
      const maybeJson = cleaned.slice(start, end + 1);
      try {
        return JSON.parse(maybeJson);
      } catch {
        return null;
      }
    }
    return null;
  }
};

const textResponseToSlides = (rawText, selectedSlideNames) => {
  const text = sanitizeAiText(rawText);
  if (!text) return {};

  const lines = text.split("\n").map((line) => line.trim()).filter(Boolean);
  const collected = {};
  let currentSlide = null;

  for (const line of lines) {
    const normalizedLine = normalizeKey(line.replace(/^#+\s*/, "").replace(/:$/, ""));
    const matchedSlide = selectedSlideNames.find((slide) => normalizedLine === normalizeKey(slide));
    if (matchedSlide) {
      currentSlide = matchedSlide;
      if (!collected[currentSlide]) collected[currentSlide] = [];
      continue;
    }

    if (!currentSlide) continue;
    if (/^([-*•]|\d+[.)])\s+/.test(line)) {
      const bullet = line.replace(/^([-*•]|\d+[.)])\s+/, "").trim();
      if (bullet) collected[currentSlide].push(bullet);
    }
  }

  const parsed = {};
  const hasSectionedContent = Object.keys(collected).length > 0;
  for (const slide of selectedSlideNames) {
    const fromSection = (collected[slide] || []).slice(0, 6);
    const fromPlain = hasSectionedContent ? [] : extractPlainTextBullets(text).slice(0, 6);
    const bullets = fromSection.length ? fromSection : fromPlain;
    if (bullets.length) {
      parsed[slide] = { title: slide, bullets };
    }
  }

  return parsed;
};

const unwrapGeneratedContentPayload = (parsed, expectedSlideNames = []) => {
  if (!parsed || typeof parsed !== "object") return null;

  const expectedSet = new Set(expectedSlideNames.map((name) => normalizeKey(name)));
  const parsedEntries = Object.entries(parsed);
  const matchedCount = parsedEntries.filter(([key, value]) => {
    if (expectedSet.has(normalizeKey(key))) return true;
    const maybeTitle = value && typeof value === "object" ? value.title : "";
    return expectedSet.has(normalizeKey(maybeTitle || ""));
  }).length;

  if (matchedCount > 0) return parsed;

  const knownContainers = ["slides", "deck", "generated_content", "content", "data"];
  for (const containerKey of knownContainers) {
    const containerValue = parsed[containerKey];
    if (containerValue && typeof containerValue === "object") {
      return containerValue;
    }
  }

  return parsed;
};

const toBulletArray = (value) => {
  if (Array.isArray(value)) return value.map((v) => String(v).trim()).filter(Boolean);
  if (typeof value === "string") {
    return value
      .split(/\r?\n|•|\u2022/)
      .map((line) => line.replace(/^[-*•]\s*/, "").trim())
      .filter(Boolean);
  }
  return [];
};

const buildSlidePrompt = (idea, slideNames) => `You are an elite Silicon Valley pitch deck consultant who has helped raise $500M+ in funding.

The user's Startup Idea: "${idea}"

You must intelligently expand on this idea and generate a COMPLETE, investor-ready pitch deck.
Generate content for ALL of the following slides: ${slideNames.join(', ')}.

RULES:
- Generate exactly 4-5 concise, powerful bullet points per slide.
- Each bullet should be 1-2 sentences max — punchy and data-driven.
- Tailor content to each slide's purpose:
  * "Problem" — pain points with real-world impact
  * "Solution" — how the product uniquely solves these pains  
  * "Unique Value Proposition" — why this is 10x better than alternatives
  * "Target Market" — TAM/SAM/SOM with market sizing
  * "Business Model & Revenue" — pricing, revenue streams, unit economics
  * "Go-To-Market Strategy" — acquisition channels, launch strategy, partnerships
  * "Competitive Landscape" — competitors, differentiators, moats
  * "Product Roadmap" — milestones for next 6-18 months
  * "Team & Traction" — key team members, achievements, metrics
  * "Financial Projections & Ask" — funding needs, projected ARR, use of funds
- Content must feel professional, creative, and specific to this startup idea.
- Do NOT use generic filler. Every bullet must add real value.
- You MUST return content for EVERY requested slide, no omissions.
- Do NOT ask follow-up questions.
- Do NOT ask for more details.
- Do NOT output placeholders like "share details", "provide info", or "let's build".
- If user input is minimal, infer realistic assumptions and still produce complete slide bullets.

- Also generate a highly descriptive (2-3 words) 'imageKeyword' for a background image that visually represents the slide content.

Return ONLY valid JSON in this exact format:
{
  "${slideNames[0]}": { "title": "${slideNames[0]}", "imageKeyword": "abstract futuristic tech", "bullets": ["bullet 1", "bullet 2", "bullet 3", "bullet 4"] },
  "${slideNames[1] || 'Solution'}": { "title": "${slideNames[1] || 'Solution'}", "imageKeyword": "idea brain lightbulb", "bullets": ["bullet 1", "bullet 2"] }
}`;

const normalizeGeneratedContent = (rawContent, selectedSlideNames, idea = "") => {
  const normalized = {};
  const sourceEntries =
    rawContent && typeof rawContent === "object" ? Object.entries(rawContent) : [];

  for (const slide of selectedSlideNames) {
    const normalizedSlide = normalizeKey(slide);
    let matchedValue = null;
    let matchedKey = slide;

    for (const [candidateKey, candidateValue] of sourceEntries) {
      const candidateTitle =
        candidateValue && typeof candidateValue === "object"
          ? candidateValue.title || candidateKey
          : candidateKey;

      if (normalizeKey(candidateKey) === normalizedSlide || normalizeKey(candidateTitle) === normalizedSlide) {
        matchedValue = candidateValue;
        matchedKey = candidateTitle || candidateKey;
        break;
      }
    }

    if (!matchedValue) {
      normalized[slide] = {
        title: slide.toUpperCase(),
        imageKeyword: `${slide} business modern`,
        bullets: buildDeterministicFallbackBullets(idea, slide)
      };
      continue;
    }

    const title =
      matchedValue && typeof matchedValue === "object"
        ? matchedValue.title || matchedKey || slide
        : matchedKey || slide;

    const imageKeyword = matchedValue && typeof matchedValue === "object" && matchedValue.imageKeyword ? matchedValue.imageKeyword : `${title} modern business`;

    const bullets = matchedValue && typeof matchedValue === "object" ? toBulletArray(matchedValue.bullets || matchedValue.content || "") : toBulletArray(matchedValue);

    const fallbackBullets = buildDeterministicFallbackBullets(idea, slide);
    const finalBullets = bullets.length ? bullets.slice(0, 6) : fallbackBullets;

    normalized[slide] = {
      title,
      imageKeyword: typeof imageKeyword !== 'undefined' ? imageKeyword : `${title} default`, 
      bullets: finalBullets
    };
  }

  return normalized;
};

const generateSlidesWithRetries = async (idea, requestedSlides) => {
  const pendingSlides = [...requestedSlides];
  const resolvedContent = {};

  for (let attempt = 1; attempt <= MAX_GENERATION_ATTEMPTS && pendingSlides.length; attempt += 1) {
    const prompt = buildSlidePrompt(idea, pendingSlides);

    try {
      const outputText = await generateWithModelFallback(prompt);
      const parsedContent = extractJsonObject(outputText) || textResponseToSlides(outputText, pendingSlides);
      const unwrappedContent = unwrapGeneratedContentPayload(parsedContent, pendingSlides);

      if (!unwrappedContent || typeof unwrappedContent !== "object") {
        throw new Error("AI returned invalid JSON format");
      }

      const normalizedChunk = normalizeGeneratedContent(unwrappedContent, pendingSlides, idea);
      const stillMissing = [];

      for (const slide of pendingSlides) {
        const slideData = normalizedChunk[slide];
        if (isMissingSlideContent(slideData)) {
          stillMissing.push(slide);
        } else {
          resolvedContent[slide] = slideData;
        }
      }

      pendingSlides.length = 0;
      pendingSlides.push(...stillMissing);
    } catch (error) {
      console.error(`AI generation attempt ${attempt} failed:`, error);
    }

    if (pendingSlides.length && attempt < MAX_GENERATION_ATTEMPTS) {
      await sleep(600);
    }
  }

  if (pendingSlides.length) {
    Object.assign(resolvedContent, normalizeGeneratedContent({}, pendingSlides, idea));
  }

  return resolvedContent;
};

const generateDeckContent = async (idea, selectedSlides) => {
  const batches = chunkArray(selectedSlides, SLIDES_PER_BATCH);
  let combined = {};
  const startedAt = Date.now();

  for (const batch of batches) {
    const elapsed = Date.now() - startedAt;
    if (elapsed > TOTAL_GENERATION_TIMEOUT_MS) {
      Object.assign(combined, normalizeGeneratedContent({}, batch, idea));
      continue;
    }
    const batchContent = await generateSlidesWithRetries(idea, batch);
    combined = { ...combined, ...batchContent };
  }

  return combined;
};

const isMissingSlideContent = (slideValue) => {
  const bullets =
    slideValue && typeof slideValue === "object"
      ? toBulletArray(slideValue.bullets || slideValue.content || "")
      : toBulletArray(slideValue);

  if (!bullets.length) return true;

  const joined = bullets.join(" ").toLowerCase();
  return (
    joined.includes("content pending") ||
    joined.includes("content missing") ||
    joined.includes("content generation incomplete") ||
    joined.includes("no content generated") ||
    joined.includes("deck focus for") ||
    joined.includes("let's build") ||
    joined.includes("initial startup idea details") ||
    joined.includes("provide more details") ||
    joined.includes("share more details")
  );
};

// ==========================================
// 1. AUTHENTICATION (Supabase Auth Wrappers)
// ==========================================

app.post('/api/auth/register', async (req, res) => {
  const { email, password, full_name } = req.body;
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name } }
  });
  if (error) return res.status(error.status || 400).json({ error: error.message });
  res.json({ user: data.user, access_token: data.session?.access_token });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return res.status(error.status || 400).json({ error: error.message });
  res.json({ user: data.user, access_token: data.session?.access_token });
});

// ------------------------------------------
// 🔐 CUSTOM OTP FLOW (RESEND SDK)
// ------------------------------------------
app.post('/api/auth/send-otp', async (req, res) => {
  try {
    const { email, name } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    // Rate limit: 30 seconds
    const existing = otpStore.get(email);
    if (existing && Date.now() < existing.expiresAt - 9.5 * 60 * 1000) {
      return res.status(429).json({ error: 'Please wait 30 seconds.' });
    }

    const otp = generateOtp();
    const expiresAt = Date.now() + 10 * 60 * 1000;
    otpStore.set(email, { otp, expiresAt, attempts: 0 });

    console.log(`Attempting to send OTP to ${email} via Resend...`);

    const { error: emailError } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: 'Your PitchGenie Verification Code',
      html: getOtpEmailHtml(otp, name),
    });

    if (emailError) {
      console.error('RESEND SDK ERROR:', emailError);
      return res.status(500).json({ 
        error: 'Failed to send OTP email', 
        details: emailError.message || 'Check if you are sending to an authorized test email.' 
      });
    }

    console.log(`✅ OTP successfully sent to ${email}`);
    res.json({ success: true, message: 'OTP sent successfully' });
  } catch (err) {
    console.error('SERVER ERROR IN SEND-OTP:', err);
    res.status(500).json({ error: 'Failed to send OTP', details: err.message });
  }
});

app.post('/api/auth/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ error: 'Email and OTP are required' });

    const record = otpStore.get(email);
    if (!record) return res.status(400).json({ error: 'No OTP found for this email. Please request a new one.' });

    if (Date.now() > record.expiresAt) {
      otpStore.delete(email);
      return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
    }

    if (record.attempts >= 5) {
      otpStore.delete(email);
      return res.status(400).json({ error: 'Too many failed attempts. Please request a new OTP.' });
    }

    if (record.otp !== String(otp).trim()) {
      otpStore.set(email, { ...record, attempts: record.attempts + 1 });
      const remaining = 5 - (record.attempts + 1);
      return res.status(400).json({ error: `Invalid OTP. ${remaining} attempt(s) remaining.` });
    }

    otpStore.delete(email);
    console.log(`✅ OTP verified for ${email}`);
    res.json({ success: true, message: 'OTP verified successfully' });
  } catch (err) {
    console.error('SERVER ERROR IN VERIFY-OTP:', err);
    res.status(500).json({ error: 'Failed to verify OTP', details: err.message });
  }
});

// ==========================================
// 2. AUTH MIDDLEWARE & RLS CLIENT SETUP
// ==========================================

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: Missing Token" });
  }

  const token = authHeader.split(" ")[1];
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return res.status(403).json({ error: "Access denied" });
  }

  req.user = user;
  
  // Create an authenticated client scoped to this user's Token (so RLS works perfectly)
  req.supabaseAuth = createClient(supabaseUrl, supabaseKey, {
    global: { headers: { Authorization: `Bearer ${token}` } }
  });

  next();
};

// ==========================================
// 4. PROJECT / HISTORY APIs & AI GENERATION
// ==========================================

// Theme color definitions
const THEME_COLORS = {
  'modern-gradient': { bg: '1a1040', accent: 'a78bfa', title: 'a78bfa', text: 'ffffff', bullet: 'c4b5fd' },
  'clean-minimal':   { bg: 'f5f5f5', accent: '111111', title: '111111', text: '333333', bullet: '555555' },
  'corporate-pro':   { bg: '0a1628', accent: '3b82f6', title: '3b82f6', text: 'ffffff', bullet: '93c5fd' },
  'bold-neon':       { bg: '0a0a0a', accent: 'f43f5e', title: 'f43f5e', text: 'ffffff', bullet: 'fda4af' },
  'elegant-dark':    { bg: '1a1a2e', accent: 'e2b04a', title: 'e2b04a', text: 'ffffff', bullet: 'fcd34d' },
  'startup-fire':    { bg: '1a0a00', accent: 'fb923c', title: 'fb923c', text: 'ffffff', bullet: 'fdba74' },
};

app.post('/api/projects', authMiddleware, async (req, res) => {
  try {
    const { idea, selectedSlides, theme } = req.body;
    if (!idea || !selectedSlides || !Array.isArray(selectedSlides)) {
      return res.status(400).json({ error: "Idea and valid selectedSlides array are required" });
    }

    let generatedContent = await generateDeckContent(idea, selectedSlides);

    // Store theme in generated_content metadata
    if (theme) {
      generatedContent._theme = theme;
    }

    // 4. Create Project with user_id
    const { data: project, error: dbError } = await req.supabaseAuth
      .from('projects')
      .insert({
        user_id: req.user.id,
        idea: idea,
        selected_slides: selectedSlides,
        generated_content: generatedContent
      })
      .select()
      .single();

    if (dbError) throw dbError;

    res.json({ success: true, project });

  } catch (error) {
    console.error("AI Generation / DB Error:", error);
    res.status(500).json({ error: "Failed to generate pitch deck", details: error.message });
  }
});

app.post('/api/projects/:id/regenerate-missing', authMiddleware, async (req, res) => {
  try {
    const { data: project, error } = await req.supabaseAuth
      .from('projects')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (error || !project) return res.status(404).json({ error: "Project not found or access denied" });

    const requestedSlides = Array.isArray(project.selected_slides) ? project.selected_slides : [];
    const existingContent = project.generated_content && typeof project.generated_content === "object"
      ? project.generated_content
      : {};

    const missingSlidesSet = new Set([
      ...requestedSlides.filter((slideName) => isMissingSlideContent(existingContent[slideName])),
      ...Object.keys(existingContent).filter((key) => isMissingSlideContent(existingContent[key]))
    ]);
    const missingSlides = Array.from(missingSlidesSet);

    if (!missingSlides.length) {
      return res.json({ success: true, project, regeneratedSlides: [] });
    }

    const regeneratedContent = await generateDeckContent(project.idea, missingSlides);

    const updatedGeneratedContent = { ...existingContent, ...regeneratedContent };

    const { data: updatedProject, error: updateError } = await req.supabaseAuth
      .from('projects')
      .update({ generated_content: updatedGeneratedContent })
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (updateError) throw updateError;

    return res.json({ success: true, project: updatedProject, regeneratedSlides: missingSlides });
  } catch (err) {
    console.error("Regenerate missing slides error:", err);
    return res.status(500).json({ error: "Failed to regenerate missing slides", details: err.message });
  }
});

app.get('/api/projects', authMiddleware, async (req, res) => {
  // 3. User Data Isolation: RLS automatically handles it, but we also explicitly filter:
  const { data, error } = await req.supabaseAuth
    .from('projects')
    .select('*')
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true, projects: data });
});

app.get('/api/projects/:id', authMiddleware, async (req, res) => {
  const { data, error } = await req.supabaseAuth
    .from('projects')
    .select('*')
    .eq('id', req.params.id)
    .eq('user_id', req.user.id)
    .single();

  if (error || !data) return res.status(404).json({ error: "Project not found or access denied" });
  res.json({ success: true, project: data });
});

app.delete('/api/projects/:id', authMiddleware, async (req, res) => {
  const { error } = await req.supabaseAuth
    .from('projects')
    .delete()
    .eq('id', req.params.id)
    .eq('user_id', req.user.id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true, message: "Project deleted successfully" });
});

app.patch('/api/projects/:id/theme', authMiddleware, async (req, res) => {
  try {
    const { theme } = req.body;
    if (!theme) return res.status(400).json({ error: "Theme is required" });

    // First, fetch the existing project to get the generated_content
    const { data: project, error: fetchError } = await req.supabaseAuth
      .from('projects')
      .select('generated_content')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (fetchError || !project) return res.status(404).json({ error: "Project not found" });

    // Update the _theme property inside generated_content
    const updatedContent = {
      ...(project.generated_content || {}),
      _theme: theme
    };

    // Save it back to the database
    const { data: updatedProject, error: updateError } = await req.supabaseAuth
      .from('projects')
      .update({ generated_content: updatedContent })
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (updateError) throw updateError;

    res.json({ success: true, project: updatedProject });
  } catch (err) {
    console.error("Update theme error:", err);
    res.status(500).json({ error: "Failed to update theme", details: err.message });
  }
});

// ==========================================
// 5. CHATBOT — AI-powered deck editing via chat
// ==========================================

app.post('/api/projects/:id/chat', authMiddleware, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: "A message is required" });
    }

    // 1. Load the project
    const { data: project, error: fetchError } = await req.supabaseAuth
      .from('projects')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (fetchError || !project) {
      return res.status(404).json({ error: "Project not found or access denied" });
    }

    const existingContent = project.generated_content && typeof project.generated_content === 'object'
      ? project.generated_content
      : {};

    const allSlideNames = Object.keys(existingContent).filter(k => !k.startsWith('_'));
    const userMsgLower = normalizeKey(message);
    const msgLower = message.toLowerCase();

    // ============================================
    // 2. DETECT THEME / COLOR CHANGE REQUESTS
    // ============================================
    const themeKeywords = [
      'color', 'colour', 'theme', 'rang', 'design', 'look', 'style',
      'dark', 'light', 'neon', 'minimal', 'fire', 'elegant', 'corporate',
      'background', 'accent', 'gradient'
    ];
    const isThemeRequest = themeKeywords.some(kw => msgLower.includes(kw));

    if (isThemeRequest) {
      // Try to match a specific theme from the message
      const themeAliases = {
        'modern-gradient':  ['modern', 'gradient', 'purple', 'violet'],
        'clean-minimal':    ['clean', 'minimal', 'light', 'white', 'simple', 'safed'],
        'corporate-pro':    ['corporate', 'pro', 'blue', 'professional', 'neela'],
        'bold-neon':        ['bold', 'neon', 'red', 'pink', 'laal', 'gulabi'],
        'elegant-dark':     ['elegant', 'gold', 'golden', 'dark', 'sona', 'luxury'],
        'startup-fire':     ['fire', 'orange', 'startup', 'warm', 'narangi'],
      };

      let matchedTheme = null;
      for (const [themeId, aliases] of Object.entries(themeAliases)) {
        if (aliases.some(alias => msgLower.includes(alias))) {
          matchedTheme = themeId;
          break;
        }
      }

      // If no specific theme matched, pick a different one from current
      if (!matchedTheme) {
        const currentTheme = existingContent._theme || 'corporate-pro';
        const themeIds = Object.keys(THEME_COLORS);
        const otherThemes = themeIds.filter(t => t !== currentTheme);
        matchedTheme = otherThemes[Math.floor(Math.random() * otherThemes.length)] || 'modern-gradient';
      }

      // Apply the theme
      const updatedContent = { ...existingContent, _theme: matchedTheme };

      const { data: updatedProject, error: updateError } = await req.supabaseAuth
        .from('projects')
        .update({ generated_content: updatedContent })
        .eq('id', req.params.id)
        .eq('user_id', req.user.id)
        .select()
        .single();

      if (updateError) throw updateError;

      const themeName = matchedTheme.replace(/-/g, ' ');
      const reply = `🎨 Theme changed to "${themeName}"! Your deck preview has been updated with the new colors.`;

      return res.json({ success: true, project: updatedProject, reply });
    }

    // ============================================
    // 2.5 DETECT FONT SIZE CHANGE REQUESTS
    // ============================================
    const fontSizeKeywords = ['font size', 'text size', 'size change', 'bada ', 'chota ', 'larger', 'smaller', 'increase font', 'decrease font', 'bigger', 'size badha', 'size ghata'];
    const isFontSizeRequest = fontSizeKeywords.some(kw => msgLower.includes(kw)) || (msgLower.includes('font') && (msgLower.includes('size') || msgLower.includes('increase') || msgLower.includes('decrease') || msgLower.includes('bada') || msgLower.includes('chota')));
    
    if (isFontSizeRequest) {
      let currentSize = existingContent._fontSize || 'medium';
      let nextSize = 'medium';
      
      const increaseKeywords = ['increase', 'larger', 'bigger', 'bada'];
      const decreaseKeywords = ['decrease', 'smaller', 'chota', 'ghata'];
      const isIncrease = increaseKeywords.some(kw => msgLower.includes(kw));
      const isDecrease = decreaseKeywords.some(kw => msgLower.includes(kw));

      if (isIncrease) {
         if (currentSize === 'small') nextSize = 'medium';
         else if (currentSize === 'medium') nextSize = 'large';
         else nextSize = 'extra-large';
      } else if (isDecrease) {
         if (currentSize === 'extra-large') nextSize = 'large';
         else if (currentSize === 'large') nextSize = 'medium';
         else nextSize = 'small';
      } else if (msgLower.includes('large') || msgLower.includes('bada')) {
         nextSize = 'large';
      } else if (msgLower.includes('small') || msgLower.includes('chota')) {
         nextSize = 'small';
      } else if (msgLower.includes('extra') || msgLower.includes('huge')) {
         nextSize = 'extra-large';
      } else {
         nextSize = currentSize === 'medium' ? 'large' : 'medium';
      }

      if (nextSize !== currentSize) {
        const updatedContent = { ...existingContent, _fontSize: nextSize };

        const { data: updatedProject, error: updateError } = await req.supabaseAuth
          .from('projects')
          .update({ generated_content: updatedContent })
          .eq('id', req.params.id)
          .eq('user_id', req.user.id)
          .select()
          .single();

        if (updateError) throw updateError;
        return res.json({ success: true, project: updatedProject, reply: `🔠 Font size updated to ${nextSize}!` });
      } else {
        return res.json({ success: true, project, reply: `🔠 Font size is already at ${nextSize} limit.` });
      }
    }

    // ============================================
    // 3. CONTENT CHANGE — Use AI to modify slides
    // ============================================
    let targetSlides = allSlideNames.filter(slide => {
      const normalizedSlide = normalizeKey(slide);
      return userMsgLower.includes(normalizedSlide);
    });

    // If user says "all", or we can't detect a specific slide, modify all
    if (!targetSlides.length || userMsgLower.includes('all slide') || userMsgLower.includes('entire deck') || userMsgLower.includes('whole deck') || userMsgLower.includes('sab slide') || userMsgLower.includes('saare slide') || userMsgLower.includes('pura deck')) {
      targetSlides = allSlideNames;
    }

    // Build context-aware prompt for Gemini
    const currentBulletsContext = targetSlides.map(slide => {
      const slideData = existingContent[slide];
      const bullets = slideData && typeof slideData === 'object'
        ? toBulletArray(slideData.bullets || slideData.content || '')
        : toBulletArray(slideData);
      return `## ${slide}\nCurrent bullets:\n${bullets.map(b => `- ${b}`).join('\n')}`;
    }).join('\n\n');

    const chatPrompt = `You are an elite AI pitch deck editor. The user has a pitch deck for: "${project.idea}"

Here are the slides they want you to modify, along with the current content:

${currentBulletsContext}

The user's instruction: "${message}"

RULES:
- Apply the user's requested changes precisely.
- Keep the same slide structure — return updated bullets for each slide.
- Each slide should have 4-5 powerful, concise bullets (1-2 sentences each).
- Make bullets professional, specific, creative and data-driven where possible.
- If the user asks to "make it more professional/technical/simple/creative", adapt the tone accordingly.
- Do NOT add placeholder text. Every bullet must add real value.
- Do NOT ask follow-up questions.
- The NEW bullets MUST be DIFFERENT from the current ones — do NOT return the same content.
- Also generate a highly descriptive (2-3 words) 'imageKeyword' for a supporting image alongside the bullets.

Return ONLY valid JSON in this exact format (no markdown, no code fences):
{
${targetSlides.map(s => `  "${s}": { "title": "${s}", "imageKeyword": "abstract startup business", "bullets": ["bullet 1", "bullet 2"] }`).join(',\n')}
}`;

    let rawOutput;
    try {
      rawOutput = await generateWithModelFallback(chatPrompt);
    } catch (aiError) {
      console.error("AI generation failed in chat:", aiError);
      return res.json({
        success: false,
        project: project,
        reply: "⚠️ AI is currently busy (rate limited). Please wait 30-60 seconds and try again. Your deck was NOT modified."
      });
    }

    if (!rawOutput || rawOutput.trim().length < 20) {
      return res.json({
        success: false,
        project: project,
        reply: "⚠️ AI returned an empty response. Please try again in a few seconds."
      });
    }

    const parsed = extractJsonObject(rawOutput) || textResponseToSlides(rawOutput, targetSlides);
    const unwrapped = unwrapGeneratedContentPayload(parsed, targetSlides);

    if (!unwrapped || typeof unwrapped !== 'object' || Object.keys(unwrapped).length === 0) {
      return res.json({
        success: false,
        project: project,
        reply: "⚠️ AI returned an invalid format. Please rephrase your request and try again."
      });
    }

    const normalized = normalizeGeneratedContent(unwrapped, targetSlides, project.idea);

    // Check if content actually changed
    let contentChanged = false;
    for (const [slide, newData] of Object.entries(normalized)) {
      const oldData = existingContent[slide];
      const oldBullets = oldData && typeof oldData === 'object' ? (oldData.bullets || []).join('|') : '';
      const newBullets = newData && typeof newData === 'object' ? (newData.bullets || []).join('|') : '';
      if (oldBullets !== newBullets) {
        contentChanged = true;
        break;
      }
    }

    if (!contentChanged) {
      return res.json({
        success: false,
        project: project,
        reply: "⚠️ AI couldn't generate different content this time. Please try rephrasing your request or wait a moment and try again."
      });
    }

    // Merge changes into existing content
    const updatedContent = { ...existingContent };
    for (const [slide, data] of Object.entries(normalized)) {
      updatedContent[slide] = data;
    }

    // Save to database
    const { data: updatedProject, error: updateError } = await req.supabaseAuth
      .from('projects')
      .update({ generated_content: updatedContent })
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (updateError) throw updateError;

    // Build a friendly reply
    const slideList = targetSlides.length <= 3
      ? targetSlides.join(', ')
      : `${targetSlides.length} slides`;
    const reply = `✅ Done! I've updated **${slideList}** based on your instructions. Check the preview — the changes are live!`;

    return res.json({ success: true, project: updatedProject, reply });

  } catch (err) {
    console.error("Chat endpoint error:", err);
    return res.status(500).json({
      error: "Failed to process your request",
      details: err.message
    });
  }
});

// ==========================================
// FAL.AI IMAGE GENERATION PROXY
// ==========================================
app.post('/api/generate-image', async (req, res) => {
  const { prompt, seed } = req.body;
  if (!prompt) return res.status(400).json({ error: "Prompt is required" });

  try {
    const response = await fetch("https://fal.run/fal-ai/fast-sdxl", {
      method: "POST",
      headers: {
        "Authorization": `Key ${process.env.FAL_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        prompt: `professional pitch deck style, photography, high quality, pinterest aesthetic, ${prompt}`,
        seed: seed || Math.floor(Math.random() * 1000000),
        image_size: "landscape_4_3"
      })
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("Fal.ai Error:", err);
      throw new Error("Failed to generate image from Fal.ai");
    }

    const data = await response.json();
    const imageUrl = data.images?.[0]?.url;

    if (!imageUrl) throw new Error("No image URL returned from Fal.ai");

    res.json({ url: imageUrl });
  } catch (error) {
    console.error("Image Generation Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Helper to generate Fal.ai image
const generateFalImage = async (title, imageKeyword, bullets = []) => {
  try {
    const slideBullets = Array.isArray(bullets) ? bullets.slice(0, 2).join(' ') : '';
    const kw = (imageKeyword || title || 'startup').toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean).slice(0, 3).join(' ');
    
    const response = await fetch("https://fal.run/fal-ai/fast-sdxl", {
      method: "POST",
      headers: {
        "Authorization": `Key ${process.env.FAL_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        prompt: `professional pitch deck style, photography, high quality, pinterest aesthetic, ${title}: ${slideBullets}, ${kw}`,
        image_size: "landscape_4_3"
      })
    });

    if (response.ok) {
      const data = await response.json();
      return data.images?.[0]?.url;
    }
  } catch (err) {
    console.error("Fal.ai Generation Error:", err);
  }
  return `https://picsum.photos/seed/${encodeURIComponent(title)}/800/600`;
};

// ==========================================
// 6. EXPORTS (PPTX & PDF)
// ==========================================

app.get('/api/projects/:id/export/pptx', authMiddleware, async (req, res) => {
  const { data, error } = await req.supabaseAuth
    .from('projects')
    .select('*')
    .eq('id', req.params.id)
    .eq('user_id', req.user.id)
    .single();

  if (error || !data) return res.status(404).json({ error: "Project not found" });

  try {
    const themeId = data.generated_content?._theme || 'corporate-pro';
    const theme = THEME_COLORS[themeId] || THEME_COLORS['corporate-pro'];

    const fontSizeSetting = data.generated_content?._fontSize || 'medium';
    let fM = 1;
    if (fontSizeSetting === 'small') fM = 0.85;
    if (fontSizeSetting === 'large') fM = 1.15;
    if (fontSizeSetting === 'extra-large') fM = 1.3;

    let pres = new PptxGenJS();
    pres.layout = 'LAYOUT_16x9';

    // Title slide
    let titleSlide = pres.addSlide();
    titleSlide.background = { color: theme.bg };
    titleSlide.addText("PitchGenie", { x: 0.5, y: 0.5, w: "90%", h: 1, fontSize: 18 * fM, color: theme.bullet });
    titleSlide.addText(data.idea, { x: 0.5, y: 2, w: "90%", h: 2, fontSize: 36 * fM, color: theme.text, bold: true, align: "center", valign: "middle" });
    titleSlide.addText("Generated by AI", { x: 0.5, y: 5.5, w: "90%", h: 1, fontSize: 14 * fM, color: theme.bullet, align: "center" });

    // Content slides
    if (data.generated_content) {
      for (const [key, value] of Object.entries(data.generated_content)) {
        if (key.startsWith('_')) continue;
        let slide = pres.addSlide();
        slide.background = { color: theme.bg };
        
        let slideTitle = key;
        let bullets = [];
        let imageKeyword = '';
        if (typeof value === 'object' && value !== null) {
            slideTitle = value.title || key;
            bullets = value.bullets || [];
            imageKeyword = value.imageKeyword || `${slideTitle} corporate business`;
        } else if (typeof value === 'string') {
            bullets = value.split('\n').filter(b => b.trim().length > 0);
        }

        // Generate Fal.ai Image
        const imgUrl = await generateFalImage(slideTitle, imageKeyword, bullets);

        slide.addText(slideTitle.toUpperCase(), { x: 0.5, y: 0.5, w: "90%", h: 1, fontSize: 28 * fM, color: theme.accent, bold: true });
        
        let bulletOptions = { 
            x: 0.5, y: 1.5, w: "50%", h: 5.5, 
            fontSize: 18 * fM, color: theme.text, 
            bullet: { code: "25CF" }, 
            valign: "top",
            autoFit: true,
            lineSpacing: 22 
        };
        
        let formattedBullets = bullets.map(b => ({ text: b.replace(/^- /, ''), options: { bullet: true } }));
        if (formattedBullets.length > 0) {
          slide.addText(formattedBullets, bulletOptions);
        } else {
          slide.addText([{ text: "No content generated", options: { bullet: false } }], bulletOptions);
        }

        try {
          slide.addImage({ path: imgUrl, x: "55%", y: 1.5, w: "40%", h: 5.0, sizing: { type: "cover", w: "40%", h: 5.0 } });
        } catch(e) { console.error('pptx img err', e); }
      }
    }

    pres.stream().then((dataBuffer) => {
      res.setHeader('Content-disposition', `attachment; filename=PitchDeck-${data.id}.pptx`);
      res.setHeader('Content-type', 'application/vnd.openxmlformats-officedocument.presentationml.presentation');
      res.send(dataBuffer);
    });

  } catch (err) {
    console.error("PPTX generator error:", err);
    if (!res.headersSent) res.status(500).json({ error: "Failed to generate PPTX" });
  }
});

app.get('/api/projects/:id/export/pdf', authMiddleware, async (req, res) => {
  const { data, error } = await req.supabaseAuth
    .from('projects')
    .select('*')
    .eq('id', req.params.id)
    .eq('user_id', req.user.id)
    .single();

  if (error || !data) return res.status(404).json({ error: "Project not found" });

  try {
    const themeId = data.generated_content?._theme || 'corporate-pro';
    const theme = THEME_COLORS[themeId] || THEME_COLORS['corporate-pro'];

    const fontSizeSetting = data.generated_content?._fontSize || 'medium';
    let fM = 1;
    if (fontSizeSetting === 'small') fM = 0.85;
    if (fontSizeSetting === 'large') fM = 1.15;
    if (fontSizeSetting === 'extra-large') fM = 1.3;

    const doc = new PDFDocument({ layout: 'landscape', size: 'A4' });
    
    res.setHeader('Content-disposition', `attachment; filename=PitchDeck-${data.id}.pdf`);
    res.setHeader('Content-type', 'application/pdf');
    doc.pipe(res);

    // Title page
    doc.rect(0, 0, doc.page.width, doc.page.height).fill(`#${theme.bg}`);
    doc.fillColor(`#${theme.bullet}`).fontSize(14 * fM).text('PitchGenie', 50, 50);
    doc.fillColor(`#${theme.text}`).fontSize(28 * fM).text(data.idea, 50, doc.page.height / 2 - 50, { width: doc.page.width - 100, align: 'center' });
    doc.fillColor(`#${theme.bullet}`).fontSize(12 * fM).text('Generated by AI', 50, doc.page.height - 50, { align: 'center' });

    // Content pages
    if (data.generated_content) {
      for (const [key, value] of Object.entries(data.generated_content)) {
        if (key.startsWith('_')) continue;
        doc.addPage();
        doc.rect(0, 0, doc.page.width, doc.page.height).fill(`#${theme.bg}`);
        
        let slideTitle = key;
        let bullets = [];
        let imageKeyword = '';
        if (typeof value === "object" && value !== null) {
            slideTitle = value.title || key;
            bullets = Array.isArray(value.bullets) ? value.bullets : (value.content ? [value.content] : []);
            imageKeyword = value.imageKeyword || `${slideTitle} corporate business`;
        } else if (typeof value === "string") {
            bullets = value.split('\n').filter(b => b.trim().length > 0);
        }

        // Generate Fal.ai Image for PDF
        const imgUrl = await generateFalImage(slideTitle, imageKeyword, bullets);

        doc.fillColor(`#${theme.accent}`).fontSize(30 * fM).text(slideTitle.toUpperCase(), 50, 50);
        
        doc.fillColor(`#${theme.text}`).fontSize(16 * fM);
        let yPos = 120;
        bullets.forEach(b => {
            const text = `${b.replace(/^- /, '')}`;
            doc.circle(60, yPos + 6, 3).fill(`#${theme.bullet}`);
            doc.text(text, 80, yPos, { width: doc.page.width / 2 - 100 });
            yPos = doc.y + 15;
        });

        try {
            const imgRes = await fetch(imgUrl);
            const imgBuf = Buffer.from(await imgRes.arrayBuffer());
            doc.image(imgBuf, doc.page.width / 2 + 20, 120, { width: doc.page.width / 2 - 70, height: 350 });
        } catch (e) { console.error('pdf img err', e); }
      }
    }

    doc.end();
  } catch (err) {
    console.error("PDF generator error:", err);
    if (!res.headersSent) res.status(500).json({ error: "Failed to generate PDF" });
  }
});

app.listen(PORT, () => {
  console.log(`Secure Backend Server running on http://localhost:${PORT}`);
});
