import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.VITE_GEMINI_API_KEY || "dummy-key");

const buildSlidePrompt = (idea, slideNames) => `You are an elite Silicon Valley pitch deck consultant who has helped raise $500M+ in funding.

The user's Startup Idea: "${idea}"

You must intelligently expand on this idea and generate a COMPLETE, investor-ready pitch deck.
Generate content for ALL of the following slides: ${slideNames.join(', ')}.

RULES:
- Generate exactly 4-5 concise, powerful bullet points per slide.
- Each bullet should be 1-2 sentences max — punchy and data-driven.

Return ONLY valid JSON in this exact format:
{
  "${slideNames[0]}": { "title": "${slideNames[0]}", "bullets": ["bullet 1", "bullet 2"] }
}`;

async function test10Slides() {
  const slideNames = [
    "Problem", "Solution", "Unique Value Proposition", "Target Market",
    "Business Model & Revenue", "Go-To-Market Strategy", "Competitive Landscape",
    "Product Roadmap", "Team & Traction", "Financial Projections & Ask"
  ];
  const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: { responseMimeType: "application/json" }
  });
  console.log("Generating 10 slides...");
  try {
      const result = await model.generateContent(buildSlidePrompt("AI Coffee", slideNames));
      console.log("SUCCESS length:", result.response.text().length);
  } catch(e) {
      console.log("ERROR 10 SLIDES:", e.status, e.message);
  }
}

test10Slides();
