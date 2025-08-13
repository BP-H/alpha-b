import { useEffect, useRef, useState } from "react";
import type { Post } from "../types";
import "./AssistantOrb.css";

type XY = { x: number; y: number };
type Props = {
  hidden?: boolean;
  onPortal?: (post?: Post, at?: XY) => void; // hook to “enter world” or open assistant
};

export default function AssistantOrb({ hidden, onPortal }: Props) {
  const orbRef = useRef<HTMLButtonElement | null>(null);
  const holdTimer = useRef<number | null>(null);
  const lastTap = useRef<number>(0);

  const [dragging, setDragging] = useState(false);
  const [listening, setListening] = useState(false);
  const [pos, setPos] = useState<XY>(() => {
    // spawn bottom-right, 20px from edges
    if (typeof window !== "undefined") {
      return { x: window.innerWidth - 84, y: window.innerHeight - 84 };
    }
    return { x: 0, y: 0 };
  });

  // subtle float loop
  useEffect(() => {
    let raf = 0;
    let t = 0;
    const loop = () => {
      if (!dragging) {
        t += 0.008;
        const dx = Math.sin(t) * 0.6;
        const dy = Math.cos(t * 1.3) * 0.6;
        setPos((p) => ({ x: p.x + dx, y: p.y + dy }));
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [dragging]);

  const clamp = (x: number, y: number) => {
    const w = typeof window !== "undefined" ? window.innerWidth : 0;
    const h = typeof window !== "undefined" ? window.innerHeight : 0;
    const size = 64;
    const m = 8;
    return {
      x: Math.max(m, Math.min(w - size - m, x)),
      y: Math.max(m, Math.min(h - size - m, y)),
    };
  };

  const startHold = () => {
    // long-press ~650ms -> listening mode
    clearHold();
    holdTimer.current = window.setTimeout(() => {
      setListening(true);
    }, 650);
  };
  const clearHold = () => {
    if (holdTimer.current) {
      window.clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
  };

  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture(e.pointerId);
    setDragging(true);
    startHold();
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    clearHold();
    const next = clamp(e.clientX - 32, e.clientY - 32);
    setPos(next);
  };

  const onPointerUp = (e: React.PointerEvent) => {
    (e.target as Element).releasePointerCapture(e.pointerId);
    setDragging(false);

    // tap / double-tap detection (300ms window)
    const now = Date.now();
    const delta = now - lastTap.current;
    lastTap.current = now;

    // if we exited listening because user lifted finger quickly, treat as a tap
    if (listening) {
      // you can hook real STT/assistant start here
      setListening(false);
      onPortal?.(undefined, centerOfOrb());
      return;
    }

    if (delta < 300) {
      // double-tap -> dock to top-left near the brand
      dockTopLeft();
    }
  };

  const centerOfOrb = (): XY => {
    const r = orbRef.current?.getBoundingClientRect();
    if (!r) return { x: pos.x + 32, y: pos.y + 32 };
    return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) };
  };

  const dockTopLeft = () => {
    setPos({ x: 12, y: 12 });
  };

  if (hidden) return null;

  return (
    <button
      ref={orbRef}
      className={`orb ${dragging ? "dragging" : ""} ${listening ? "listening" : ""}`}
      style={{ transform: `translate3d(${pos.x}px, ${pos.y}px, 0)` }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      aria-label="Assistant"
    >
      {/* glossy highlight + inner core handled in CSS */}
      <span className="orb-core" />
      <span className="orb-sheen" />
      {listening && <span className="orb-pulse" aria-hidden="true" />}
    </button>
  );
}
