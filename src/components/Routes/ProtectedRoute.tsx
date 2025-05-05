import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import PageLayout from '../PageLayout';
import { UserRole } from '../../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  allowedRoles = [] 
}) => {
  const { currentUser, userProfile, loading } = useAuth();

  // Show loading spinner while authentication state is being determined
  if (loading || userProfile === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // If not logged in, redirect to login
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // If no user profile found in Firestore
  if (!userProfile) {
    return <Navigate to="/login" replace />;
  }

  // If user is not approved
  if (!userProfile.approved) {
    return <Navigate to="/approval-waiting" replace />;
  }

  // If allowedRoles is specified, check if the user's role is included
  if (allowedRoles.length > 0 && !allowedRoles.includes(userProfile.role)) {
    // Redirect based on role
    switch (userProfile.role) {
      case 'student':
        return <Navigate to="/student-dashboard" replace />;
      case 'teacher':
        return <Navigate to="/teacher-dashboard" replace />;
      case 'admin':
        return <Navigate to="/admin-dashboard" replace />;
      default:
        return <Navigate to="/login" replace />;
    }
  }

  // User is authenticated and authorized
  return <PageLayout>{children}</PageLayout>;
};

export default ProtectedRoute;
