import { useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Post, User } from "../../types";
import PostCard from "../PostCard";
import { usePaginatedPosts } from "../../lib/feedStore";
import "./Feed.css";

type Props = {
  me: User;
  onOpenProfile?: (id: string) => void;
  onEnterWorld: () => void;
};

const PAGE_SIZE = 50;

export default function Feed({ me, onOpenProfile, onEnterWorld }: Props) {
  const [page] = useState(0);
  const posts = usePaginatedPosts(page, PAGE_SIZE);
  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: posts.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 500,
    measureElement: (el) => el.getBoundingClientRect().height,
    overscan: 5,
  });

  return (
    <div ref={parentRef} className="content-viewport feed-wrap">
      <div
        className="feed-content"
        style={{ height: rowVirtualizer.getTotalSize(), position: "relative" }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const post = posts[virtualRow.index] as Post;
          return (
            <div
              key={post.id}
              data-index={virtualRow.index}
              ref={rowVirtualizer.measureElement}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                transform: `translateY(${virtualRow.start}px)`,
                paddingBottom: "var(--post-gap)",
              }}
            >
              <PostCard
                post={post}
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
