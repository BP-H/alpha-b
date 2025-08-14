// src/components/AssistantOrb.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import bus from "../lib/bus";
import type { Post } from "../types";
import type { WorldState } from "../lib/world";
import { assistantReply } from "../lib/api";

/** Only declare speech recognition (built-in TTS types already exist). */
declare global { interface Window { webkitSpeechRecognition?: any; SpeechRecognition?: any; } }
type SpeechRecognitionLike = any;

const FLY_MS = 600;
const defaultPost: Post = { id: "void", author: "@proto_ai", authorAvatar: "", title: "Prototype", time: "now", images: [] };

function clamp(n: number, a: number, b: number) { return Math.min(b, Math.max(a, n)); }

function parseLocalIntent(t: string, prev: Partial<WorldState>) {
  const patch: Partial<WorldState> = {};
  let action: "portal" | "leave" | null = null;
  let message: string | null = null;

  t = t.toLowerCase();

  if ((/enter|open/.test(t)) && /(world|portal|void)/.test(t)) { action = "portal"; message = "Entering world"; }
  if ((/leave|exit|back/.test(t)) && /(world|portal|feed|void)/.test(t)) { action = "leave"; message = "Back to feed"; }

  if (/dark(er)?/.test(t)) { patch.theme = "dark"; message = "Dark mode"; }
  if (/light|bright(er)?/.test(t)) { patch.theme = "light"; message = "Light mode"; }

  if (/(hide|turn off) grid/.test(t)) { patch.gridOpacity = 0; message = "Grid off"; }
  if (/(show|turn on) grid/.test(t)) { patch.gridOpacity = 0.18; message = "Grid on"; }

  if (/(more|increase) fog/.test(t)) { patch.fogLevel = clamp((prev.fogLevel ?? .5) + 0.15, 0, 1); message = "More fog"; }
  if (/(less|decrease|clear) fog/.test(t)) { patch.fogLevel = clamp((prev.fogLevel ?? .5) - 0.15, 0, 1); message = "Less fog"; }

  const mCount = t.match(/(?:set )?(?:orbs?|people) to (\d{1,2})/);
  if (mCount) { patch.orbCount = clamp(parseInt(mCount[1], 10), 1, 64); message = `Orbs ${patch.orbCount}`; }
  if (/(more|add) (?:orbs?|people)/.test(t)) { patch.orbCount = clamp((prev.orbCount ?? 14) + 4, 1, 64); message = `Orbs ${patch.orbCount}`; }
  if (/(less|fewer|remove) (?:orbs?|people)/.test(t)) { patch.orbCount = clamp((prev.orbCount ?? 14) - 4, 1, 64); message = `Orbs ${patch.orbCount}`; }

  const named: Record<string,string> = { red:"#ef4444", blue:"#3b82f6", teal:"#14b8a6", cyan:"#06b6d4", green:"#22c55e", orange:"#f97316", white:"#ffffff", black:"#111827" };
  const hex = t.match(/#([0-9a-f]{3,6})/);
  const cname = Object.keys(named).find(k => t.includes(`${k} orb`) || t.includes(`${k} sphere`) || t.includes(`${k} color`));
  if (hex) { patch.orbColor = "#"+hex[1]; message = "Orb color updated"; }
  else if (cname) { patch.orbColor = named[cname]; message = `Orbs ${cname}`; }

  return { patch, action, message };
}

// Speak and resolve when speech ends; pause recognition while speaking to avoid echo.
function speak(text: string, onBefore?: () => void, onAfter?: () => void): Promise<void> {
  return new Promise((resolve) => {
    try {
      const synth = (window as any).speechSynthesis;
      const Utter = (window as any).SpeechSynthesisUtterance;
      if (!synth || !Utter) return resolve();
      synth.cancel();
      const u = new Utter(text);
      const pick = synth.getVoices?.().find((v: any) => v?.lang?.startsWith?.("en"));
      if (pick) u.voice = pick;
      u.rate = 1; u.pitch = 1; u.lang = "en-US";
      u.onstart = () => { onBefore?.(); };
      u.onend = () => { onAfter?.(); resolve(); };
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
    }
  } catch {}
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach(t => t.stop());
    return true;
  } catch { return false; }
}

export default function AssistantOrb({
  onPortal,
  hidden = false,
}: {
  onPortal: (post: Post, at: { x: number; y: number }) => void;
  hidden?: boolean;
}) {
  const dock = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const [pos, setPos] = useState<{ x: number; y: number }>(() => {
    const x = window.innerWidth - 76, y = window.innerHeight - 76;
    dock.current = { x, y }; return { x, y };
  });

  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const listeningRef = useRef(false);
  const restartOnEndRef = useRef(false);
  const speakingRef = useRef(false);
  const worldRef = useRef<Partial<WorldState>>({});
  const lastHoverRef = useRef<{ post: Post; x: number; y: number } | null>(null);

  const [micOn, setMicOn] = useState(false);
  const [toast, setToast] = useState("");
  const [flying, setFlying] = useState(false);

  // keep dock in bottom-right on resize
  useEffect(() => {
    const onR = () => {
      const x = window.innerWidth - 76, y = window.innerHeight - 76;
      dock.current = { x, y }; if (!flying) setPos({ x, y });
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

  // create recognizer once (re-bound to micOn so restart semantics are fresh)
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
      // Auto-restart if we’re supposed to be listening and not currently speaking.
      if (restartOnEndRef.current && !speakingRef.current) {
        try { rec.start(); } catch {}
      }
    };

    rec.onresult = async (e: any) => {
      // interim
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (!r.isFinal) interim += (r[0]?.transcript || "");
      }
      if (interim) setToast(`…${interim.trim()}`);

      // final
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
        const target = lastHoverRef.current ?? { post: defaultPost, x: window.innerWidth - 56, y: window.innerHeight - 56 };
        bus.emit("orb:portal", target);
      }
      if (action === "leave") bus.emit("ui:leave", {});

      // model reply (only if not purely local)
      const isPureLocal = !!(message || action || (patch && Object.keys(patch).length));
      let reply = isPureLocal ? (message || "Done.") : "";
      if (!isPureLocal) {
        const r = await assistantReply(final);
        reply = r.ok ? (r.text || "Done.") : (r.error || "Failed.");
      }

      // Pause recognition during speech, then resume.
      const recNow = recRef.current;
      const stopIfListening = () => { try { if (listeningRef.current) recNow?.stop(); } catch {} };
      const maybeRestart = () => { if (micOn) { restartOnEndRef.current = true; /* onend handler will restart */ } };

      speakingRef.current = true;
      await speak(reply, stopIfListening, () => { speakingRef.current = false; maybeRestart(); });

      bus.emit("chat:add", { role: "assistant", text: reply });
      setToast(reply);
      window.setTimeout(() => setToast(""), 1600);
    };

    return () => { try { rec.stop(); } catch {} };
  }, [micOn]);

  async function startListening() {
    const ok = await ensureMicPermission();
    if (!ok) {
      setToast("Mic blocked — allow in site settings");
      bus.emit("chat:add", { role: "system", text: "Microphone blocked. Click the padlock → allow microphone." });
      return;
    }
    const rec = recRef.current; if (!rec) return;
    restartOnEndRef.current = true;
    try { rec.start(); setMicOn(true); } catch {}
  }
  function stopListening() {
    const rec = recRef.current; restartOnEndRef.current = false;
    try { rec?.stop(); } catch {}
    setMicOn(false); setToast("");
  }
  const toggleMic = () => { if (micOn) stopListening(); else startListening(); };

  const style = useMemo(() => ({ left: pos.x + "px", top: pos.y + "px", display: hidden ? "none" : undefined }), [pos, hidden]);

  return (
    <button
      className={`assistant-orb ${micOn ? "mic" : ""} ${flying ? "flying" : ""}`}
      style={style}
      aria-label="Assistant"
      title={micOn ? "Listening… (click to stop)" : "Assistant (click to talk)"}
      onClick={toggleMic}
    >
      <span className="assistant-orb__core" />
      <span className="assistant-orb__ring" />
      {toast && <span className="assistant-orb__toast">{toast}</span>}
    </button>
  );
}
