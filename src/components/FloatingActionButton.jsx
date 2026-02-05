import { Link } from 'react-router-dom';

export default function FloatingActionButton({ to, onClick, label = 'Add', icon = '+' }) {
  // If onClick is provided, render a button; otherwise render a Link
  if (onClick) {
    return (
      <button type="button" className="fab" aria-label={label} onClick={onClick}>
        <span className="fab__icon">{icon}</span>
      </button>
    );
  }

  return (
    <Link to={to} className="fab" aria-label={label}>
      <span className="fab__icon">{icon}</span>
    </Link>
  );
}
