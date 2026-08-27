import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { getCurrentUser } from '../lib/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
      navigate('/');
    }
  }, [currentUser, allowedRoles, navigate]);

  if (!currentUser) {
    return null;
  }

  if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
    return null;
  }

  return <>{children}</>;
}
