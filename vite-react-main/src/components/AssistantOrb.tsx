// src/components/AssistantOrb.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import bus from "../lib/bus";
import type { Post } from "../types";
import type { WorldState } from "../lib/world";

/** Only declare speech recognition (built-in TTS types already exist). */
declare global {
  interface Window {
    webkitSpeechRecognition?: any;
    SpeechRecognition?: any;
  }
}
type SpeechRecognitionLike = any;

const FLY_MS = 600;
const ORB_SIZE = 56;

// Fallback "portal" post if none is hovered
const defaultPost: Post = {
  id: -1 as any,
  author: "@orb",
  title: "Prototype Moment",
  image: "",
} as unknown as Post;

/* ------------------------------ color helpers ------------------------------ */
function clamp(n: number, a: number, b: number) {
  return Math.min(b, Math.max(a, n));
}
function hexToRgb(hex: string) {
  const h = hex.replace("#", "");
  const b = h.length === 3
    ? h.split("").map((c) => c + c).join("")
    : h;
  const n = parseInt(b, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}
function rgbToHex({ r, g, b }: { r: number; g: number; b: number }) {
  const to2 = (x: number) => x.toString(16).padStart(2, "0");
  return `#${to2(r)}${to2(g)}${to2(b)}`;
}
function mixHex(a: string, b: string, t: number) {
  const A = hexToRgb(a), B = hexToRgb(b);
  return rgbToHex({
    r: Math.round(A.r + (B.r - A.r) * t),
    g: Math.round(A.g + (B.g - A.g) * t),
    b: Math.round(A.b + (B.b - A.b) * t),
  });
}
function lighten(hex: string, amt = 0.25) {
  const { r, g, b } = hexToRgb(hex);
  const L = (x: number) => Math.round(x + (255 - x) * amt);
  return rgbToHex({ r: L(r), g: L(g), b: L(b) });
}
/** Blue at bottom-right, pink at top-left. */
function gradientFor(pos: { x: number; y: number }) {
  const w = typeof window === "undefined" || window.innerWidth === 0
    ? 0.5
    : (pos.x / window.innerWidth + pos.y / window.innerHeight) / 2;
  const blue = "#3b82f6";
  const pink = "#ff2db8";
  const main = mixHex(pink, blue, clamp(w, 0, 1));
  const hi = lighten(main, 0.32);
  const mid = lighten(main, 0.16);
  return {
    bg: `radial-gradient(120% 120% at 30% 30%, ${hi}, ${mid} 60%, ${main} 100%)`,
    ring: `0 0 0 6px ${main}22`,
    glow: `0 12px 40px ${main}59`,
  };
}

/* --------------------------- intent + model helpers ------------------------ */
function parseLocalIntent(t: string, prev: Partial<WorldState>) {
  const patch: Partial<WorldState> = {};
  let action: "portal" | "leave" | null = null;
  let message: string | null = null;

  t = t.toLowerCase();

  // navigation
  if ((/enter|open/.test(t)) && /(world|portal|void)/.test(t)) {
    action = "portal";
    message = "Entering world";
  }
  if ((/leave|exit|back/.test(t)) && /(world|portal|feed|void)/.test(t)) {
    action = "leave";
    message = "Back to feed";
  }

  // theme
  if (/dark(er)?/.test(t)) { patch.theme = "dark" as any; message = "Dark mode"; }
  if (/light|bright(er)?/.test(t)) { patch.theme = "light" as any; message = "Light mode"; }

  // grid
  if (/(hide|turn off) grid/.test(t)) { patch.gridOpacity = 0; message = "Grid off"; }
  if (/(show|turn on) grid/.test(t)) { patch.gridOpacity = 0.18; message = "Grid on"; }

  // fog
  if (/(more|increase) fog/.test(t)) { patch.fogLevel = clamp((prev.fogLevel ?? .5) + 0.15, 0, 1); message = "More fog"; }
  if (/(less|decrease|clear) fog/.test(t)) { patch.fogLevel = clamp((prev.fogLevel ?? .5) - 0.15, 0, 1); message = "Less fog"; }

  // orbs count
  const mCount = t.match(/(?:set )?(?:orbs?|people) to (\d{1,2})/);
  if (mCount) { patch.orbCount = clamp(parseInt(mCount[1], 10), 1, 64); message = `Orbs ${patch.orbCount}`; }
  if (/(more|add) (?:orbs?|people)/.test(t)) { patch.orbCount = clamp((prev.orbCount ?? 14) + 4, 1, 64); message = `Orbs ${patch.orbCount}`; }
  if (/(less|fewer|remove) (?:orbs?|people)/.test(t)) { patch.orbCount = clamp((prev.orbCount ?? 14) - 4, 1, 64); message = `Orbs ${patch.orbCount}`; }

  // orb position (voice nudges)
  if (/come here|come to me|dock/i.test(t)) message = "Docking";

  // orbs color (basic names + hex)
  const named: Record<string, string> = {
    red:"#ef4444", blue:"#3b82f6", teal:"#14b8a6", cyan:"#06b6d4",
    green:"#22c55e", orange:"#f97316", white:"#ffffff", black:"#111827"
  };
  const hex = t.match(/#([0-9a-f]{3,6})/);
  const cname = Object.keys(named).find(k => t.includes(`${k} orb`) || t.includes(`${k} sphere`) || t.includes(`${k} color`));
  if (hex) { patch.orbColor = "#"+hex[1]; message = "Orb color updated"; }
  else if (cname) { patch.orbColor = named[cname]; message = `Orbs ${cname}`; }

  return { patch, action, message };
}

async function askModel(prompt: string): Promise<string | null> {
  const apiKey = localStorage.getItem("sn2177.apiKey") || "";
  if (!apiKey) return null;
  try {
    const r = await fetch("/api/assistant-reply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apiKey, prompt }),
    });
    const j = await r.json();
    if (!j?.ok) return j?.error || "Failed";
    return j.text || "";
  } catch (e: any) { return e?.message || "Network error"; }
}

// Speak, pause recognition during speech, resume after.
function speak(text: string, pause: () => void, resume: () => void): Promise<void> {
  return new Promise((resolve) => {
    try {
      const synth = (window as any).speechSynthesis;
      const Utter = (window as any).SpeechSynthesisUtterance;
      if (!synth || !Utter) { resolve(); return; }
      synth.cancel();
      const u = new Utter(text);
      const voices = synth.getVoices?.() || [];
      const v = voices.find((x: any) => x?.lang?.startsWith?.("en")) || voices[0];
      if (v) u.voice = v;
      u.rate = 1; u.pitch = 1; u.lang = "en-US";
      u.onstart = () => { pause(); };
      u.onend = () => { resume(); resolve(); };
      synth.speak(u);
    } catch { resolve(); }
  });
}

async function ensureMicPermission(): Promise<boolean> {
  try {
    const anyNav = navigator as any;
    if (anyNav?.permissions?.query) {
      const st = await anyNav.permissions.query({ name: "microphone" as any });
      if (st.state === "denied") return false;
      if (st.state === "granted") return true;
      // else fall through to prompt
    }
  } catch {}
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach(t => t.stop());
    return true;
  } catch {
    return false;
  }
}

/* --------------------------------- component -------------------------------- */
export default function AssistantOrb({
  onPortal = () => {},
  hidden = false,
}: {
  onPortal?: (post: Post, at: { x: number; y: number }) => void;
  hidden?: boolean;
}) {
  const dock = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const [pos, setPos] = useState<{ x: number; y: number }>(() => {
    const x = (typeof window !== "undefined" ? window.innerWidth : 800) - (ORB_SIZE + 20);
    const y = (typeof window !== "undefined" ? window.innerHeight : 600) - (ORB_SIZE + 20);
    dock.current = { x, y };
    return { x, y };
  });

  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const listeningRef = useRef(false);
  const restartOnEndRef = useRef(false);
  const speakingRef = useRef(false);

  const worldRef = useRef<Record<string, any>>({});
  const lastHoverRef = useRef<{ post: Post; x: number; y: number } | null>(null);

  const [micOn, setMicOn] = useState(false);
  const [toast, setToast] = useState("");
  const [flying, setFlying] = useState(false);

  // drag/hold handling
  const dragRef = useRef<{ dragging: boolean; dx: number; dy: number; held: boolean; timer?: number }>({
    dragging: false, dx: 0, dy: 0, held: false, timer: undefined
  });

  // keep dock bottom-right on resize
  useEffect(() => {
    const onR = () => {
      const x = window.innerWidth - (ORB_SIZE + 20);
      const y = window.innerHeight - (ORB_SIZE + 20);
      dock.current = { x, y };
      if (!flying && !dragRef.current.dragging) setPos({ x, y });
    };
    window.addEventListener("resize", onR);
    return () => window.removeEventListener("resize", onR);
  }, [flying]);

  // bus hooks
  useEffect(() => bus.on("feed:hover", (p) => (lastHoverRef.current = p)), []);
  useEffect(() => bus.on("world:remember", (s) => (worldRef.current = { ...worldRef.current, ...s })), []);

  // portal flight
  useEffect(() => {
    return bus.on("orb:portal", (payload: { post: Post; x: number; y: number }) => {
      setFlying(true); setPos({ x: payload.x, y: payload.y });
      window.setTimeout(() => {
        onPortal(payload.post, { x: payload.x, y: payload.y });
        setPos({ ...dock.current });
        window.setTimeout(() => setFlying(false), 350);
      }, FLY_MS);
    });
  }, [onPortal]);

  // create recognizer once
  useEffect(() => {
    const Ctor = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!Ctor) {
      setToast("Voice not supported");
      bus.emit("chat:add", { role: "system", text: "Voice not supported in this browser." });
      return;
    }
    const rec: SpeechRecognitionLike = new Ctor();
    recRef.current = rec;
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-US";

    rec.onstart = () => { listeningRef.current = true; setToast("Listening…"); };
    rec.onerror = () => { setToast("Mic error"); };
    rec.onend = () => {
      listeningRef.current = false;
      setToast(micOn ? "…" : "");
      if (restartOnEndRef.current && !speakingRef.current) {
        try { rec.start(); } catch {}
      }
    };

    rec.onresult = async (e: any) => {
      // show interim
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (!r.isFinal) interim += (r[0]?.transcript || "");
      }
      if (interim) setToast(`…${interim.trim()}`);

      // act on final
      const final = Array.from(e.results as any)
        .filter((r: any) => r.isFinal)
        .map((r: any) => r?.[0]?.transcript || "")
        .join(" ")
        .trim();

      if (!final) return;

      bus.emit("chat:add", { role: "user", text: final });
      setToast(`Heard: “${final}”`);

      const { patch, action, message } = parseLocalIntent(final, worldRef.current);

      if (patch && Object.keys(patch).length) {
        worldRef.current = { ...worldRef.current, ...patch };
        bus.emit("world:update", patch);
      }
      if (action === "portal") {
        const target = lastHoverRef.current
          ?? { post: defaultPost, x: window.innerWidth - 56, y: window.innerHeight - 56 };
        bus.emit("orb:portal", target);
      }
      if (action === "leave") bus.emit("ui:leave", {});

      const isPureLocal = !!(message || action || (patch && Object.keys(patch).length));
      const reply = isPureLocal ? (message || "Done.") : (await askModel(final)) || "Done.";

      // Pause recognition during speech, then resume.
      const recNow = recRef.current;
      const pause = () => { try { if (listeningRef.current) recNow?.stop(); } catch {} };
      const resume = () => {
        if (micOn) {
          restartOnEndRef.current = true;
          // onend will (re)start
        }
      };

      speakingRef.current = true;
      await speak(reply, pause, () => { speakingRef.current = false; resume(); });

      bus.emit("chat:add", { role: "assistant", text: reply });
      setToast(reply);
      window.setTimeout(() => setToast(""), 1600);
    };

    return () => { try { rec.stop(); } catch {} };
  }, [micOn]);

  /* ------------------------------- mic control ------------------------------ */
  async function startListening() {
    const ok = await ensureMicPermission();
    if (!ok) {
      setToast("Mic blocked — allow in site settings");
      bus.emit("chat:add", { role: "system", text: "Microphone blocked. Click the padlock → allow microphone." });
      return;
    }
    const rec = recRef.current;
    if (!rec) return;
    restartOnEndRef.current = true;
    try { rec.start(); setMicOn(true); } catch {}
  }
  function stopListening() {
    restartOnEndRef.current = false;
    try { recRef.current?.stop(); } catch {}
    setMicOn(false); setToast("");
  }
  const toggleMic = () => { if (micOn) stopListening(); else startListening(); };

  /* ------------------------------- drag & hold ------------------------------ */
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!dragRef.current.dragging) return;
      const nx = e.clientX - dragRef.current.dx;
      const ny = e.clientY - dragRef.current.dy;
      const maxX = window.innerWidth - 8;
      const maxY = window.innerHeight - 8;
      setPos({
        x: clamp(nx, 8, maxX),
        y: clamp(ny, 8, maxY),
      });
    };
    const onUp = () => {
      if (!dragRef.current.dragging) return;
      const wasHold = dragRef.current.held;
      dragRef.current.dragging = false;
      dragRef.current.held = false;
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      if (dragRef.current.timer) window.clearTimeout(dragRef.current.timer);

      // If it was a "hold to talk", stop when released; else it was a click toggle.
      if (wasHold) stopListening();
    };
    window.addEventListener("pointerup", onUp);
    return () => window.removeEventListener("pointerup", onUp);
  }, []); // listeners are attached dynamically in onPointerDown

  const onPointerDown = (e: React.PointerEvent) => {
    // start dragging
    dragRef.current.dragging = true;
    dragRef.current.dx = e.clientX - pos.x;
    dragRef.current.dy = e.clientY - pos.y;

    const onMove = (ev: PointerEvent) => {
      if (!dragRef.current.dragging) return;
      const nx = ev.clientX - dragRef.current.dx;
      const ny = ev.clientY - dragRef.current.dy;
      const maxX = window.innerWidth - 8;
      const maxY = window.innerHeight - 8;
      setPos({
        x: clamp(nx, 8, maxX),
        y: clamp(ny, 8, maxY),
      });
    };
    const onUp = () => {
      // cleared by effect's up too; safeguard here
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);

    // hold-to-talk: if held >350ms, start listening, and mark as "held"
    dragRef.current.timer = window.setTimeout(async () => {
      dragRef.current.held = true;
      await startListening();
    }, 350);
  };

  const onClick = () => {
    // If hold already started, click should do nothing (pointerup already handled).
    if (dragRef.current.held) return;
    toggleMic();
  };

  /* ------------------------------- render ---------------------------------- */
  const orbStyle = useMemo(() => {
    const g = gradientFor(pos);
    return {
      left: pos.x + "px",
      top: pos.y + "px",
      display: hidden ? "none" : undefined,
      background: g.bg,
      boxShadow: `${g.glow}, inset 0 1px 0 rgba(255,255,255,.5)`,
      border: "1px solid rgba(255,255,255,.15)",
    } as React.CSSProperties;
  }, [pos, hidden]);

  return (
    <button
      className={`assistant-orb ${micOn ? "mic" : ""} ${flying ? "flying" : ""}`}
      style={orbStyle}
      aria-label="Assistant"
      title={micOn ? "Listening… (click to stop)" : "Assistant (click to talk or hold)"}
      onPointerDown={onPointerDown}
      onClick={onClick}
    >
      <span className="assistant-orb__core" />
      <span className="assistant-orb__ring" />
      {toast && <span className="assistant-orb__toast">{toast}</span>}
    </button>
  );
}
