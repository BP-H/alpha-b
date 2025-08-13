import { useMemo } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Shell from "./components/Shell";
import ProfileWorld from "./components/ProfileWorld";
import type { Post, User } from "./types";

const IMG = (id: number) => `https://picsum.photos/id/${id}/1080/1350`;
const SEED = [
  1015,1069,1025,1027,1043,1050,106,237,1005,1003,1002,1001,
  1021,1024,1032,1035,1037,1040,1041,1042,1044,1045,1049,1051,
  1055,1056,1059,1063,1067,1070,
];

export default function App() {
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

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Shell posts={posts} me={me} />} />
        <Route path="/profile/:id" element={<ProfileWorld posts={posts} me={me} />} />
      </Routes>
    </BrowserRouter>
  );
}
