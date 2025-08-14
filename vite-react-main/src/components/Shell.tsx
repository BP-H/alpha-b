// src/components/Shell.tsx
import AssistantOrb from "./AssistantOrb";
import Feed from "./feed/Feed";
import type { Post, User } from "../types";

export default function Shell({
  onPortal,
  hideOrb = false,
}: {
  onPortal: (post: Post, at: { x: number; y: number }) => void;
  hideOrb?: boolean;
}) {
  // Safe demo "me" (matches common User fields; adjust if you like)
  const me = {
    id: "me",
    handle: "@you",
    name: "You",
    avatarUrl: "",
  } as unknown as User;

  const enterFromFeed = (post: Post) => {
    const x = window.innerWidth / 2;
    const y = window.innerHeight / 2;
    onPortal(post, { x, y });
  };

  return (
    <>
      <main className="content-viewport">
        <div className="feed-wrap">
          <div className="feed-content">
            <Feed me={me} onEnterWorld={() => { /* Feed already emits bus hover; single-portal path via orb */ }} />
          </div>
        </div>
      </main>

      {/* Orb overlays UI; click/hold/drag behavior is in the component */}
      <AssistantOrb onPortal={onPortal} hidden={hideOrb} />
    </>
  );
}

