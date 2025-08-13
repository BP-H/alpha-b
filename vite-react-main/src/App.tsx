import { useState } from "react";
import Feed from "./components/Feed";
import Modal from "./components/Modal";
import PortalOrb from "./components/PortalOrb";
import { Post, User } from "./types";
import { avatar, photo } from "./lib/placeholders";

const me: User = {
  id: "me",
  name: "You",
  avatar: avatar("You"),
};

const seedPosts: Post[] = [
  {
    id: "p1",
    author: "Elena R.",
    authorAvatar: avatar("Elena R"),
    title: "Travel",
    subtitle: "Monaco",
    time: "4h · Edited",
    images: [
      { id: "i1", url: photo("AIRPORT • 4:5", 1200, 1500) },
      { id: "i2", url: photo("SEA • 4:5", 1200, 1500) },
    ],
  },
  {
    id: "p2",
    author: "Expanso",
    authorAvatar: avatar("Expanso"),
    title: "Ad",
    subtitle: "Promoted",
    time: "Sponsored",
    images: [{ id: "i1", url: photo("SLOW DATA ANALYSIS • 16:9", 1600, 900) }],
  },
];

export default function App() {
  const [posts] = useState<Post[]>(seedPosts);
  const [modal, setModal] = useState<{ open: boolean; img?: string }>({
    open: false,
  });

  function handleAnalyzeImage(imgUrl: string) {
    setModal({ open: true, img: imgUrl });
  }

  return (
    <>
      <Feed posts={posts} me={me} onOpenProfile={(id) => console.log(id)} />

      <PortalOrb onAnalyzeImage={handleAnalyzeImage} />

      <Modal
        open={modal.open}
        onClose={() => setModal({ open: false })}
        title="Assistant"
      >
        <div style={{ display: "grid", gap: 12 }}>
          <div className="chip">Demo</div>
          <p style={{ margin: 0, color: "var(--ink-2)" }}>
            This is where your AI call would run (OpenAI, etc.). I received the
            image under the orb and would return insights/description/tags.
          </p>
          {modal.img && (
            <div style={{ border: "1px solid var(--stroke-2)" }}>
              <img src={modal.img} alt="Analyzed" />
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}
