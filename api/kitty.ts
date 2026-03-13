
// api/kitty.ts — Vercel serverless function
// File টা project root এর /api/ folder এ রাখুন

import type { VercelRequest, VercelResponse } from '@vercel/node';

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

  const { context, system } = req.body;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY || '',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001', // fast + cheap for this use case
        max_tokens: 150,
        system,
        messages: [{ role: 'user', content: context }],
      }),
    });

    const data = await response.json();
    const text = data.content?.[0]?.text || '';
    return res.status(200).json({ message: text });
  } catch (err) {
    return res.status(500).json({ error: 'API error' });
  }
}
