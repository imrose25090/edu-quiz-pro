// api/kitty.js — Vercel serverless function (plain JS, no TypeScript)
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')   return res.status(405).json({ error: 'Method not allowed' });

  const { context, system } = req.body || {};
  if (!context) return res.status(400).json({ error: 'Missing context' });

  const API_KEY = process.env.GOOGLE_GEMINI_API_KEY || "AIzaSyAmH6u0C9swhwv94V9kgOeiP7e4nE8EMKo";

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: system || '' }] },
          contents: [{ parts: [{ text: context }] }],
          generationConfig: { maxOutputTokens: 150, temperature: 0.8 },
        }),
      }
    );

    const data = await response.json();
    if (!response.ok) return res.status(500).json({ error: 'Gemini error', details: data });

    const message = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return res.status(200).json({ message });

  } catch (err) {
    return res.status(500).json({ error: 'Server error', details: err.message });
  }
}
