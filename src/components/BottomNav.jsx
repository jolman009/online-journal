import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function BottomNav() {
  const { session } = useAuth();

  return (
    <nav className="bottom-nav">
      <NavLink
        to="/"
        className={({ isActive }) => `bottom-nav__item${isActive ? ' bottom-nav__item--active' : ''}`}
        end
      >
        <span className="bottom-nav__icon">🏠</span>
        <span className="bottom-nav__label">{session ? 'Dashboard' : 'Home'}</span>
      </NavLink>
      <NavLink
        to="/journal"
        className={({ isActive }) => `bottom-nav__item${isActive ? ' bottom-nav__item--active' : ''}`}
      >
        <span className="bottom-nav__icon">📓</span>
        <span className="bottom-nav__label">Journal</span>
      </NavLink>
      <NavLink
        to="/calendar"
        className={({ isActive }) => `bottom-nav__item${isActive ? ' bottom-nav__item--active' : ''}`}
      >
        <span className="bottom-nav__icon">📅</span>
        <span className="bottom-nav__label">Calendar</span>
      </NavLink>
      <NavLink
        to="/todos"
        className={({ isActive }) => `bottom-nav__item${isActive ? ' bottom-nav__item--active' : ''}`}
      >
        <span className="bottom-nav__icon">✓</span>
        <span className="bottom-nav__label">Todos</span>
      </NavLink>
      <NavLink
        to="/review"
        className={({ isActive }) => `bottom-nav__item${isActive ? ' bottom-nav__item--active' : ''}`}
      >
        <span className="bottom-nav__icon">📊</span>
        <span className="bottom-nav__label">Review</span>
      </NavLink>
    </nav>
  );
}
