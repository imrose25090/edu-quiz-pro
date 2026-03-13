// project-root/api/kitty.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { context, system } = req.body;
  const API_KEY = process.env.GOOGLE_GEMINI_API_KEY || "AIzaSyAmH6u0C9swhwv94V9kgOeiP7e4nE8EMKo";

  try {
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      systemInstruction: system,
    });

    const result = await model.generateContent(context);
    return res.status(200).json({ message: result.response.text() });
  } catch (err: any) {
    return res.status(500).json({ error: 'API error', details: err.message });
  }
}
