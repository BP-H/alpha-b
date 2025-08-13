import { useEffect, useRef, useState } from "react";

type Props = {
  brandTargetId?: string;          // id of the brand badge (top-left)
  onEnterUniverse?: () => void;    // action when user picks Enter Universe
};

const PAD = 8;
const DRAG_THRESHOLD = 3;

export default function AssistantOrb({ brandTargetId = "brand-hotspot", onEnterUniverse }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const downPos = useRef<{x:number;y:number}|null>(null);
  const [pos, setPos] = useState<{x:number;y:number}>(() => {
    try { const s = localStorage.getItem("orb-pos"); if (s) return JSON.parse(s); } catch {}
    return { x: 14, y: 14 };
  });
  const [listening, setListening] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // persist & detect overlap with brand badge
  useEffect(() => {
    localStorage.setItem("orb-pos", JSON.stringify(pos));
    if (ref.current) ref.current.style.transform = `translate(${pos.x}px, ${pos.y}px)`;

    const brand = document.getElementById(brandTargetId);
    if (!brand || !ref.current) return;
    const a = ref.current.getBoundingClientRect();
    const b = brand.getBoundingClientRect();
    const overlap = !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom);
    setMenuOpen(overlap);
  }, [pos, brandTargetId]);

  const clamp = (x:number, y:number) => {
    const w = window.innerWidth, h = window.innerHeight, sz = 64;
    return {
      x: Math.min(Math.max(x, PAD), w - sz - PAD),
      y: Math.min(Math.max(y, PAD), h - sz - PAD),
    };
  };

  function onDown(e: React.PointerEvent) {
    (e.target as Element).setPointerCapture(e.pointerId);
    downPos.current = { x: e.clientX, y: e.clientY };
    setListening(true);
    setDragging(false);

    const sx = e.clientX - pos.x;
    const sy = e.clientY - pos.y;

    const move = (ev: PointerEvent) => {
      // detect drag after small threshold
      if (!dragging) {
        const dx = Math.abs(ev.clientX - (downPos.current?.x ?? ev.clientX));
        const dy = Math.abs(ev.clientY - (downPos.current?.y ?? ev.clientY));
        if (dx > DRAG_THRESHOLD || dy > DRAG_THRESHOLD) setDragging(true);
      }
      const next = clamp(ev.clientX - sx, ev.clientY - sy);
      setPos(next);
    };

    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      setListening(false);
      setDragging(false);
      downPos.current = null;
    };

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  return (
    <>
      <div
        ref={ref}
        className={`ai-orb ${listening ? "listening" : ""} ${dragging ? "dragging" : "floating"}`}
        role="button"
        aria-label="AI Orb"
        title="AI Orb"
        onPointerDown={onDown}
        style={{ transform: `translate(${pos.x}px, ${pos.y}px)` }}
      >
        {/* layered glows to fake depth */}
        <div className="orb-core" />
        <div className="orb-glow" />
        <div className="orb-spec" />
      </div>

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

      <style>{`
        /* spherical visual */
        .ai-orb{
          position:fixed; left:0; top:0; z-index:56;
          width:64px; height:64px; border-radius:50%;
          border:1px solid rgba(255,255,255,.12);
          transform: translate(14px,14px);
          transition: transform .16s ease, box-shadow .2s ease, filter .2s ease;
          will-change: transform, filter;
          overflow:hidden;
        }
        .ai-orb.floating{ animation:orb-float 6s ease-in-out infinite alternate }
        .ai-orb.dragging{ animation:none }
        .ai-orb.listening{ filter:saturate(120%); box-shadow:0 0 0 1px rgba(255,255,255,.1) inset, 0 14px 70px rgba(10,132,255,.75) }

        /* inner layers */
        .orb-core{
          position:absolute; inset:0; border-radius:50%;
          background:
            radial-gradient(60% 60% at 40% 35%, rgba(255,255,255,.95), rgba(255,255,255,.18) 65%, transparent 70%),
            radial-gradient(90% 90% at 70% 70%, rgba(10,132,255,.75), rgba(10,132,255,.2) 70%, transparent 72%),
            radial-gradient(140% 140% at 50% 50%, rgba(10,132,255,.2), transparent 60%);
        }
        .orb-glow{
          position:absolute; inset:-30%; border-radius:50%;
          background: conic-gradient(from 0deg, rgba(10,132,255,.2), rgba(155,134,255,.3), rgba(110,168,254,.25), rgba(10,132,255,.2));
          filter: blur(16px);
          animation: orb-swirl 9s linear infinite;
          mix-blend-mode: screen;
        }
        .orb-spec{
          position:absolute; left:10%; top:8%; width:40%; height:28%;
          background: radial-gradient(60% 100% at 0% 0%, rgba(255,255,255,.85), transparent 70%);
          border-radius:50%;
          transform: rotate(-12deg);
          opacity:.9;
        }

        @keyframes orb-float{
          0%{ transform: translate(14px,14px) }
          100%{ transform: translate(18px,22px) }
        }
        @keyframes orb-swirl{ to{ transform:rotate(360deg) } }
      `}</style>
    </>
  );
}
