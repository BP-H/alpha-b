import { useEffect, useMemo, useState } from "react";
import Feed from "./feed/Feed";
import AssistantOrb from "./AssistantOrb";
import bus from "../lib/bus";
import "./SidebarFab.css";
import { Post } from "../types";

export default function Shell({
  onPortal,
  hideOrb = false,
}: {
  onPortal: (p: Post, at?: { x: number; y: number }) => void;
  hideOrb?: boolean;
}) {
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => bus.on("nav:goto", () => setNavOpen(false)), []);

  const avatarData = useMemo(
    () =>
      "data:image/svg+xml;utf8," +
      encodeURIComponent(
        `<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 64 64'>
          <defs><radialGradient id='g' cx='30%' cy='30%' r='80%'>
            <stop offset='0%' stop-color='#fff9ff'/><stop offset='55%' stop-color='#ffb3ea'/><stop offset='100%' stop-color='#ff49cf'/>
          </radialGradient></defs>
          <rect width='64' height='64' rx='16' fill='#0f1117'/>
          <circle cx='32' cy='32' r='14' fill='url(#g)'/>
        </svg>`
      ),
    []
  );

  return (
    <div className="layout">
      {/* Top-left profile FAB */}
      <button className="fab" aria-label="Open menu" title="Menu" onClick={() => setNavOpen(true)}>
        <img
          className="fab__img"
          src="/avatar.jpg"
          onError={(e) => ((e.currentTarget as HTMLImageElement).src = avatarData)}
          alt="me"
        />
        <span className="fab__ring" />
        <span className="fab__pulse" />
      </button>

      {/* Drawer overlay */}
      <div className={`nav-overlay ${navOpen ? "on" : ""}`} onClick={() => setNavOpen(false)}>
        <div className="nav-drawer" onClick={(e) => e.stopPropagation()}>
          <div className="nav-head">
            <div className="ph" />
            <div>
              <div className="nav-name">taha_gungor</div>
              <div className="nav-sub">ceo • artist • @superNova_2177</div>
            </div>
          </div>
          <div className="nav-sec">Navigate</div>
          <button className="nav-btn" onClick={() => bus.emit("nav:goto", { label: "Feed" })}>📰 Feed</button>
          <button className="nav-btn" onClick={() => bus.emit("nav:goto", { label: "Chat" })}>💬 Chat</button>
          <button className="nav-btn" onClick={() => bus.emit("nav:goto", { label: "Messages" })}>📬 Messages</button>
          <button className="nav-btn" onClick={() => bus.emit("nav:goto", { label: "Profile" })}>👤 Profile</button>
          <div className="nav-divider" />
          <button className="nav-btn" onClick={() => setNavOpen(false)}>✕ Close</button>
        </div>
      </div>

      {/* Feed – full-bleed */}
      <main className="content" style={{ padding: 0, width: "100%" }}>
        <Feed onPortal={onPortal} />
      </main>

      {/* Bottom-right assistant orb */}
      {!hideOrb && <AssistantOrb onPortal={onPortal} hidden={false} />}
    </div>
  );
}