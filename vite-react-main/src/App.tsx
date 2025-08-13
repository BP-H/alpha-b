// src/App.tsx
import { lazy, Suspense, useCallback, useState } from "react";
import "./styles.css";
import Shell from "./components/Shell";
import AssistantOrb from "./components/AssistantOrb";
import Feed from "./components/feed/Feed";
import { Post } from "./types";
import ChatDock from "./components/ChatDock";

// Lazy-loaded 3D components for performance
const BackgroundVoid = lazy(() => import("./three/BackgroundVoid"));
const World3D = lazy(() => import("./components/World3D"));

/**
 * A default post object to use when entering a world from a non-post source,
 * like the Assistant Orb.
 */
const defaultWorldPost: Post = {
  id: "nexus-world",
  title: "Nexus",
  author: "System",
  image: "/images/default_world.jpg", // A generic fallback image
};

/**
 * The main application component. It orchestrates the entire UI,
 * managing the state between the 2D feed and the 3D world view.
 */
export default function App() {
  // State to toggle between the 'feed' and the immersive 'world' view
  const [mode, setMode] = useState<"feed" | "world">("feed");
  // State to hold the data of the post that the user wants to enter
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  /**
   * Callback function to transition from the feed to the 3D world.
   * This will be passed down to the Feed component.
   */
  const enterWorld = useCallback((post: Post) => {
    console.log("Entering world for post:", post.title);
    setSelectedPost(post);
    setMode("world");
  }, []);

  /**
   * Callback function to transition from the 3D world back to the feed.
   */
  const leaveWorld = useCallback(() => {
    console.log("Leaving world and returning to feed.");
    setSelectedPost(null);
    setMode("feed");
  }, []);

  return (
    <div className="app-container">
      {/* Layer 1: The 3D background, which is always rendered */}
      <Suspense fallback={null}>
        <div className="background-canvas">
          <BackgroundVoid />
        </div>
      </Suspense>

      {/* Layer 2: The main content, which is either the Feed or the 3D World */}
      <div className="main-content-layer">
        {mode === "feed" ? (
          <Feed onPortal={enterWorld} />
        ) : (
          <Suspense fallback={<div className="loading-placeholder">Loading World...</div>}>
            <World3D selected={selectedPost} onBack={leaveWorld} />
          </Suspense>
        )}
      </div>

      {/* Layer 3: Floating UI elements that render on top of everything */}
      {mode === "feed" && (
        <>
          <Shell />
          {/* CORRECTED: The 'onPortal' prop is now provided to AssistantOrb */}
          <AssistantOrb onPortal={() => enterWorld(defaultWorldPost)} />
          <ChatDock />
        </>
      )}
    </div>
  );
}
