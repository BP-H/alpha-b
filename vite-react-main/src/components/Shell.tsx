import { useNavigate } from "react-router-dom";
import "./Shell.css";
import type { Post, User } from "../types";
import BrandBadge from "./BrandBadge";
import PostCard from "./PostCard";
import AssistantOrb from "./AssistantOrb";
import World3D from "./World3D";

type Props = {
  posts: Post[];
  me: User;
};

export default function Shell({ posts, me }: Props) {
  const navigate = useNavigate();

  const onEnterWorld = () => {
    console.log("Enter Universe");
  };

  return (
    <>
      {/* 3D background */}
      <div className="world-layer">
        <World3D selected={null} onBack={() => {}} />
      </div>

      {/* Top-left brand */}
      <BrandBadge onEnterUniverse={onEnterWorld} />

      {/* Feed */}
      <main className="content-viewport feed-wrap">
        <div className="feed-content">
          {posts.map((p: Post) => (
            <PostCard
              key={p.id}
              post={p}
              me={me}
              onOpenProfile={(id) => navigate(`/profile/${id}`)}
              onEnterWorld={onEnterWorld}
            />
          ))}
        </div>
      </main>

      {/* Floating orb (bottom-right) */}
      <AssistantOrb />
    </>
  );
}
