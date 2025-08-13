import { useCallback, useState } from "react";
import Shell from "./components/Shell";
import World3D from "./components/World3D";
import type { Post } from "./types";

export default function App() {
  // Which post (if any) we’re “entering”
  const [selected, setSelected] = useState<Post | null>(null);
  const [showWorld, setShowWorld] = useState(false);

  // Called by Shell/Feed when the user taps “Enter”
  const handlePortal = useCallback((post?: Post) => {
    if (post) setSelected(post);
    setShowWorld(true);
  }, []);

  // Back out of the world
  const handleBack = useCallback(() => {
    setShowWorld(false);
    setSelected(null);
  }, []);

  return (
    <>
      {/* Mount 3D world only when needed */}
      {showWorld && <World3D selected={selected} onBack={handleBack} />}

      {/* Main UX shell (feed, frosted bars, bottom nav, floating orb, etc.) */}
      <Shell onPortal={handlePortal} />
    </>
  );
}
