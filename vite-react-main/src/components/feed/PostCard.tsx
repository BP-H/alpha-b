import { useState } from "react";
import { Post } from "../../types";

// Fallbacks
const FALLBACK_IMG =
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1400&auto=format&fit=crop";
const AVATAR_SVG =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 80 80'>
      <defs>
        <radialGradient id='g' cx='30%' cy='30%' r='80%'>
          <stop offset='0%' stop-color='#ffffff'/>
          <stop offset='60%' stop-color='#ffc6ee'/>
          <stop offset='100%' stop-color='#ff74de'/>
        </radialGradient>
      </defs>
      <rect width='80' height='80' rx='40' fill='#0f1117'/>
      <circle cx='40' cy='40' r='26' fill='url(#g)'/>
    </svg>`
  );

export default function PostCard({
  post,
  onPortal,
}: {
  post: Post;
  onPortal?: (p: Post, at?: { x: number; y: number }) => void;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  // read optional fields without changing Post type
  const pAny = post as any;
  const author = post.author || "@proto_ai";
  const title = post.title || "Untitled";
  const image = post.image || FALLBACK_IMG;
  const space = pAny.space || "superNova_2177";
  const avatar = pAny.avatar || AVATAR_SVG;
  const when = "now";

  return (
    <article className={`pc ${drawerOpen ? "dopen" : ""}`} aria-label={`Post by ${author}`}>
      {/* media */}
      <div className="pc-media">
        <img
          src={image}
          alt={title}
          loading="lazy"
          onError={(e) => {
            e.currentTarget.src = FALLBACK_IMG;
          }}
        />

        {/* top frosted bar */}
        <div className="pc-topbar">
          <button
            className="pc-ava"
            onClick={() => setDrawerOpen((v) => !v)}
            aria-label="Profile actions"
          >
            <img src={avatar} alt="" />
          </button>
          <div className="pc-meta">
            <div className="pc-handle">{author}</div>
            <div className="pc-sub">
              {when} • {space}
            </div>
          </div>
          <div className="pc-title">{title}</div>
        </div>

        {/* bottom frosted bar with 5 actions (first = profile) */}
        <div className="pc-botbar">
          <div className="pc-actions">
            <button
              className="pc-act profile"
              onClick={() => setDrawerOpen((v) => !v)}
              aria-label="Profile menu"
              title="Profile menu"
            >
              <span className="ico avatar" />
            </button>
            <button
              className="pc-act"
              onClick={() => setDrawerOpen((v) => !v)}
              aria-label="Engage"
              title="Engage"
            >
              <span className="ico heart" />
            </button>
            <button
              className="pc-act"
              onClick={() => setDrawerOpen((v) => !v)}
              aria-label="Comment"
              title="Comment"
            >
              <span className="ico comment" />
            </button>
            <button
              className="pc-act"
              onClick={() => setDrawerOpen((v) => !v)}
              aria-label="Share / Remix"
              title="Share / Remix"
            >
              <span className="ico share" />
            </button>
            <button
              className="pc-act"
              onClick={(e) => {
                const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
                onPortal?.(post, { x: r.left + r.width / 2, y: r.top });
              }}
              aria-label="Enter world"
              title="Enter world"
            >
              <span className="ico world" />
            </button>
          </div>
        </div>
      </div>

      {/* expanding drawer (comments / emojis / remix etc.) */}
      <div className="pc-drawer">
        <div style={{ padding: 12, display: "grid", gap: 10 }}>
          <input
            placeholder="Write a comment…"
            style={{
              height: 40,
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,.14)",
              background: "rgba(20,22,32,.65)",
              color: "#fff",
              padding: "0 12px",
              outline: "none",
            }}
          />
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {[
              "🤗",
              "🔥",
              "💜",
              "✨",
              "🚀",
              "🌌",
              "🧠",
              "💡",
              "🎯",
              "❤️‍🔥",
              "🎉",
              "👏",
              "😎",
              "🫶",
              "💬",
              "🔁",
            ].map((e, i) => (
              <button
                key={i}
                style={{
                  height: 34,
                  padding: "0 10px",
                  borderRadius: 999,
                  border: "1px solid rgba(255,255,255,.14)",
                  background: "rgba(17,20,35,.6)",
                  color: "#fff",
                  cursor: "pointer",
                }}
              >
                {e}
              </button>
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}
