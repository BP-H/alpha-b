import { useCallback, useEffect, useRef, useState } from "react";
import bus from "../lib/bus";
import useSpeech from "../lib/useSpeech";
import { assistantReply } from "../lib/api";

type XY = { x: number; y: number };

const HOLD_MS = 650;            // long-press to start listening
const MOVE_THRESHOLD = 8;       // px — beyond this, treat as drag (not press)
const ORB_SIZE = 64;
const MARGIN = 8;

export default function AssistantOrb() {
  const ref = useRef<HTMLDivElement | null>(null);
  const holdTimer = useRef<number | null>(null);
  const pressStart = useRef<XY | null>(null);
  const movedBeyond = useRef<boolean>(false);
  const pointerIdRef = useRef<number | null>(null);

  // Position — seed from storage, spawn bottom-right if none.
  const [pos, setPos] = useState<XY>(() => {
    try {
      const s = localStorage.getItem("orb-pos");
      if (s) return JSON.parse(s) as XY;
    } catch {}
    const w = typeof window !== "undefined" ? window.innerWidth : 390;
    const h = typeof window !== "undefined" ? window.innerHeight : 844;
    return { x: w - (ORB_SIZE + 20), y: h - (ORB_SIZE + 20) };
  });

  const [dragging, setDragging] = useState(false);
  const [listening, setListening] = useState(false);

  // Start/Stop speech recognition; after each utterance, reset UI to idle.
  const { start, stop, supported } = useSpeech(
    async (text) => {
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
      } finally {
        // Reset the UI back to idle after a single result.
        setListening(false);
      }
    }
  );

  // Utility
  const clampToViewport = useCallback((x: number, y: number): XY => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const minX = MARGIN;
    const minY = MARGIN;
    const maxX = w - ORB_SIZE - MARGIN;
    const maxY = h - ORB_SIZE - MARGIN;
    return { x: Math.min(Math.max(x, minX), maxX), y: Math.min(Math.max(y, minY), maxY) };
  }, []);

  const persist = useCallback((p: XY) => {
    try {
      localStorage.setItem("orb-pos", JSON.stringify(p));
    } catch {}
  }, []);

  // Keep the orb on-screen when the window resizes.
  useEffect(() => {
    const onResize = () => setPos((p) => clampToViewport(p.x, p.y));
    window.addEventListener("resize", onResize, { passive: true });
    return () => window.removeEventListener("resize", onResize);
  }, [clampToViewport]);

  // Start/stop mic when state toggles.
  useEffect(() => {
    if (!supported) return;
    if (listening) start();
    else stop();
  }, [listening, start, stop, supported]);

  // Handlers
  const clearHold = () => {
    if (holdTimer.current) {
      clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
  };

  const onPointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    (e.target as Element).setPointerCapture(e.pointerId);
    pointerIdRef.current = e.pointerId;
    pressStart.current = { x: e.clientX, y: e.clientY };
    movedBeyond.current = false;
    setDragging(true);

    // Long-press to start listening
    holdTimer.current = window.setTimeout(() => {
      // Only start if the finger/mouse hasn't moved beyond threshold
      if (!movedBeyond.current) {
        if (supported) setListening(true);
        else bus.emit("chat:add", { role: "assistant", text: "Speech recognition not supported on this browser." });
      }
      holdTimer.current = null;
    }, HOLD_MS);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging || !pressStart.current) return;

    // Distance from start — decide if we switch into drag mode
    const dx = e.clientX - pressStart.current.x;
    const dy = e.clientY - pressStart.current.y;
    if (!movedBeyond.current && Math.hypot(dx, dy) > MOVE_THRESHOLD) {
      movedBeyond.current = true;
      clearHold(); // cancel hold trigger once we commit to dragging
    }
    if (!movedBeyond.current) return; // still within tap/hold slop — don't move yet

    // Drag update
    const next = clampToViewport(e.clientX - ORB_SIZE / 2, e.clientY - ORB_SIZE / 2);
    setPos(next);
  };

  const finishPointer = () => {
    clearHold();
    setDragging(false);
    persist(pos); // save wherever we left it
    pressStart.current = null;
    pointerIdRef.current = null;
  };

  const onPointerUp = (e: React.PointerEvent) => {
    try {
      if (pointerIdRef.current !== null) (e.target as Element).releasePointerCapture(pointerIdRef.current);
    } catch {}
    // Tap without drag: toggle listening (press-and-hold already handled by timer)
    if (!movedBeyond.current) {
      setListening((on) => !on && supported ? true : false);
      if (!supported) bus.emit("chat:add", { role: "assistant", text: "Speech recognition not supported on this browser." });
    } else {
      // If we were dragging AND currently listening (e.g., long-press then move), stop on release
      if (listening) setListening(false);
    }
    finishPointer();
  };

  const onPointerCancel = () => {
    // Cleanly cancel everything
    clearHold();
    setDragging(false);
    pressStart.current = null;
    pointerIdRef.current = null;
  };

  // Keyboard accessibility
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      if (supported) setListening((v) => !v);
      else bus.emit("chat:add", { role: "assistant", text: "Speech recognition not supported on this browser." });
    } else if (e.key === "Escape") {
      if (listening) setListening(false);
    }
  };

  const ariaLabel = listening
    ? "Assistant — listening. Press Escape to stop."
    : "Assistant — hold to speak, or press Enter to start.";

  return (
    <div
      ref={ref}
      className={`ai-orb ${listening ? "listening" : ""}`}
      role="button"
      tabIndex={0}
      aria-pressed={listening}
      aria-label={ariaLabel}
      title="Hold to speak • Drag to move"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      onKeyDown={onKeyDown}
      onContextMenu={(e) => e.preventDefault()}
      data-dragging={dragging ? "true" : "false"}
      style={{ transform: `translate(${pos.x}px, ${pos.y}px)` }}
    >
      <div className="core" />
      <div className="swirl" />
      <div className="spec" />
      {/* Screen-reader state pings */}
      <span style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>
        {listening ? "Listening…" : "Idle"}
      </span>
    </div>
  );
}
