import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const { session, signOut } = useAuth();

  return (
    <>
      <header className="site-header">
        <div className="brand">
          <span className="logo-dot" aria-hidden="true"></span>
          <h1>My Online Journal</h1>
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
          </ul>
        </nav>
      </header>
      <main className="shell">
        <Outlet />
      </main>
      <footer>
        <p>&copy; 2026 My Online Journal</p>
      </footer>
    </>
  );
}
