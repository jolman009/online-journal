import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import CommandPalette from './CommandPalette';
import BottomNav from './BottomNav';

export default function Layout() {
  const { session, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  useKeyboardShortcuts({
    onOpenCommandPalette: () => setCommandPaletteOpen(true),
    searchInputRef: null,
  });

  return (
    <>
      <header className="site-header">
        <div className="site-header-inner">
          <div className="brand">
            <img src="/logo_lockup_light.png" alt="JotFlow Logo" className="logo" />
            <h1></h1>
          </div>
          <nav>
            <ul>
              <li>
                <NavLink to="/" className={({ isActive }) => isActive ? 'is-active' : ''} end>
                  Home
                </NavLink>
              </li>
              <li>
                <NavLink to="/journal" className={({ isActive }) => isActive ? 'is-active' : ''}>
                  View Journal
                </NavLink>
              </li>
              <li>
                <NavLink to="/calendar" className={({ isActive }) => isActive ? 'is-active' : ''}>
                  Calendar
                </NavLink>
              </li>
              <li>
                <NavLink to="/todos" className={({ isActive }) => isActive ? 'is-active' : ''}>
                  Todos
                </NavLink>
              </li>
              <li>
                <NavLink to="/review" className={({ isActive }) => isActive ? 'is-active' : ''}>
                  Review
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/new-entry"
                  className={({ isActive }) => `pill${isActive ? ' is-active' : ''}`}
                >
                  Add Entry
                </NavLink>
              </li>
              <li>
                <button
                  className="command-palette-trigger"
                  onClick={() => setCommandPaletteOpen(true)}
                  aria-label="Open command palette"
                  title="Command palette (Ctrl+K)"
                >
                  <kbd>Ctrl</kbd><kbd>K</kbd>
                </button>
              </li>
              {session ? (
                <li>
                  <a
                    href="#"
                    onClick={async (e) => {
                      e.preventDefault();
                      await signOut();
                    }}
                  >
                    Sign Out
                  </a>
                </li>
              ) : (
                <li>
                  <NavLink to="/login" className={({ isActive }) => isActive ? 'is-active' : ''}>
                    Sign In
                  </NavLink>
                </li>
              )}
              <li>
                <button
                  className="theme-toggle"
                  onClick={toggleTheme}
                  aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                  title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                >
                  {theme === 'dark' ? '\u2600' : '\uD83C\uDF19'}
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </header>
      <main className="shell">
        <Outlet />
      </main>
      <footer>
        <p>&copy; 2026 JotFlow</p>
        <p className="footer-shortcuts muted">
          <kbd>N</kbd> new entry &middot; <kbd>T</kbd> todos &middot; <kbd>/</kbd> search &middot; <kbd>Ctrl+K</kbd> commands
        </p>
      </footer>
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
      />
      <BottomNav />
    </>
  );
}
