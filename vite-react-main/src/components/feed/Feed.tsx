import { Post, User } from "../../types";
import PostCard from "../PostCard";
import "./Feed.css";

type Props = { posts: Post[]; me: User; onOpenProfile?: (id: string) => void; onEnterWorld: () => void };

export default function Feed({ posts, me, onOpenProfile, onEnterWorld }: Props) {
  return (
    <div className="content-viewport feed-wrap">
      <div className="feed-content">
        {posts.map((p) => (
          <PostCard key={p.id} post={p} me={me} onOpenProfile={onOpenProfile} onEnterWorld={onEnterWorld} />
        ))}
      </div>
    </div>
  );
}
