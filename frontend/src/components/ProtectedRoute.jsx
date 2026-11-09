import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LoadingState } from './UI';

export default function ProtectedRoute() {
  const { user, loading } = useAuth();
  if (loading) return <div className="auth-loading"><LoadingState label="Preparing your workspace…"/></div>;
  return user ? <Outlet/> : <Navigate to="/login" replace/>;
}
