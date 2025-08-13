import { useEffect, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Post, User } from "../../types";
import PostCard from "../PostCard";
import "./Feed.css";

type Props = {
  posts: Post[];
  me: User;
  onOpenProfile?: (id: string) => void;
  onEnterWorld: () => void;
};

export default function Feed({ posts, me, onOpenProfile, onEnterWorld }: Props) {
  const parentRef = useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({
    count: posts.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 500,
    overscan: 5,
  });

  const [showNew, setShowNew] = useState(false);

  useEffect(() => {
    if (parentRef.current && parentRef.current.scrollTop > 0) {
      setShowNew(true);
    }
  }, [posts.length]);

  const handleScroll = () => {
    if (parentRef.current?.scrollTop === 0) {
      setShowNew(false);
    }
  };

  const scrollToTop = () => {
    rowVirtualizer.scrollToIndex(0);
    setShowNew(false);
  };

  return (
    <div className="content-viewport feed-wrap" ref={parentRef} onScroll={handleScroll}>
      {showNew && (
        <button className="new-posts-btn" onClick={scrollToTop}>
          New posts
        </button>
      )}
      <div
        className="feed-content"
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          position: "relative",
          width: "100%",
          display: "block",
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const p = posts[virtualRow.index];
          return (
            <div
              key={p.id}
              ref={rowVirtualizer.measureElement}
              data-index={virtualRow.index}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                transform: `translateY(${virtualRow.start}px)`,
                marginBottom: "var(--post-gap)",
              }}
            >
              <PostCard
                post={p}
                me={me}
                onOpenProfile={onOpenProfile}
                onEnterWorld={onEnterWorld}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
