import "./Shell.css";

export default function Shell() {
  // In the future, this button can open a navigation drawer
  // For now, it's a beautiful, animated UI element.
  return (
    <button className="shell-fab-top-left" aria-label="Open Menu">
      <div className="shell-fab-ring" />
      <div className="shell-fab-glowing-core" />
      <img src="/avatar.jpg" alt="User Profile" className="shell-fab-avatar" />
    </button>
  );
}
