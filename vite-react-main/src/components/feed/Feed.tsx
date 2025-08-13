import { useState } from "react";
import { Post } from "../../types";
import "./Feed.css";

export default function Feed({ onPortal }: { onPortal?: (p: Post, at?: { x: number; y: number }) => void }) {
  const posts: Post[] = [
    { 
      id: 1, 
      author: "@proto_ai", 
      title: "Ocean Study",
      image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=1200&auto=format&fit=crop"
    },
    { 
      id: 2, 
      author: "@eva", 
      title: "Neon Dreams",
      image: "https://images.unsplash.com/photo-1454391304352-2bf4678b1a7a?q=80&w=1200&auto=format&fit=crop"
    },
    {
      id: 3,
      author: "@forest_bot",
      title: "Low-poly Tree",
      image: "https://images.unsplash.com/photo-1519904981063-b0cf448d479e?q=80&w=1200&auto=format&fit=crop"
    }
  ];

  return (
    <div className="feed-stream">
      {posts.map((post, index) => (
        <PostCard key={post.id} post={post} onPortal={onPortal} isFirst={index === 0} />
      ))}
    </div>
  );
}

function PostCard({ post, onPortal, isFirst }: { post: Post; onPortal?: any; isFirst: boolean }) {
  const [drawer, setDrawer] = useState<string>("");

  const reactions = ["😍","🔥","✨","🚀","💎","🌟","💜","🎯","⚡","🌈","🦄","💫","🪐","🌙","☄️","💥","🌊","🏔️","🌸","🦋"];
  
  return (
    <article className={`post ${isFirst ? 'first' : ''}`}>
      {/* Top glass bar - only if not first post */}
      {!isFirst && (
        <div className="post-glass-top">
          <div className="post-avatar-ring">
            <div className="post-avatar" />
          </div>
          <div className="post-meta">
            <div className="post-author">{post.author}</div>
            <div className="post-time">now · #superNova</div>
          </div>
          <div className="post-title-chip">{post.title}</div>
        </div>
      )}

      {/* Vertical image */}
      <div className="post-image">
        <img src={post.image} alt={post.title} loading="lazy" />
      </div>

      {/* Bottom glass bar */}
      <div className="post-glass-bottom">
        <button 
          className="post-action post-profile"
          onClick={() => setDrawer(drawer === "profile" ? "" : "profile")}
        >
          <div className="post-avatar-mini" />
        </button>
        
        <button 
          className="post-action"
          onClick={() => setDrawer(drawer === "react" ? "" : "react")}
        >
          <span className="post-icon">♥</span>
        </button>
        
        <button 
          className="post-action"
          onClick={() => setDrawer(drawer === "comment" ? "" : "comment")}
        >
          <span className="post-icon">💬</span>
        </button>
        
        <button 
          className="post-action"
          onClick={() => setDrawer(drawer === "remix" ? "" : "remix")}
        >
          <span className="post-icon">🔄</span>
        </button>
        
        <button 
          className="post-action post-portal"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            onPortal?.(post, { x: rect.left + rect.width/2, y: rect.top + rect.height/2 });
          }}
        >
          <span className="post-icon">✦</span>
        </button>
      </div>

      {/* Expanding drawer */}
      <div className={`post-drawer ${drawer ? 'open' : ''}`}>
        {drawer === "profile" && (
          <div className="drawer-content">
            <div className="drawer-chips">
              <span>View Profile</span>
              <span>Follow</span>
              <span>Message</span>
              <span>Company A</span>
              <span>Company B</span>
            </div>
          </div>
        )}
        {drawer === "react" && (
          <div className="drawer-content">
            <div className="drawer-emojis">
              {reactions.map((emoji, i) => (
                <button key={i} className="emoji-btn">{emoji}</button>
              ))}
            </div>
          </div>
        )}
        {drawer === "comment" && (
          <div className="drawer-content">
            <input 
              className="comment-input" 
              placeholder="Write a comment..." 
              autoFocus
            />
          </div>
        )}
        {drawer === "remix" && (
          <div className="drawer-content">
            <div className="drawer-chips">
              <span>Remix Style</span>
              <span>Copy Link</span>
              <span>Create Version</span>
              <span>Share to...</span>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
