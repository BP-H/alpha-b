import { useState } from "react";

export default function BrandBadge({ onEnterUniverse }: { onEnterUniverse: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="brand-wrap">
        <button className="brand-dot" aria-label="superNova2177" onClick={() => setOpen(!open)}>
          {/* If you have /supernova.png it'll show; gradient stays as fallback */}
          <img src="/supernova.png" alt="" onError={(e)=>{ (e.currentTarget as HTMLImageElement).style.display='none'; }} />
        </button>
        <div className="brand-label">superNova2177</div>
      </div>

      {open && (
        <div className="brand-menu">
          <button onClick={() => alert("Command Palette (wire voice later)")}>
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
