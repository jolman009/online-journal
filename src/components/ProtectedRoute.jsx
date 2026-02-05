import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { session, loading } = useAuth();

  if (loading) {
    return <div className="shell"><p className="muted">Loading...</p></div>;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
