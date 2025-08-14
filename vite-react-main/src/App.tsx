// src/App.tsx
import { useCallback, useEffect, useMemo, useState } from "react";
import "./styles.css";
import Shell from "./components/Shell";
import World3D from "./components/World3D";
import ChatDock from "./components/ChatDock";
import bus from "./lib/bus";
import type { Post } from "./types";

export default function App() {
  const [mode, setMode] = useState<"feed" | "world">("feed");
  const [selected, setSelected] = useState<Post | null>(null);
  const [burst, setBurst] = useState<{ on: boolean; x: number; y: number }>({ on: false, x: 0, y: 0 });

  const enterWorld = useCallback((p: Post, at?: { x: number; y: number }) => {
    setSelected(p);
    setBurst({ on: true, x: at?.x ?? window.innerWidth / 2, y: at?.y ?? window.innerHeight / 2 });
    window.setTimeout(() => { setMode("world"); setBurst((b) => ({ ...b, on: false })); }, 650);
  }, []);

  const leaveWorld = useCallback(() => setMode("feed"), []);

  // Allow voice "back/exit" to leave world
  useEffect(() => bus.on("ui:leave", () => setMode("feed")), []);

  const overlayStyle = useMemo(
    () => ({ ["--px" as any]: `${burst.x}px`, ["--py" as any]: `${burst.y}px` }) as React.CSSProperties,
    [burst.x, burst.y]
  );

  return (
    <div style={{ position: "relative" }}>
      {mode === "feed" ? (
        <Shell onPortal={enterWorld} hideOrb={false} />
      ) : (
        <main className="content" style={{ padding: 0 }}>
          <World3D selected={selected} onBack={leaveWorld} />
        </main>
      )}

      {/* Chat dock shows transcripts + replies */}
      <ChatDock />

      {/* Expanding white portal mask */}
      <div className={`portal-overlay ${burst.on ? "on" : ""}`} style={overlayStyle} aria-hidden />
    </div>
  );
}
