// src/lib/api.ts

/* eslint-disable @typescript-eslint/no-explicit-any */

export const DEFAULT_TIMEOUT_MS = 20_000;

export type ApiOk<T>   = { ok: true; data: T; status: number };
export type ApiFail    = { ok: false; error: string; status?: number };
export type ApiResult<T> = ApiOk<T> | ApiFail;

type PostJsonOpts = {
  signal?: AbortSignal;       // external abort (e.g., component unmount)
  timeoutMs?: number;         // per-call override
  headers?: Record<string, string>;
};

/** Compose a timeout signal with an optional external signal. */
function composeAbortSignal(timeoutMs: number, external?: AbortSignal) {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(new DOMException("Request timed out", "AbortError")), timeoutMs);

  const onAbort = () => ctrl.abort(new DOMException("Aborted", "AbortError"));
  external?.addEventListener("abort", onAbort);

  const cleanup = () => {
    clearTimeout(id);
    external?.removeEventListener("abort", onAbort);
  };

  return { signal: ctrl.signal, cleanup };
}

async function safeParseJSON<T>(r: Response): Promise<T | string> {
  const ct = r.headers.get("content-type") || "";
  // Prefer JSON; fall back to text
  if (ct.includes("application/json")) {
    try { return (await r.json()) as T; } catch { /* fall through */ }
  }
  try { return await r.text(); } catch { return ""; }
}

async function postJSON<T>(url: string, body: unknown, opts: PostJsonOpts = {}): Promise<ApiResult<T>> {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, signal: externalSignal, headers = {} } = opts;
  const { signal, cleanup } = composeAbortSignal(timeoutMs, externalSignal);

  try {
    const r = await fetch(url, {
      method: "POST",
      credentials: "same-origin",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        ...headers,
      },
      body: JSON.stringify(body ?? {}),
      signal,
    });

    if (!r.ok) {
      const payload = await safeParseJSON<any>(r);
      const msg =
        typeof payload === "string"
          ? payload
          : payload?.error || payload?.message || `HTTP ${r.status}`;
      return { ok: false, error: msg, status: r.status };
    }

    const data = (await safeParseJSON<T>(r)) as T;
    return { ok: true, data, status: r.status };
  } catch (e: any) {
    const aborted = e?.name === "AbortError";
    const msg = aborted
      ? (externalSignal?.aborted ? "Request cancelled" : `Request timed out after ${timeoutMs} ms`)
      : (e?.message ?? String(e));
    return { ok: false, error: msg };
  } finally {
    cleanup();
  }
}

/* ------------------------------------------------------------------ */
/* Public API                                                          */
/* ------------------------------------------------------------------ */

/**
 * Maintains your existing signature & shape.
 * Returns: { ok: true, text } or { ok: false, error }
 */
export async function assistantReply(q: string, apiKey?: string): Promise<{ ok: boolean; text?: string; error?: string }> {
  // We keep your body shape for compatibility.
  const res = await postJSON<{ text?: string; message?: string; error?: string }>(
    "/api/assistant-reply",
    apiKey ? { q, apiKey } : { q }
  );

  if (!res.ok) {
    return { ok: false, error: res.error };
  }
  const text = res.data?.text ?? res.data?.message ?? "";
  return { ok: true, text };
}

/**
 * Original minimal versions kept as-is for compatibility.
 * They return raw r.json() and may throw on HTTP errors.
 * (If you prefer uniform results, use safePingOpenAI / safeQuickChat below.)
 */
export async function pingOpenAI(apiKey: string) {
  const r = await fetch("/api/openai-ping", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Accept": "application/json" },
    body: JSON.stringify({ apiKey }),
  });
  return r.json();
}

export async function quickChat(apiKey: string) {
  const r = await fetch("/api/openai-quick-chat", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Accept": "application/json" },
    body: JSON.stringify({ apiKey }),
  });
  return r.json();
}

/* ------------------------------------------------------------------ */
/* Safer, consistent variants (recommended)                            */
/* ------------------------------------------------------------------ */

export async function safePingOpenAI(apiKey: string, opts?: PostJsonOpts): Promise<ApiResult<{ ping?: string; [k: string]: any }>> {
  return postJSON("/api/openai-ping", { apiKey }, opts);
}

export async function safeQuickChat(apiKey: string, opts?: PostJsonOpts): Promise<ApiResult<{ text?: string; [k: string]: any }>> {
  return postJSON("/api/openai-quick-chat", { apiKey }, opts);
}

/* ------------------------------------------------------------------ */
/* Optional: streaming helper (SSE or line-delimited JSON/text)        */
/* ------------------------------------------------------------------ */

export type StreamCallbacks = {
  onToken?: (t: string) => void;          // each token/chunk
  onDone?: (full: string) => void;        // full concatenated text
  onError?: (err: string) => void;        // error message
};

export async function assistantReplyStream(
  q: string,
  { onToken, onDone, onError }: StreamCallbacks = {},
  apiKey?: string,
  opts: Omit<PostJsonOpts, "timeoutMs"> & { timeoutMs?: number } = {}
) {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, signal: externalSignal } = opts;
  const { signal, cleanup } = composeAbortSignal(timeoutMs, externalSignal);
  let accumulated = "";

  try {
    const r = await fetch("/api/assistant-reply", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "text/event-stream, application/x-ndjson, application/json; q=0.5, text/plain; q=0.4",
      },
      body: JSON.stringify(apiKey ? { q, apiKey, stream: true } : { q, stream: true }),
      signal,
    });

    if (!r.ok || !r.body) {
      const fallback = await safeParseJSON<any>(r);
      const msg =
        typeof fallback === "string" ? fallback : fallback?.error || `HTTP ${r.status}`;
      onError?.(msg);
      return;
    }

    const reader = r.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      // Basic SSE/NDJSON/text tokenization
      const lines = chunk.split(/\r?\n/).filter(Boolean);
      for (const line of lines) {
        // SSE "data: ..." form
        const m = line.startsWith("data:") ? line.slice(5).trim() : line.trim();
        try {
          const obj = JSON.parse(m);
          const token = obj?.token ?? obj?.text ?? obj?.delta ?? "";
          if (token) {
            onToken?.(token);
            accumulated += token;
          }
        } catch {
          // Fallback: treat as plain text token
          onToken?.(m);
          accumulated += m;
        }
      }
    }

    onDone?.(accumulated);
  } catch (e: any) {
    const aborted = e?.name === "AbortError";
    onError?.(aborted ? (externalSignal?.aborted ? "Request cancelled" : `Request timed out after ${timeoutMs} ms`) : (e?.message ?? String(e)));
  } finally {
    cleanup();
  }
}
