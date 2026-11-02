import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from '../pages/public/LandingPage';
import LoginPage from '../pages/public/LoginPage';
import DemoCredentialsPage from '../pages/public/DemoCredentialsPage';

import CampusDashboard from '../pages/institution/CampusDashboard';
import MentorDashboard from '../pages/institution/MentorDashboard';
import PlacementDashboard from '../pages/institution/PlacementDashboard';
import StudentDashboard from '../pages/student/StudentDashboard';
import NotFoundPage from '../pages/NotFoundPage';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

function getRoleRedirect(role) {
  if (role === 'student') return '/student/dashboard';
  if (role === 'mentor') return '/mentor/dashboard';
  if (role === 'tpo') return '/placement/dashboard';
  return '/institution/dashboard';
}

/**
 * Route protection wrapper enforcing authentication and role-based permissions.
 */
function ProtectedRoute({ children, allowedRoles }) {
  const { currentUser, isAuthenticated, isInitialChecking } = useAuth();

  if (isInitialChecking) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0F172A', color: '#94A3B8' }}>
        <Loader2 size={32} className="animate-spin" style={{ color: '#3B82F6' }} />
      </div>
    );
  }

  const user = currentUser || (() => {
    try {
      const stored = sessionStorage.getItem('codebuffet_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  })();

  if (!isAuthenticated && !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to={getRoleRedirect(user.role)} replace />;
  }

  return children;
}

/**
 * Root router component: displays Login by default to unauthenticated visitors;
 * redirects authenticated users to their authorized dashboard.
 */
function RootIndexRoute() {
  const { currentUser, isAuthenticated, isInitialChecking } = useAuth();

  if (isInitialChecking) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0F172A', color: '#94A3B8' }}>
        <Loader2 size={32} className="animate-spin" style={{ color: '#3B82F6' }} />
      </div>
    );
  }

  const user = currentUser || (() => {
    try {
      const stored = sessionStorage.getItem('codebuffet_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  })();

  if (isAuthenticated && user?.role) {
    return <Navigate to={getRoleRedirect(user.role)} replace />;
  }

  return <LandingPage />;
}

export default function AppRoutes() {
  return (
    <Routes>
      {/* Root Route: Shows LandingPage for visitors; redirects to role dashboard if authenticated */}
      <Route path="/" element={<RootIndexRoute />} />
      <Route path="/platform" element={<LandingPage />} />
      <Route path="/demo-credentials" element={<DemoCredentialsPage />} />
      <Route path="/credentials" element={<Navigate to="/demo-credentials" replace />} />
      <Route path="/demo-portals" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<Navigate to="/login" replace />} />

      {/* Admin Institution Analytics Portal */}
      <Route
        path="/institution/dashboard"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <CampusDashboard />
          </ProtectedRoute>
        }
      />

      {/* Faculty Mentor Portal */}
      <Route
        path="/mentor/dashboard"
        element={
          <ProtectedRoute allowedRoles={['mentor', 'admin']}>
            <MentorDashboard />
          </ProtectedRoute>
        }
      />
      <Route path="/mentor/*" element={<Navigate to="/mentor/dashboard" replace />} />

      {/* Placement Officer Portal */}
      <Route
        path="/placement/dashboard"
        element={
          <ProtectedRoute allowedRoles={['tpo', 'admin']}>
            <PlacementDashboard />
          </ProtectedRoute>
        }
      />

      {/* Student Personal Cockpit */}
      <Route
        path="/student/dashboard"
        element={
          <ProtectedRoute allowedRoles={['student', 'admin', 'mentor', 'tpo']}>
            <StudentDashboard />
          </ProtectedRoute>
        }
      />

      {/* Catch-all 404 Route */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
