// src/App.tsx
import Shell from "./components/Shell";
import ChatDock from "./components/ChatDock";

export default function App() {
  // NOTE: Shell's onPortal prop is optional (safe default).
  return (
    <>
      <Shell />
      <ChatDock />
    </>
  );
}
