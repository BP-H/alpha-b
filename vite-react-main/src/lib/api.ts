// src/lib/api.ts
export async function pingOpenAI(apiKey: string) {
  const r = await fetch("/api/openai-ping", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ apiKey }),
  });
  return r.json();
}

export async function quickChat(apiKey: string) {
  const r = await fetch("/api/openai-quick-chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ apiKey }),
  });
  return r.json();
}
