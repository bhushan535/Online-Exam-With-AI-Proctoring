import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  // Show loading while checking auth
  if (loading) {
    return <div>Loading...</div>;
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check role if allowedRoles specified
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  // Render children if authorized
  return children;
};

export default ProtectedRoute;
