import { useEffect, useRef, useState } from "react";
import "./AssistantOrb.css";

type XY = { x:number; y:number };

export default function AssistantOrb() {
  const ref = useRef<HTMLButtonElement|null>(null);
  const [pos, setPos] = useState<XY>(() => {
    try { const s = localStorage.getItem("orb-pos"); if (s) return JSON.parse(s); } catch {}
    const w = typeof window !== "undefined" ? window.innerWidth : 390;
    const h = typeof window !== "undefined" ? window.innerHeight : 844;
    return { x: w - 84, y: h - 84 }; // bottom-right
  });
  const [dragging, setDragging] = useState(false);
  const [listening, setListening] = useState(false);
  const hold = useRef<number|null>(null);

  useEffect(() => {
    localStorage.setItem("orb-pos", JSON.stringify(pos));
    if (ref.current) ref.current.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;
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

  return (
    <button
      ref={ref}
      className={`orb ${dragging ? "dragging": ""} ${listening ? "listening": ""}`}
      onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp}
      aria-label="Assistant"
      style={{ transform: `translate3d(${pos.x}px, ${pos.y}px, 0)` }}
    >
      <span className="orb-core" />
      <span className="orb-sheen" />
      {listening && <span className="orb-pulse" aria-hidden="true" />}
    </button>
  );
}
