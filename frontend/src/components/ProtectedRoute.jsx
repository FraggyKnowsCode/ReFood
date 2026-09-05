import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../AuthContext';

const ProtectedRoute = () => {
  const { user } = useAuth();

  if (!user) {
    // Redirect to login if not authenticated
    return <Navigate to="/login" replace />;
  }

  // Optionally, you can check user roles/claims here 
  // if you store `is_admin` in custom claims or user metadata

  return <Outlet />;
};

export default ProtectedRoute;
