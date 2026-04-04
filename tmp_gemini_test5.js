import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.VITE_GEMINI_API_KEY || "dummy-key");

async function testModel() {
  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: { responseMimeType: "application/json" }
    });
    const result = await model.generateContent("hello (return in json format { \"message\": \"hi\" })");
    console.log("SUCCESS:", result.response.text());
  } catch(e) {
    console.log("ERROR:", e.status, e.message);
  }
}
testModel();
