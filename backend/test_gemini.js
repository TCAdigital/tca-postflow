const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

async function test() {
  console.log('Testing Gemini API with Key:', process.env.GEMINI_API_KEY ? 'Present' : 'Missing');
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    console.log('Listing available models...');
    const result_list = await genAI.getGenerativeModel({ model: 'gemini-1.5-flash' }); // dummy model just to get the client or use direct list
    // Actually SDK has a specific way to list models if I recall correctly, but usually we just test standard names.
    // Let's try 'gemini-1.5-flash' again but maybe the key is restricted?
  } catch (err) {
    console.error('Gemini Test Failed:', err.message);
  }
}
async function listModels() {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    // There is no direct listModels in the browser/node SDK in a simple way without auth/etc sometimes.
    // Let's try 'gemini-1.5-flash-001' or 'gemini-pro'.
}

test();
