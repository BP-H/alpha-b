// api/assistant-reply.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'POST only' });
  }
  try {
    // Prefer env var; fall back to client-supplied key (for dev).
    const apiKey =
      (globalThis.process && globalThis.process.env && globalThis.process.env.OPENAI_API_KEY) ||
      (req.body && req.body.apiKey) || '';

    if (!apiKey) return res.status(500).json({ ok: false, error: 'Missing OPENAI_API_KEY' });

    const { q } = req.body || {};
    if (typeof q !== 'string' || !q.trim()) {
      return res.status(400).json({ ok: false, error: 'Missing q' });
    }

    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are the SuperNOVA voice. Keep replies concise (1–2 sentences).' },
          { role: 'user', content: q },
        ],
        temperature: 0.7,
      }),
    });

    const j = await r.json();
    const text = (j && j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content || '').trim();
    return res.status(200).json({ ok: true, text });
  } catch (e) {
    return res.status(500).json({ ok: false, error: (e && e.message) || 'server error' });
  }
}
