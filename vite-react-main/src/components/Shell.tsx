// src/components/Shell.tsx
import { useEffect, useMemo } from "react";
import type { Post, User } from "../types";
import BrandBadge from "./BrandBadge";
import AssistantOrb from "./AssistantOrb";
import ChatDock from "./ChatDock"; // <- Remove if App.tsx already renders ChatDock
import Feed from "./feed/Feed";
import { useFeedStore } from "../lib/feedStore";
import bus from "../lib/bus";

// quick demo images
const IMG = (id: number) => `https://picsum.photos/id/${id}/1080/1350`;
const SEED = [
  1015,1069,1025,1027,1043,1050,106,237,1005,1003,1002,1001,
  1021,1024,1032,1035,1037,1040,1041,1042,1044,1045,1049,1051,
  1055,1056,1059,1063,1067,1070,
];

export default function Shell({
  onPortal,
  hideOrb = false,
}: {
  onPortal: (post: Post, at: { x: number; y: number }) => void;
  hideOrb?: boolean;
}) {
  const avatar = (i: number) => `https://i.pravatar.cc/100?img=${(i % 70) + 1}`;
  const me: User = { id: "me", name: "You", avatar: avatar(99) };

  const posts: Post[] = useMemo(
    () =>
      SEED.map((id, i) => ({
        id: `p${i}`,
        author: i % 3 === 0 ? "Elena R." : i % 3 === 1 ? "Expanso" : "Lola",
        authorAvatar: avatar(i),
        title: i % 5 === 0 ? "Travel" : undefined,
        time: `${(i % 8) + 1}h`,
        images: [{ id: `i${i}`, url: IMG(id) }],
      })),
    []
  );

  // store posts once for the virtualized feed
  const setPosts = useFeedStore((s) => s.setPosts);
  useEffect(() => { setPosts(posts); }, [posts, setPosts]);

  // fallback "Enter Universe" click from cards (when no hover coords available)
  const fromFeedEnter = () => {
    const at = { x: window.innerWidth - 56, y: window.innerHeight - 56 };
    const post: Post = posts[0];
    // Ask the orb to animate and portal
    bus.emit("orb:portal", { post, x: at.x, y: at.y });
  };

  return (
    <>
      {/* Top-left brand */}
      <BrandBadge onEnterUniverse={fromFeedEnter} />

      {/* Feed */}
      <main className="content-viewport feed-wrap">
        <Feed
          me={me}
          onOpenProfile={(id) => console.log("profile:", id)}
          onEnterWorld={fromFeedEnter}
        />
      </main>

      {/* The Assistant orb (voice + portal) */}
      <AssistantOrb onPortal={onPortal} hidden={hideOrb} />

      {/* If App.tsx already renders ChatDock, remove the line below */}
      <ChatDock />
    </>
  );
}
