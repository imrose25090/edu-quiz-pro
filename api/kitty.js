export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const API_KEY = process.env.GOOGLE_GEMINI_API_KEY;
  const { context } = req.body || {};

  try {
    if (!API_KEY) throw new Error("API_KEY_MISSING_IN_VERCEL");
    if (!context) throw new Error("NO_CONTEXT_PROVIDED");

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: context }] }]
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ 
        error: "Gemini Error", 
        details: data.error?.message || "Unknown error" 
      });
    }

    const message = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response";
    return res.status(200).json({ message });

  } catch (err) {
    return res.status(500).json({ error: "Server Error", message: err.message });
  }
}
