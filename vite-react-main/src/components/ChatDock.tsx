// src/components/ChatDock.tsx
import { useEffect, useState } from "react";
import bus from "../lib/bus";

type Row = { role: "user" | "assistant" | "system"; text: string; partial?: boolean };

export default function ChatDock() {
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    const add = (r: Row) =>
      setRows((prev) => {
        // collapse partials (if you ever stream)
        if (r.partial && prev.length && prev[prev.length - 1].partial && prev[prev.length - 1].role === r.role) {
          const next = prev.slice();
          next[next.length - 1] = r;
          return next;
        }
        return [...prev, { ...r, partial: !!r.partial }].slice(-8);
      });
    return bus.on("chat:add", add);
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        left: 16,
        right: 16,
        bottom: 90,
        zIndex: 60,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        pointerEvents: "none",
      }}
    >
      {rows.map((r, i) => (
        <div
          key={i}
          style={{
            alignSelf: r.role === "user" ? "flex-start" : "flex-end",
            maxWidth: "70%",
            padding: "8px 10px",
            borderRadius: 12,
            background:
              r.role === "user" ? "rgba(255,255,255,.08)" : r.role === "assistant" ? "rgba(106,115,255,.18)" : "rgba(0,0,0,.35)",
            color: "#fff",
            backdropFilter: "blur(10px) saturate(140%)",
            border: "1px solid rgba(255,255,255,.12)",
          }}
        >
          {r.text}
          {r.partial && <span style={{ opacity: 0.6 }}> …</span>}
        </div>
      ))}
    </div>
  );
}
