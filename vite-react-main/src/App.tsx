import { useState } from "react";
import "./styles.css";

import { avatar, photo } from "./lib/placeholders";
import { Post, User } from "./types";
import Feed from "./components/feed/Feed";
import AssistantOrb from "./components/AssistantOrb";
import WorldScreen from "./components/WorldScreen";

const me: User = { id: "me", name: "You", avatar: avatar("You") };

const postsSeed: Post[] = [
  { id: "p1", author: "Elena R.", authorAvatar: avatar("Elena R"), title: "Travel", time: "4h · Edited", images: [{ id: "a", url: photo(1080,1350) }] },
  { id: "p2", author: "Expanso", authorAvatar: avatar("Expanso"), title: "Ad", time: "Sponsored", images: [{ id: "b", url: photo(1080,1350) }] },
  { id: "p3", author: "Lola", authorAvatar: avatar("Lola"), time: "2h", images: [{ id: "c", url: photo(1080,1350) }] },
];

export default function App() {
  const [mode, setMode] = useState<"feed"|"world">("feed");
  const [posts] = useState<Post[]>(postsSeed);

  return (
    <>
      {/* background */}
      <div className="bg-grid" />

      {/* brand hotspot (use your pink supernova asset if available) */}
      <div id="brand-hotspot" className="brand-hotspot">
        {/* If you have /supernova.png in public/, it will show; gradient is fallback */}
        <img src="/supernova.png" alt="" onError={(e)=>{ (e.currentTarget as HTMLImageElement).style.display="none"; }} />
      </div>

      {mode === "feed" ? (
        <Feed posts={posts} me={me} onEnterWorld={() => setMode("world")} onOpenProfile={(id) => console.log("open profile:", id)} />
      ) : (
        <WorldScreen onBack={() => setMode("feed")} />
      )}

      {/* square, draggable AI orb; opens menu when overlapping brand */}
      <AssistantOrb brandTargetId="brand-hotspot" onEnterUniverse={() => setMode("world")} />
    </>
  );
}
