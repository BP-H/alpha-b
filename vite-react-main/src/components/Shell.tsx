import { useMemo } from "react";
import "./Shell.css";
import type { Post, User } from "../types";
import { avatar } from "../lib/placeholders";
import Feed from "./feed/Feed";
import AssistantOrb from "./AssistantOrb";
import BrandBadge from "./BrandBadge";
import World3D from "./World3D";

type Props = {
  onPortal?: (post?: Post) => void; // enter-universe handler from App
};

const IMG = (id: number) => `https://picsum.photos/id/${id}/1080/1350`;
const seedIds = [
  1015, 1069, 1025, 1027, 1043, 1050, 106, 237, 1005, 1003, 1002, 1001,
  1021, 1024, 1032, 1035, 1037, 1040, 1041, 1042, 1044, 1045, 1049, 1051,
  1055, 1056, 1059, 1063, 1067, 1070,
];

export default function Shell({ onPortal }: Props) {
  const me: User = { id: "me", name: "You", avatar: avatar("You") };

  const posts: Post[] = useMemo(
    () =>
      seedIds.map((id, i) => ({
        id: `p${i}`,
        author: i % 3 === 0 ? "Elena R." : i % 3 === 1 ? "Expanso" : "Lola",
        authorAvatar: avatar(`${i}`),
        title: i % 5 === 0 ? "Travel" : undefined,
        time: `${(i % 8) + 1}h`,
        images: [{ id: `i${i}`, url: IMG(id) }],
      })),
    []
  );

  return (
    <>
      {/* 3D world sits BEHIND everything so frost shows it */}
      <div className="world-layer">
        <World3D selected={null} onBack={() => {}} />
      </div>

      {/* top-left brand circle + “superNova2177” label */}
      <BrandBadge onEnterUniverse={() => onPortal?.()} />

      {/* feed (single vertical image stream; top/bottom frosted stripes) */}
      <Feed
        posts={posts}
        me={me}
        onOpenProfile={(id) => console.log("profile:", id)}
        onEnterWorld={() => onPortal?.()}
      />

      {/* spherical, draggable orb (bottom-right spawn; stays via localStorage) */}
      <AssistantOrb />

      {/* bottom bar: 5 items — left avatar + 4 evenly spaced icons */}
      <nav className="bottom-bar frost" role="navigation" aria-label="Bottom">
        <button className="nav-item" title="Me">
          <div
            className="me-circle"
            style={{ backgroundImage: `url(${me.avatar})` }}
          />
        </button>
        <button className="nav-item" title="Engage" onClick={() => alert("Engage drawer")}>
          <svg className="ico" viewBox="0 0 24 24">
            <path d="M12 21s-7-4.4-7-9a4 4 0 017-2 4 4 0 017 2c0 4.6-7 9-7 9z" fill="none" stroke="currentColor" strokeWidth="2"/>
          </svg>
        </button>
        <button className="nav-item" title="Comment" onClick={() => alert("Comments drawer")}>
          <svg className="ico" viewBox="0 0 24 24">
            <path d="M3 5h18v11H8l-5 3V5z" fill="none" stroke="currentColor" strokeWidth="2"/>
          </svg>
        </button>
        <button className="nav-item" title="Remix" onClick={() => alert("Remix (hook API)")}>
          <svg className="ico" viewBox="0 0 24 24">
            <path d="M7 7h10v4H7zm0 6h6v4H7z" fill="none" stroke="currentColor" strokeWidth="2"/>
          </svg>
        </button>
        <button className="nav-item" title="Enter Universe" onClick={() => onPortal?.()}>
          <svg className="ico" viewBox="0 0 24 24">
            <path d="M12 2v20M2 12h20" fill="none" stroke="currentColor" strokeWidth="2"/>
          </svg>
        </button>
      </nav>
    </>
  );
}
