import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';
import PptxGenJS from 'pptxgenjs';
import PDFDocument from 'pdfkit';

dotenv.config();

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

const toBulletArray = (value) => {
  if (Array.isArray(value)) return value.map((v) => String(v).trim()).filter(Boolean);
  if (typeof value === "string") {
    return value
      .split(/\r?\n|•|-/)
      .map((line) => line.trim())
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

Return ONLY valid JSON in this exact format:
{
  "${slideNames[0]}": { "title": "${slideNames[0]}", "bullets": ["bullet 1", "bullet 2", "bullet 3", "bullet 4"] },
  "${slideNames[1] || 'Solution'}": { "title": "${slideNames[1] || 'Solution'}", "bullets": ["bullet 1", "bullet 2"] }
}`;

const normalizeGeneratedContent = (rawContent, selectedSlideNames) => {
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
        bullets: ["Content generation incomplete. Please regenerate this slide."]
      };
      continue;
    }

    const title =
      matchedValue && typeof matchedValue === "object"
        ? matchedValue.title || matchedKey || slide
        : matchedKey || slide;

    const bullets =
      matchedValue && typeof matchedValue === "object"
        ? toBulletArray(matchedValue.bullets || matchedValue.content || "")
        : toBulletArray(matchedValue);

    const fallbackBullets = ["Content generation incomplete. Please regenerate this slide."];
    const finalBullets = bullets.length ? bullets.slice(0, 6) : fallbackBullets;

    normalized[slide] = {
      title,
      bullets: finalBullets
    };
  }

  return normalized;
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
    joined.includes("no content generated")
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

    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: { responseMimeType: "application/json" }
    });
    let generatedContent = {};

    // 6. AI GENERATION (Batch chunking to avoid 429 Rate Limits)
    const prompt = buildSlidePrompt(idea, selectedSlides);
      
    try {
      const result = await model.generateContent(prompt);
      const outputText = result.response.text().trim();
      const parsedContent = extractJsonObject(outputText);
      if (!parsedContent || typeof parsedContent !== "object") {
        throw new Error("AI returned invalid JSON format");
      }
      generatedContent = normalizeGeneratedContent(parsedContent, selectedSlides);
    } catch (e) {
      console.error("Parse or AI error:", e);
      // Fallback
      generatedContent = normalizeGeneratedContent({}, selectedSlides);
    }

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

    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: { responseMimeType: "application/json" }
    });
    const prompt = buildSlidePrompt(project.idea, missingSlides);
    let regeneratedContent = {};

    try {
      const result = await model.generateContent(prompt);
      const outputText = result.response.text().trim();
      const parsedContent = extractJsonObject(outputText);
      if (!parsedContent || typeof parsedContent !== "object") {
        throw new Error("AI returned invalid JSON for regenerate");
      }
      regeneratedContent = normalizeGeneratedContent(parsedContent, missingSlides);
    } catch (genErr) {
      console.error("Regenerate parse or AI error:", genErr);
      regeneratedContent = normalizeGeneratedContent({}, missingSlides);
    }

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
// 5. EXPORTS (PPTX & PDF)
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

    let pres = new PptxGenJS();
    pres.layout = 'LAYOUT_16x9';

    // Title slide
    let titleSlide = pres.addSlide();
    titleSlide.background = { color: theme.bg };
    titleSlide.addText("PitchGenie", { x: 0.5, y: 0.5, w: "90%", h: 1, fontSize: 18, color: theme.bullet });
    titleSlide.addText(data.idea, { x: 0.5, y: 2, w: "90%", h: 2, fontSize: 36, color: theme.text, bold: true, align: "center", valign: "middle" });
    titleSlide.addText("Generated by AI", { x: 0.5, y: 5.5, w: "90%", h: 1, fontSize: 14, color: theme.bullet, align: "center" });

    // Content slides
    if (data.generated_content) {
      for (const [key, value] of Object.entries(data.generated_content)) {
        if (key === '_theme') continue;
        let slide = pres.addSlide();
        slide.background = { color: theme.bg };
        
        let slideTitle = key;
        let bullets = [];
        
        if (typeof value === 'object' && value !== null) {
            slideTitle = value.title || key;
            bullets = value.bullets || [];
        } else if (typeof value === 'string') {
            bullets = value.split('\\n').filter(b => b.trim().length > 0);
        }

        slide.addText(slideTitle.toUpperCase(), { x: 0.5, y: 0.5, w: "90%", h: 1, fontSize: 28, color: theme.accent, bold: true });
        
        let bulletOptions = { 
            x: 0.5, y: 1.5, w: "90%", h: 5.5, 
            fontSize: 18, color: theme.text, 
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

    const doc = new PDFDocument({ layout: 'landscape', size: 'A4' });
    
    res.setHeader('Content-disposition', `attachment; filename=PitchDeck-${data.id}.pdf`);
    res.setHeader('Content-type', 'application/pdf');
    doc.pipe(res);

    // Title page
    doc.rect(0, 0, doc.page.width, doc.page.height).fill(`#${theme.bg}`);
    doc.fillColor(`#${theme.bullet}`).fontSize(14).text('PitchGenie', 50, 50);
    doc.fillColor(`#${theme.text}`).fontSize(28).text(data.idea, 50, doc.page.height / 2 - 50, { width: doc.page.width - 100, align: 'center' });
    doc.fillColor(`#${theme.bullet}`).fontSize(12).text('Generated by AI', 50, doc.page.height - 50, { align: 'center' });

    // Content pages
    if (data.generated_content) {
      for (const [key, value] of Object.entries(data.generated_content)) {
        if (key === '_theme') continue;
        doc.addPage();
        doc.rect(0, 0, doc.page.width, doc.page.height).fill(`#${theme.bg}`);
        
        let slideTitle = key;
        let bullets = [];
        if (typeof value === 'object' && value !== null) {
            slideTitle = value.title || key;
            bullets = value.bullets || [];
        } else if (typeof value === 'string') {
            bullets = value.split('\\n').filter(b => b.trim().length > 0);
        }

        doc.fillColor(`#${theme.accent}`).fontSize(30).text(slideTitle.toUpperCase(), 50, 50);
        
        doc.fillColor(`#${theme.text}`).fontSize(16);
        let yPos = 120;
        bullets.forEach(b => {
            const text = `${b.replace(/^- /, '')}`;
            doc.circle(60, yPos + 6, 3).fill(`#${theme.bullet}`);
            doc.text(text, 80, yPos, { width: doc.page.width - 130 });
            yPos = doc.y + 15;
        });
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
