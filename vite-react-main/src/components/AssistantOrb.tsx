// src/components/AssistantOrb.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import bus from "../lib/bus";
import { Post } from "../types";

/** Web Speech shim (do NOT redeclare speechSynthesis types) */
declare global {
  interface Window {
    webkitSpeechRecognition?: any;
    SpeechRecognition?: any;
  }
}
type SpeechRecognitionLike = any;

type XY = { x: number; y: number };
const FLY_MS = 600;
const DEFAULT_POST: Post = { id: -1, author: "@proto_ai", title: "Prototype Moment", image: "" };

export default function AssistantOrb({
  onPortal,
  hidden = false,
}: {
  onPortal: (post: Post, at: XY) => void;
  hidden?: boolean;
}) {
  // ---------- positioning / flight ----------
  const dock = useRef<XY>({ x: 0, y: 0 });
  const [pos, setPos] = useState<XY>(() => {
    const x = window.innerWidth - 76;
    const y = window.innerHeight - 76;
    dock.current = { x, y };
    return { x, y };
  });
  const [flying, setFlying] = useState(false);

  useEffect(() => {
    const onR = () => {
      const x = window.innerWidth - 76;
      const y = window.innerHeight - 76;
      dock.current = { x, y };
      if (!flying) setPos({ x, y });
    };
    window.addEventListener("resize", onR);
    return () => window.removeEventListener("resize", onR);
  }, [flying]);

  // Fly to hovered card, then portal
  useEffect(() => {
    return bus.on("orb:portal", (payload: { post: Post; x: number; y: number }) => {
      setFlying(true);
      setPos({ x: payload.x, y: payload.y });
      window.setTimeout(() => {
        onPortal(payload.post, { x: payload.x, y: payload.y });
        setPos({ ...dock.current });
        window.setTimeout(() => setFlying(false), 350);
      }, FLY_MS);
    });
  }, [onPortal]);

  // ---------- voice: half-duplex listen/speak ----------
  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const listeningRef = useRef(false);
  const speakingRef = useRef(false);
  const restartOnEndRef = useRef(false);
  const firstGestureRef = useRef(false);
  const lastHoverRef = useRef<{ post: Post; x: number; y: number } | null>(null);

  const [micOn, setMicOn] = useState(false);
  const [toast, setToast] = useState("");

  // track hovered card so “enter world” knows where to fly
  useEffect(() => bus.on("feed:hover", (p) => (lastHoverRef.current = p)), []);

  // 1) Unlock audio + warm voices (first user gesture)
  async function unlockAudioAndVoices() {
    if (firstGestureRef.current) return;
    firstGestureRef.current = true;
    try {
      const synth: any = (window as any).speechSynthesis;
      synth?.cancel?.();
      // warm voices list
      await new Promise<void>((resolve) => {
        const done = () => resolve();
        const id = setTimeout(done, 400);
        synth?.addEventListener?.("voiceschanged", () => {
          clearTimeout(id);
          done();
        }, { once: true });
      });
      // silent blip to satisfy autoplay
      const Utter = (window as any).SpeechSynthesisUtterance;
      if (Utter && synth) {
        const u = new Utter(" ");
        u.volume = 0;
        synth.speak(u);
        synth.cancel();
      }
    } catch {}
  }

  // 2) Ensure mic permission (and HTTPS)
  async function ensureMic(): Promise<boolean> {
    if (!location.hostname.includes("localhost") && location.protocol !== "https:") {
      setToast("Mic needs HTTPS (use Vercel prod or localhost).");
      return false;
    }
    try {
      const stAny = (navigator as any).permissions?.query
        ? await (navigator as any).permissions.query({ name: "microphone" as any })
        : null;
      if (stAny?.state === "denied") return false;
    } catch {}
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: true });
      s.getTracks().forEach((t) => t.stop());
      return true;
    } catch {
      return false;
    }
  }

  // 3) Speak (pause recognition during TTS to avoid feedback)
  function speak(text: string): Promise<void> {
    return new Promise((resolve) => {
      try {
        const synth: any = (window as any).speechSynthesis;
        const Utter = (window as any).SpeechSynthesisUtterance;
        if (!synth || !Utter) return resolve();

        synth.cancel();
        const u = new Utter(text || "Okay.");
        const v = synth.getVoices?.().find((vv: any) => vv?.lang?.startsWith?.("en"));
        if (v) u.voice = v;
        u.rate = 1;
        u.pitch = 1;
        u.lang = "en-US";

        u.onstart = () => {
          speakingRef.current = true;
          restartOnEndRef.current = false;
          try {
            recRef.current?.stop();
          } catch {}
        };

        u.onend = () => {
          speakingRef.current = false;
          if (micOn) {
            restartOnEndRef.current = true;
            setTimeout(() => {
              try {
                recRef.current?.start();
              } catch {}
            }, 200);
          }
          resolve();
        };

        synth.speak(u);
      } catch {
        resolve();
      }
    });
  }

  // 4) Call assistant (reads API key saved in Sidebar → localStorage)
  async function askAssistant(q: string): Promise<string> {
    const apiKey = localStorage.getItem("sn2177.apiKey") || "";
    try {
      const r = await fetch("/api/assistant-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ q, apiKey: apiKey || undefined }),
      });
      const j = await r.json().catch(() => ({}));
      if (!j?.ok) throw new Error(j?.error || "assistant error");
      return (j.text || "").trim();
    } catch (e) {
      console.error(e);
      return "";
    }
  }

  // 5) Recognizer lifecycle (single instance)
  useEffect(() => {
    const Ctor = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!Ctor) {
      setToast("Voice not supported in this browser");
      return;
    }

    const rec: SpeechRecognitionLike = new Ctor();
    recRef.current = rec;
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-US";

    rec.onstart = () => {
      listeningRef.current = true;
      setToast("Listening…");
    };
    rec.onerror = (e: any) => {
      const code = e?.error || "mic error";
      const map: Record<string, string> = {
        "not-allowed": "Mic blocked — allow in site settings.",
        "no-speech": "Didn’t catch that.",
        "aborted": "Restarting…",
        "audio-capture": "No mic found.",
        "network": "Network error.",
      };
      setToast(map[code] || "Mic error");
      if (micOn && !speakingRef.current) setTimeout(() => { try { rec.start(); } catch {} }, 400);
    };
    rec.onend = () => {
      listeningRef.current = false;
      setToast(micOn ? "…" : "");
      if (restartOnEndRef.current && !speakingRef.current) {
        setTimeout(() => {
          try {
            rec.start();
          } catch {}
        }, 250);
      }
    };

    rec.onresult = async (e: any) => {
      // interim
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (!r.isFinal) interim += r[0]?.transcript || "";
      }
      if (interim) setToast(`…${interim.trim()}`);

      // finals
      const finals = Array.from(e.results as any).filter((r: any) => r.isFinal);
      if (!finals.length) return;
      const final = finals.map((r: any) => r[0]?.transcript || "").join(" ").trim();
      if (!final) return;

      bus.emit("chat:add", { role: "user", text: final });

      // Local intents first (fast UI)
      const t = final.toLowerCase();
      if ((/enter|open/.test(t)) && /(world|portal|void)/.test(t)) {
        const target =
          lastHoverRef.current ?? { post: DEFAULT_POST, x: window.innerWidth - 56, y: window.innerHeight - 56 };
        bus.emit("orb:portal", target);
        await speak("Entering world.");
        setToast("");
        return;
      }
      if ((/leave|exit|back/.test(t)) && /(world|portal|feed|void)/.test(t)) {
        bus.emit("ui:leave", {});
        await speak("Back to feed.");
        setToast("");
        return;
      }
      if (/make (it )?dark(er)?|dark mode/.test(t)) {
        bus.emit("world:update", { theme: "dark" });
        await speak("Dark mode.");
        setToast("");
        return;
      }
      if (/light(er)? mode|bright(er)?/.test(t)) {
        bus.emit("world:update", { theme: "light" });
        await speak("Light mode.");
        setToast("");
        return;
      }
      if (/(more|add) orbs?/.test(t)) {
        bus.emit("world:update", { orbCount: 20 });
        await speak("More orbs.");
        setToast("");
        return;
      }
      const m = t.match(/(orb|color).*(teal|cyan|blue|green|orange|red|white|black)/);
      if (m) {
        const named: Record<string, string> = {
          teal: "#14b8a6",
          cyan: "#06b6d4",
          blue: "#3b82f6",
          green: "#22c55e",
          orange: "#f97316",
          red: "#ef4444",
          white: "#ffffff",
          black: "#111827",
        };
        bus.emit("world:update", { orbColor: named[m[2]] || "#67e8f9" });
        await speak(`Orbs ${m[2]}.`);
        setToast("");
        return;
      }

      // Ask the assistant (uses env OPENAI_API_KEY on server, or localStorage key in dev)
      const reply = await askAssistant(final);
      const say = reply || "Okay.";
      bus.emit("chat:add", { role: "assistant", text: say });
      await speak(say);
      setToast("");
    };

    return () => {
      try {
        rec.stop();
      } catch {}
    };
  }, [micOn]);

  // keepalive: nudge recognition if it silently drops
  useEffect(() => {
    const id = setInterval(() => {
      if (micOn && !listeningRef.current && !speakingRef.current) {
        try {
          recRef.current?.start();
        } catch {}
      }
    }, 4000);
    return () => clearInterval(id);
  }, [micOn]);

  async function startListening() {
    await unlockAudioAndVoices();
    const ok = await ensureMic();
    if (!ok) {
      setToast("Mic blocked — allow in site settings / use HTTPS");
      bus.emit("chat:add", {
        role: "system",
        text: "Microphone blocked. Click the padlock → allow microphone.",
      });
      return;
    }
    restartOnEndRef.current = true;
    try {
      recRef.current?.start();
      setMicOn(true);
    } catch {}
  }
  function stopListening() {
    restartOnEndRef.current = false;
    try {
      recRef.current?.stop();
    } catch {}
    setMicOn(false);
    setToast("");
  }
  const toggleMic = () => (micOn ? stopListening() : startListening());

  // ---------- render ----------
  const style = useMemo(
    () => ({ left: pos.x + "px", top: pos.y + "px", display: hidden ? "none" : undefined }),
    [pos, hidden]
  );

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
