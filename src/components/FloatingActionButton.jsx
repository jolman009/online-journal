import { Link } from 'react-router-dom';

export default function FloatingActionButton({ to, label = 'Add', icon = '+' }) {
  return (
    <Link to={to} className="fab" aria-label={label}>
      <span className="fab__icon">{icon}</span>
    </Link>
  );
}
