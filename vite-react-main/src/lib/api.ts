// src/lib/api.ts
export async function pingOpenAI(apiKey: string) {
  const r = await fetch("/api/openai-ping", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ apiKey }),
  });
  return r.json();
}

export async function quickChat(apiKey: string) {
  const r = await fetch("/api/openai-quick-chat", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ apiKey }),
  });
  return r.json();
}

export async function assistantReply(q: string, apiKey?: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);
  try {
    const r = await fetch("/api/assistant-reply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(apiKey ? { q, apiKey } : { q }),
      signal: controller.signal,
    });
    if (!r.ok) {
      const error = await r.text();
      return { ok: false, error };
    }
    const { text } = await r.json();
    return { ok: true, text };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? String(e) };
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchPlayers(): Promise<{id:string; name:string; color:string}[]> {
  try {
    const r = await fetch("/api/players");
    const j = await r.json();
    return j?.ok ? (j.players || []) : [];
  } catch {
    return [];
  }
}
