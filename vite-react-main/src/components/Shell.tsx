import React from "react";
import Feed from "./feed/Feed";
import AssistantOrb from "./AssistantOrb";
import World3D from "./World3D";
import ChatDock from "./ChatDock";
import bus from "../lib/bus";

export default function Shell() {
  // If you have a Portal overlay, forward the event so the rest of the app can react.
  const onPortal = (post: any, at: { x: number; y: number }) => {
    try { bus.emit?.("portal:open", { post, at }); } catch {}
  };

  return (
    <>
      {/* 3D background (click-through) */}
      <div className="world-layer">
        <World3D selected={null} onBack={() => {}} />
      </div>

      {/* Scrollable feed viewport */}
      <div className="content-viewport">
        <div className="feed-wrap">
          <Feed />
        </div>
      </div>

      {/* Voice orb & chat dock (fixed) */}
      <AssistantOrb onPortal={onPortal} />
      <ChatDock />
    </>
  );
}
