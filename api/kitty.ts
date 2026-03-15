// api/kitty.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // ✅ Validate request body
    const { context, system } = req.body;
    
    if (!context || typeof context !== 'string') {
      return res.status(400).json({ 
        error: 'Bad Request', 
        details: 'context is required and must be a string' 
      });
    }

    // ✅ Check API key from environment
    const API_KEY = process.env.GOOGLE_GEMINI_API_KEY;
    
    if (!API_KEY) {
      console.error('❌ GOOGLE_GEMINI_API_KEY is not set in environment variables');
      return res.status(500).json({ 
        error: 'Server Configuration Error', 
        details: 'API key not configured' 
      });
    }

    console.log('✅ Starting Gemini API call...');
    
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      systemInstruction: system || undefined,
    });

    const result = await model.generateContent(context);
    const responseText = result.response.text();
    
    console.log('✅ Gemini API call successful');
    
    return res.status(200).json({ 
      message: responseText,
      success: true 
    });

  } catch (err: any) {
    // ✅ Detailed error logging
    console.error('❌ API Error:', {
      message: err.message,
      stack: err.stack,
      name: err.name
    });

    return res.status(500).json({ 
      error: 'API Error', 
      details: err.message || 'Unknown error',
      type: err.name || 'UnknownError'
    });
  }
}
