import { GoogleGenerativeAI } from '@google/generative-ai';
const genAI = new GoogleGenerativeAI('AIzaSyDrRrfAvOzsk9CxO0qwa6SuTfq62J-RA38');
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
model.generateContent('hello')
  .then(r => console.log('SUCCESS!', r.response.text()))
  .catch(e => console.error('ERROR RESPONSE:', e.message));
