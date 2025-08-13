import { Post, User } from "../../types";
import PostCard from "../PostCard";
import "./Feed.css";

type Props = { posts: Post[]; me: User; onOpenProfile?: (id: string) => void };

export default function Feed({ posts, me, onOpenProfile }: Props) {
  return (
    <div className="content-viewport feed-wrap">
      <div className="feed-content">
        {posts.map((p) => (
          <PostCard key={p.id} post={p as Post} me={me as User} onOpenProfile={onOpenProfile} />
        ))}
      </div>
    </div>
  );
}
