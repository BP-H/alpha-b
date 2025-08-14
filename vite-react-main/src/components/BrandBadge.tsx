import { useState } from "react";
import bus from "../lib/bus";
import "./BrandBadge.css";

export default function BrandBadge() {
  const [animating, setAnimating] = useState(false);

  const handleClick = () => {
    if (animating) return;
    setAnimating(true);
    setTimeout(() => {
      bus.emit("sidebar:toggle", undefined);
      setAnimating(false);
    }, 400);
  };

  return (
    <div className="brand-wrap">
      <button
        className={`brand-orb ${animating ? "animating" : ""}`}
        aria-label="Toggle sidebar"
        onClick={handleClick}
      >
        <svg viewBox="0 0 100 100">
          <defs>
            <radialGradient id="orb-grad" cx="30%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
              <stop offset="60%" stopColor="#0b66ff" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#001a44" stopOpacity="1" />
            </radialGradient>
          </defs>
          <circle cx="50" cy="50" r="45" fill="url(#orb-grad)" />
          <text
            x="50"
            y="58"
            textAnchor="middle"
            fontSize="32"
            fontWeight="bold"
            fill="#0b66ff"
            fontFamily="sans-serif"
          >
            2177
          </text>
        </svg>
      </button>
      <div className="brand-label">superNova2177</div>
    </div>
  );
}

