// /api/assistant-reply.ts
export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }
  const { apiKey, prompt } = (req.body || {});
  if (!apiKey) return res.status(400).json({ ok: false, error: "Missing apiKey" });
  if (!prompt) return res.status(400).json({ ok: false, error: "Missing prompt" });

  try {
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.3,
        messages: [
          { role: "system", content: "You are the SuperNOVA assistant orb. Reply in one or two concise sentences. No markdown." },
          { role: "user", content: String(prompt).slice(0, 2000) },
        ],
      }),
    });
    const data = await r.json();
    if (!r.ok) return res.status(r.status).json({ ok: false, error: data?.error?.message || "Failed" });
    const text = data?.choices?.[0]?.message?.content || "";
    return res.status(200).json({ ok: true, text });
  } catch (e: any) {
    return res.status(500).json({ ok: false, error: e?.message || "Network error" });
  }
}


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
[01:14:02.928] Running build in Washington, D.C., USA (East) – iad1
[01:14:02.929] Build machine configuration: 4 cores, 8 GB
[01:14:02.980] Cloning github.com/BP-H/alpha-b (Branch: main, Commit: aaae74d)
[01:14:03.178] Previous build caches not available
[01:14:03.346] Cloning completed: 366.000ms
[01:14:05.497] Running "vercel build"
[01:14:06.011] Vercel CLI 44.7.3
[01:14:06.208] Error: Two or more files have conflicting paths or names. Please make sure path segments and filenames, without their extension, are unique. The path "api/assistant-reply.js" has conflicts with "api/assistant-reply.ts".
