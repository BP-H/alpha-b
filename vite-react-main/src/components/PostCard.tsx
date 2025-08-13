import { useState } from "react";
import { Post, User } from "../types";

type Props = {
  post: Post;
  me: User;
  onOpenProfile?: (userId: string) => void;
  onEnterWorld: () => void;
};

export default function PostCard({ post, me, onOpenProfile, onEnterWorld }: Props) {
  const [openEngage, setOpenEngage] = useState(false);
  const [openComments, setOpenComments] = useState(false);
  const first = post.images[0];

  return (
    <article className="post">
      <div className="post-media">
        {/* image */}
        <div data-asset={first?.url}>
          <img src={first?.url} alt={first?.alt || ""} />
        </div>

        {/* TOP stripe (frosted) */}
        <div className="frost-top">
          <div className="author">
            <div className="avatar-circle" style={{ backgroundImage: `url(${post.authorAvatar})` }} />
            <div className="meta">
              <div className="name">{post.author}</div>
              <div className="time">{post.time}</div>
            </div>
          </div>
          {post.title && <div className="chip">{post.title}</div>}
        </div>

        {/* BOTTOM stripe (frosted) */}
        <div className="frost-bottom">
          <button className="icon-btn" onClick={() => onOpenProfile?.(me.id)} title="Me">
            <div className="me-square" style={{ backgroundImage: `url(${me.avatar})` }} />
          </button>

          <div className="post-actions">
            {/* 1) Engage => drawer */}
            <button className="icon-btn" aria-label="Engage" title="Engage" onClick={() => setOpenEngage((v) => !v)}>
              <svg className="ico" viewBox="0 0 24 24"><path d="M12 21s-7-4.4-7-9a4 4 0 017-2 4 4 0 017 2c0 4.6-7 9-7 9z" fill="none" stroke="currentColor" strokeWidth="2"/></svg>
            </button>
            {/* 2) Comment => drawer */}
            <button className="icon-btn" aria-label="Comment" title="Comment" onClick={() => setOpenComments((v) => !v)}>
              <svg className="ico" viewBox="0 0 24 24"><path d="M3 5h18v11H8l-5 3V5z" fill="none" stroke="currentColor" strokeWidth="2"/></svg>
            </button>
            {/* 3) Remix (stub) */}
            <button className="icon-btn" aria-label="Remix" title="Remix" onClick={() => alert("Remix: hook to your API")}>
              <svg className="ico" viewBox="0 0 24 24"><path d="M7 7h10v4H7zm0 6h6v4H7z" fill="none" stroke="currentColor" strokeWidth="2"/></svg>
            </button>
            {/* 4) Enter Universe => swap to world */}
            <button className="icon-btn" aria-label="Enter" title="Enter Universe" onClick={onEnterWorld}>
              <svg className="ico" viewBox="0 0 24 24"><path d="M12 2v20M2 12h20" fill="none" stroke="currentColor" strokeWidth="2"/></svg>
            </button>
          </div>
        </div>
      </div>

      {/* drawers */}
      <div className={`drawer ${openEngage ? "open" : ""}`}>Engagement drawer (likes/reactions summary…)</div>
      <div className={`drawer ${openComments ? "open" : ""}`}>Comments drawer (tap to type…)</div>
    </article>
  );
}
