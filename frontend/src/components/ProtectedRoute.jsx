import React from 'react';
import { Navigate } from 'react-router-dom';
import { hasRoleAccess } from '../services/demoAuth';

/**
 * Route Guard enforcing Role-Based Access Control.
 * If VITE_ENABLE_DEMO_MODE is false, any manually injected demo keys are ignored.
 */
export default function ProtectedRoute({ requiredRole, children }) {
  const isAllowed = hasRoleAccess(requiredRole);

  if (!isAllowed) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}
