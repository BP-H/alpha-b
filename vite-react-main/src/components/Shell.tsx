// src/components/Shell.tsx
import "./Shell.css";

export default function Shell() {
  return (
    <>
      {/* Top Bar */}
      <header className="topbar" role="banner">
        <button className="icon-btn profile" aria-label="Profile">
          <img src="/avatar.jpg" alt="" />
        </button>

        <div className="search-wrap">
          <svg viewBox="0 0 24 24" aria-hidden="true" className="ico">
            <path d="M15.5 15.5L21 21" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"/>
            <circle cx="10" cy="10" r="6" stroke="currentColor" strokeWidth="2" fill="none"/>
          </svg>
          <input placeholder="Search" aria-label="Search" />
        </div>

        <div className="actions">
          <button className="icon-btn" aria-label="Create">
            <svg className="ico" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="square"/></svg>
          </button>
          <button className="icon-btn" aria-label="Messages">
            <svg className="ico" viewBox="0 0 24 24"><path d="M3 5h18v11H8l-5 3V5z" stroke="currentColor" strokeWidth="2" fill="none" strokeLinejoin="miter"/></svg>
          </button>
          <button className="icon-btn" aria-label="Notifications">
            <svg className="ico" viewBox="0 0 24 24"><path d="M6 9a6 6 0 1112 0v5h3v2H3v-2h3V9zM10 20h4" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="square"/></svg>
          </button>
        </div>
      </header>

      {/* Bottom Bar (mobile-first) */}
      <nav className="bottombar" role="navigation">
        <button className="icon-btn" aria-label="Home">
          <svg className="ico" viewBox="0 0 24 24"><path d="M3 11l9-7 9 7v9H3z" stroke="currentColor" strokeWidth="2" fill="none" strokeLinejoin="miter"/></svg>
        </button>
        <button className="icon-btn" aria-label="Video">
          <svg className="ico" viewBox="0 0 24 24"><path d="M3 7h13v10H3zM16 12l5-3v6z" stroke="currentColor" strokeWidth="2" fill="none"/></svg>
        </button>
        <button className="icon-btn" aria-label="Network">
          <svg className="ico" viewBox="0 0 24 24"><path d="M12 3v6m0 6v6M3 12h6m6 0h6" stroke="currentColor" strokeWidth="2" fill="none"/></svg>
        </button>
        <button className="icon-btn" aria-label="Notifications">
          <svg className="ico" viewBox="0 0 24 24"><path d="M6 9a6 6 0 1112 0v5h3v2H3v-2h3V9zM10 20h4" stroke="currentColor" strokeWidth="2" fill="none"/></svg>
        </button>
        <button className="icon-btn" aria-label="Jobs">
          <svg className="ico" viewBox="0 0 24 24"><path d="M3 7h18v12H3zM9 7V5h6v2" stroke="currentColor" strokeWidth="2" fill="none"/></svg>
        </button>
      </nav>
    </>
  );
}
