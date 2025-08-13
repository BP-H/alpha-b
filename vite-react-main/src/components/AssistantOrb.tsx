import { useEffect, useRef, useState } from "react";

type Props = {
  brandTargetId?: string;               // e.g., "brand-hotspot"
  onEnterUniverse?: () => void;
};

const HOLD_MS = 500;
const PAD = 8;

export default function AssistantOrb({ brandTargetId = "brand-hotspot", onEnterUniverse }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{x:number;y:number}>(() => {
    try{ const s = localStorage.getItem("orb-pos"); if (s) return JSON.parse(s); }catch{}
    return { x: 14, y: 14 };
  });
  const [listening, setListening] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const holdRef = useRef<number | null>(null);

  useEffect(() => {
    localStorage.setItem("orb-pos", JSON.stringify(pos));
    if (ref.current) ref.current.style.transform = `translate(${pos.x}px, ${pos.y}px)`;
    // overlap detect
    const brand = document.getElementById(brandTargetId);
    if (!brand || !ref.current) return;
    const a = ref.current.getBoundingClientRect();
    const b = brand.getBoundingClientRect();
    const overlap = !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom);
    setMenuOpen(overlap);
  }, [pos, brandTargetId]);

  const clamp = (x:number, y:number) => {
    const w = window.innerWidth, h = window.innerHeight, sz = 56;
    return {
      x: Math.min(Math.max(x, PAD), w - sz - PAD),
      y: Math.min(Math.max(y, PAD), h - sz - PAD),
    };
  };

  function onDown(e: React.PointerEvent) {
    (e.target as Element).setPointerCapture(e.pointerId);
    const sx = e.clientX - pos.x, sy = e.clientY - pos.y;
    holdRef.current = window.setTimeout(() => setListening(true), HOLD_MS);

    const move = (ev: PointerEvent) => setPos(clamp(ev.clientX - sx, ev.clientY - sy));
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      if (holdRef.current) { clearTimeout(holdRef.current); holdRef.current = null; }
      setListening(false);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  return (
    <>
      <div
        ref={ref}
        className={`portal-orb ${listening ? "listening": ""}`}
        role="button" aria-label="AI Orb" title="AI Orb"
        onPointerDown={onDown}
        style={{ transform: `translate(${pos.x}px, ${pos.y}px)` }}
      />
      {menuOpen && (
        <div className="brand-menu">
          <button onClick={() => alert("Command Palette (voice when wired)")}>
            <svg className="ico" viewBox="0 0 24 24"><path d="M5 12h14M5 7h10M5 17h7" stroke="currentColor" strokeWidth="2" fill="none"/></svg>
            <span>Command</span>
          </button>
          <button onClick={() => alert("Remix current image (stub)")}>
            <svg className="ico" viewBox="0 0 24 24"><path d="M7 7h10v4H7zm0 6h6v4H7z" stroke="currentColor" strokeWidth="2" fill="none"/></svg>
            <span>Remix</span>
          </button>
          <button onClick={onEnterUniverse}>
            <svg className="ico" viewBox="0 0 24 24"><path d="M12 2v20M2 12h20" stroke="currentColor" strokeWidth="2" fill="none"/></svg>
            <span>Enter Universe</span>
          </button>
        </div>
      )}
    </>
  );
}
