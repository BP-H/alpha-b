import { Post, User } from "../types";

type Props = {
  post: Post;
  me: User;
  onOpenProfile?: (userId: string) => void;
};

export default function PostCard({ post, me, onOpenProfile }: Props) {
  const klass =
    post.images.length >= 2 ? "post-media two" : "post-media one";

  return (
    <article className="post">
      {/* Header: author avatar (top-left) + meta */}
      <div className="post-head">
        <div
          className="avatar"
          style={{ backgroundImage: `url(${post.authorAvatar})` }}
        />
        <div style={{ minWidth: 0 }}>
          <div className="post-author">{post.author}</div>
          <div className="post-sub">{post.time}</div>
        </div>
        {post.title && (
          <div style={{ marginLeft: "auto" }} className="chip">
            {post.title}
          </div>
        )}
      </div>

      {/* Images: full-bleed grid, with configurable gap */}
      <div className={klass} style={{ padding: "0" }}>
        {post.images.map((img) => (
          <div key={img.id} data-asset={img.url}>
            <img src={img.url} alt={img.alt || ""} />
          </div>
        ))}
      </div>

      {/* Footer: your avatar (bottom-left) + simple icons (no emojis) */}
      <div className="post-foot">
        <button
          className="icon-btn"
          onClick={() => onOpenProfile?.(me.id)}
          title="Me"
        >
          <div
            className="avatar me"
            style={{ backgroundImage: `url(${me.avatar})` }}
          />
        </button>

        <div className="actions">
          <button className="icon-btn" title="Like" aria-label="Like">
            <svg className="ico" viewBox="0 0 24 24">
              <path
                d="M12 21s-7-4.438-7-9a4 4 0 017-2 4 4 0 017 2c0 4.562-7 9-7 9z"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              />
            </svg>
          </button>
          <button className="icon-btn" title="Comment" aria-label="Comment">
            <svg className="ico" viewBox="0 0 24 24">
              <path
                d="M3 5h18v11H8l-5 3V5z"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              />
            </svg>
          </button>
          <button className="icon-btn" title="Send" aria-label="Send">
            <svg className="ico" viewBox="0 0 24 24">
              <path
                d="M3 11l18-8-8 18-2-7-8-3z"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              />
            </svg>
          </button>
        </div>
      </div>
    </article>
  );
}
