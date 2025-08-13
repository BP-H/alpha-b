import World3D from "./World3D";
import Feed from "./feed/Feed";
import PostCard from "./PostCard";
import BrandBadge from "./BrandBadge";
import AssistantOrb from "./AssistantOrb";
import ChatDock from "./ChatDock";
import "./Shell.css";
import { DEMO_POSTS, ME } from "./feed/data";

export default function Shell() {
  const onEnterUniverse = () => {
    // simple transition into the world layer for now
    document.body.classList.add("entering-world");
    setTimeout(() => document.body.classList.remove("entering-world"), 600);
  };

  return (
    <>
      {/* 3D background */}
      <World3D className="world-layer" />

      {/* Top-left brand */}
      <BrandBadge onEnterUniverse={onEnterUniverse} />

      {/* Feed */}
      <main className="content-viewport feed-wrap">
        <div className="feed-content">
          {DEMO_POSTS.map((p) => (
            <PostCard key={p.id} post={p} me={ME} onEnterWorld={onEnterUniverse} />
          ))}
        </div>
      </main>

      {/* Bottom nav (in Shell.css) is still rendered by your Shell.css rules */}

      {/* Free-floating assistant orb (bottom-right) */}
      <AssistantOrb />

      {/* Light chat bubbles dock (requested “check the chat”) */}
      <ChatDock />
    </>
  );
}
