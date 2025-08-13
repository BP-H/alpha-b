import { useEffect, useRef, useState } from "react";
import bus from "../lib/bus";
import useSpeech from "../lib/useSpeech";
import { assistantReply } from "../lib/api";

type XY = { x:number; y:number };

export default function AssistantOrb() {
  const ref = useRef<HTMLDivElement|null>(null);
  const [pos, setPos] = useState<XY>(() => {
    try { const s = localStorage.getItem("orb-pos"); if (s) return JSON.parse(s); } catch {}
    const w = typeof window !== "undefined" ? window.innerWidth : 390;
    const h = typeof window !== "undefined" ? window.innerHeight : 844;
    return { x: w - 84, y: h - 84 }; // bottom-right spawn
  });
  const [dragging, setDragging] = useState(false);
  const [listening, setListening] = useState(false);
  const hold = useRef<number|null>(null);

  const { start, stop, supported } = useSpeech(async (text) => {
    bus.emit("chat:add", { role: "user", text });
    try {
      const r = await assistantReply(text);
      if (r && r.ok && r.text) {
        bus.emit("chat:add", { role: "assistant", text: r.text });
      } else {
        bus.emit("chat:add", { role: "assistant", text: (r && r.error) || "" });
      }
    } catch {
      bus.emit("chat:add", { role: "assistant", text: "error" });
    }
  });

  useEffect(() => {
    localStorage.setItem("orb-pos", JSON.stringify(pos));
    if (ref.current) ref.current.style.transform = `translate(${pos.x}px, ${pos.y}px)`;
  }, [pos]);

  const clamp = (x:number, y:number) => {
    const w = window.innerWidth, h = window.innerHeight, sz = 64, m = 8;
    return { x: Math.min(Math.max(x, m), w - sz - m), y: Math.min(Math.max(y, m), h - sz - m) };
  };

  const onDown = (e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture(e.pointerId);
    setDragging(true);
    hold.current = window.setTimeout(()=> setListening(true), 650);
  };
  const onMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    if (hold.current) { clearTimeout(hold.current); hold.current = null; }
    setPos(clamp(e.clientX - 32, e.clientY - 32));
  };
  const onUp = (e: React.PointerEvent) => {
    (e.target as Element).releasePointerCapture(e.pointerId);
    setDragging(false);
    if (hold.current) { clearTimeout(hold.current); hold.current = null; }
    if (listening) setListening(false);
  };

  useEffect(() => {
    if (!supported) return;
    if (listening) start(); else stop();
  }, [listening, start, stop, supported]);

  return (
    <div
      ref={ref}
      className={`ai-orb ${listening ? "listening" : ""}`}
      onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp}
      role="button" aria-label="Assistant orb"
      style={{ transform:`translate(${pos.x}px, ${pos.y}px)` }}
    >
      <div className="core" />
      <div className="swirl" />
      <div className="spec" />
    </div>
  );
}
