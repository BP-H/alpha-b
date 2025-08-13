 import { useState } from "react";
 import { Post } from "../../types";
 import "./Feed.css";

 // Sample post data (replace with your actual data fetching)
 const posts: Post[] = [
  {
   id: 1,
   author: "@eva",
   avatar: "/avatars/eva.png",
   title: "Neon Dreams",
   image: "https://images.unsplash.com/photo-1534488972529-a1b2eda4e893?q=80&w=1887&auto=format&fit=crop",
  },
  {
   id: 2,
   author: "@proto_ai",
   avatar: "/avatars/proto.png",
   title: "Cloud Architecture",
   image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=1200&auto=format&fit=crop",
  },
  {
   id: 3,
   author: "@forest_bot",
   avatar: "/avatars/forest.png",
   title: "Alpine Ascent",
   image: "https://images.unsplash.com/photo-1454391304352-2bf4678b1a7a?q=80&w=1200&auto=format&fit=crop",
  },
 ];

 export default function Feed({ onPortal }: { onPortal?: (p: Post, at?: { x: number; y: number }) => void }) {
  return (
   <div className="feed-container">
    <main className="feed-content">
     {posts.map((post) => (
      <PostCard key={post.id} post={post} onPortal={onPortal} />
     ))}
    </main>
   </div>
  );
 }

 function PostCard({ post, onPortal }: { post: Post; onPortal?: any }) {
  const [drawer, setDrawer] = useState<string>("");
  const reactions = ["😍", "🔥", "✨", "🚀", "💎", "🌟", "💜", "🎯", "⚡", "🌈"];

  return (
   <article className="post">
    <div className="post-bar top">
     <div className="post-author-avatar" style={{ backgroundImage: `url(${post.avatar})` }} />
     <div className="post-meta">
      <div className="post-author">{post.author}</div>
      <div className="post-time">now · #superNova</div>
     </div>
     <div className="post-title-chip">{post.title}</div>
    </div>

    <div className="post-image-container">
     <img src={post.image} alt={post.title} loading="lazy" />
    </div>

    <div className="post-bar bottom">
     <button className="post-action-btn" onClick={() => setDrawer(drawer === "react" ? "" : "react")}>♥</button>
     <button className="post-action-btn" onClick={() => setDrawer(drawer === "comment" ? "" : "comment")}>💬</button>
     <button className="post-action-btn" onClick={() => setDrawer(drawer === "remix" ? "" : "remix")}>🔄</button>
     <button className="post-action-btn primary" onClick={(e: any) => {
      const rect = e.currentTarget.getBoundingClientRect();
      onPortal?.(post, { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
     }}>
      ✦
     </button>
    </div>

    <div className={`post-drawer ${drawer ? 'open' : ''}`}>
     {drawer === "react" && (
      <div className="drawer-content emoji-grid">
       {reactions.map((emoji) => <button key={emoji} className="emoji-btn">{emoji}</button>)}
      </div>
     )}
     {drawer === "comment" && (
      <div className="drawer-content">
       <input className="comment-input" placeholder="Add a comment..." autoFocus />
      </div>
     )}
     {drawer === "remix" && (
      <div className="drawer-content chip-grid">
       <span>Remix Style</span><span>Copy Link</span><span>Share</span>
      </div>
     )}
    </div>
   </article>
  );
 }
 
