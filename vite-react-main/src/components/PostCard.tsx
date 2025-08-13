import { useState } from "react";
import { Post, User } from "../types";

type Props = {
  post: Post;
  me: User;
  onOpenProfile?: (id: string) => void;
  onEnterWorld?: (post: Post) => void;
};

export default function PostCard({ post, me, onOpenProfile, onEnterWorld }: Props) {
  const [open, setOpen] = useState(false);

  const img = post.images?.[0]?.url || post.images?.[0]; // tolerant
  const meBg = { backgroundImage: `url(${me.avatar})` };
  const authorBg = { backgroundImage: `url(${post.authorAvatar})` };

  return (
    <article className="post" aria-label={post.title ?? post.author}>
      {/* Frosted top stripe (author) */}
      <div className="frost frost-top">
        <button
          className="avatar-circle"
          style={authorBg}
          aria-label={`${post.author} profile`}
          onClick={() => onOpenProfile?.(post.id)}
        />
        <div className="author">
          <div className="name">{post.author}</div>
          <div className="time">{post.time}</div>
        </div>
        <span className="chip">Travel</span>
      </div>

      {/* The image itself */}
      <div className="post-media">
        <img src={img} alt={post.title ?? "post"} loading="lazy" decoding="async" />
      </div>

      {/* Frosted bottom stripe (avatar + 4 icons) */}
      <div className="frost frost-bottom">
        <button className="me-circle" aria-label="Me" style={meBg} />
        <div className="actions">
          <button className="icon-btn" aria-label="Like"><IconHeart /></button>
          <button className="icon-btn" aria-label="Comment" onClick={() => setOpen(v => !v)}><IconChat /></button>
          <button className="icon-btn" aria-label="Remix"><IconRemix /></button>
          <button className="icon-btn" aria-label="Enter Universe" onClick={() => onEnterWorld?.(post)}><IconPortal /></button>
        </div>
      </div>

      {/* Drawer (example) */}
      <div className={`drawer ${open ? "open" : ""}`}>
        engagement drawer…
      </div>
    </article>
  );
}

/* Minimal icons — keep them thin and neutral (Apple-ish) */
function IconHeart(){return(<svg className="ico" viewBox="0 0 24 24"><path d="M12 21s-8-4.5-8-10a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 5.5-8 10-8 10z" fill="none" stroke="currentColor" strokeWidth="1.7"/></svg>)}
function IconChat(){return(<svg className="ico" viewBox="0 0 24 24"><path d="M21 12a8 8 0 1 1-3.3-6.5L21 5v7zM8 19l-5 2 2-5" fill="none" stroke="currentColor" strokeWidth="1.7"/></svg>)}
function IconRemix(){return(<svg className="ico" viewBox="0 0 24 24"><path d="M4 8h10v6H4zM9 14v4l4-4" fill="none" stroke="currentColor" strokeWidth="1.7"/></svg>)}
function IconPortal(){return(<svg className="ico" viewBox="0 0 24 24"><path d="M12 2v20M2 12h20" fill="none" stroke="currentColor" strokeWidth="1.7"/></svg>)}
