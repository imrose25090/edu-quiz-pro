export default async function handler(req, res) {
  // CORS সেটিংস
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const API_KEY = process.env.GOOGLE_GEMINI_API_KEY;
  const { context } = req.body || {};

  if (!API_KEY) return res.status(500).json({ error: 'API Key missing in Vercel settings' });
  if (!context) return res.status(400).json({ error: 'No message context provided' });

  try {
    // Google Gemini 1.5 Flash এপিআই কল
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: context }] }]
        })
      }
    );

    const data = await response.json();

    // এপিআই থেকে আসা আসল এরর চেক করা
    if (!response.ok) {
      console.error('Gemini API Error:', data);
      return res.status(response.status).json({ 
        error: 'Gemini API Error', 
        details: data.error?.message || 'Check your API Key permissions'
      });
    }

    // সঠিক টেক্সট রেসপন্স খুঁজে বের করা
    const aiMessage = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (aiMessage) {
      return res.status(200).json({ message: aiMessage });
    } else {
      throw new Error('Empty response from AI model');
    }

  } catch (err) {
    console.error('Server side error:', err);
    return res.status(500).json({ error: 'Server Error', details: err.message });
  }
}
