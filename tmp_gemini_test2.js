import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.VITE_GEMINI_API_KEY || "dummy-key");

async function run() {
  try {
    // There is supposed to be genAI.getGenerativeModel
    // We can also try gemini-1.5-pro
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent("hello");
    console.log("gemini-pro success length:", result.response.text().length);
  } catch(e) {
    console.log("gemini-pro error:", e.message);
  }
}
run();
