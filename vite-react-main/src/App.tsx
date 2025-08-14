// src/App.tsx
import { useCallback, useEffect, useMemo, useState } from "react";
import "./styles.css";
import BackgroundVoid from "./three/BackgroundVoid";
import Shell from "./components/Shell";
import World3D from "./components/World3D";
import ChatDock from "./components/ChatDock";
import type { Post } from "./types";
import bus from "./lib/bus";

export default function App() {
  const [mode, setMode] = useState<"feed" | "world">("feed");
  const [selected, setSelected] = useState<Post | null>(null);
  const [burst, setBurst] = useState<{ on: boolean; x: number; y: number }>({
    on: false,
    x: 0,
    y: 0,
  });

  // Called when the orb portals
  const enterWorld = useCallback((p: Post, at?: { x: number; y: number }) => {
    setSelected(p);
    setBurst({
      on: true,
      x: at?.x ?? window.innerWidth / 2,
      y: at?.y ?? window.innerHeight / 2,
    });
    window.setTimeout(() => {
      setMode("world");
      setBurst((b) => ({ ...b, on: false }));
    }, 650);
  }, []);

  const leaveWorld = useCallback(() => setMode("feed"), []);

  // Voice “back/exit”
  useEffect(() => bus.on("ui:leave", () => setMode("feed")), []);

  const overlayStyle = useMemo(
    () =>
      ({
        "--px": `${burst.x}px`,
        "--py": `${burst.y}px`,
      }) as React.CSSProperties,
    [burst.x, burst.y]
  );

  return (
    <div style={{ position: "relative" }}>
      {/* always-on background */}
      <BackgroundVoid />

      {/* foreground */}
      <div className="apple-white-bg" style={{ position: "relative", zIndex: 1 }}>
        {mode === "feed" ? (
          <Shell onPortal={enterWorld} hideOrb={false} />
        ) : (
          <main className="content" style={{ padding: 0 }}>
            <World3D selected={selected} onBack={leaveWorld} />
          </main>
        )}
      </div>

      {/* chat transcript */}
      <ChatDock />

      {/* expanding portal mask */}
      <div className={`portal-overlay ${burst.on ? "on" : ""}`} style={overlayStyle} aria-hidden />
    </div>
  );
}
