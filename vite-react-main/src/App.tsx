import { useMemo, useState } from "react";
import "./styles.css";
import { Post, User } from "./types";
import { avatar } from "./lib/placeholders";
import Feed from "./components/feed/Feed";
import AssistantOrb from "./components/AssistantOrb";
import BrandBadge from "./components/BrandBadge";
import World3D from "./components/World3D"; // your existing 3D scene

// Fake image stream (looks real). Add as many as you want.
const IMG = (id:number)=>`https://picsum.photos/id/${id}/1080/1350`;
const seedIds = [1015,1069,1025,1027,1043,1050,106,237,1005,1003,1002,1001,1021,1024,1032,1035,1037,1040,1041,1042,1044,1045,1049,1051,1055,1056,1059,1063,1067,1070];

const me: User = { id: "me", name: "You", avatar: avatar("You") };

export default function App() {
  const [mode, setMode] = useState<"feed"|"world">("feed");

  const posts: Post[] = useMemo(() =>
    seedIds.map((id, i) => ({
      id: `p${i}`,
      author: i % 3 === 0 ? "Elena R." : i % 3 === 1 ? "Expanso" : "Lola",
      authorAvatar: avatar(`${i}`),
      title: i % 5 === 0 ? "Travel" : undefined,
      time: `${(i%8)+1}h`,
      images: [{ id: `i${i}`, url: IMG(id) }],
    })), []
  );

  return (
    <>
      {/* 3D world as true background */}
      <div className="world-layer"><World3D /></div>

      {/* Brand (top-left) */}
      <BrandBadge onEnterUniverse={() => setMode("world")} />

      {/* Feed on top (mobile-only) or World overlay */}
      {mode === "feed" ? (
        <Feed posts={posts} me={me} onEnterWorld={() => setMode("world")} onOpenProfile={(id) => console.log("profile", id)} />
      ) : (
        <div style={{ position:"fixed", inset:0, zIndex:10 }}>
          <World3D />
          <button
            onClick={() => setMode("feed")}
            style={{ position:"fixed", left:12, top:12, zIndex:11, height:40, padding:"0 12px",
              border:"1px solid rgba(255,255,255,.12)", background:"rgba(14,16,22,.8)", color:"#fff" }}
          >Back</button>
        </div>
      )}

      {/* Orb (bottom-right spawn, draggable, stays) */}
      <AssistantOrb />
    </>
  );
}
