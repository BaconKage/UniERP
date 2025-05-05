import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';

// Auth Pages
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import ApprovalWaiting from './pages/Auth/ApprovalWaiting';

// Dashboard Pages
import StudentDashboard from './pages/Student/StudentDashboard';
import TeacherDashboard from './pages/Teacher/TeacherDashboard';
import AdminDashboard from './pages/Admin/AdminDashboard';
import Analytics from './pages/Admin/Analytics';
import UserManagement from './pages/Admin/UserManagement';
import AchievementsManagement from './pages/Admin/AchievementsManagement';
import MedicalCertificatesManagement from './pages/Admin/MedicalCertificatesManagement';

// Teacher Management Pages
import GradeManagement from './pages/Teacher/GradeManagement';
import AttendanceManagement from './pages/Teacher/AttendanceManagement';
import AnnouncementManagement from './pages/Teacher/AnnouncementManagement';
import AchievementReview from './pages/Teacher/AchievementReview';
import MedicalCertificateReview from './pages/Teacher/MedicalCertificateReview';
import StudentRecords from './pages/Teacher/StudentRecords';

// Student Pages
import Achievements from './pages/Student/Achievements';
import Announcements from './pages/Student/Announcements';
import Grades from './pages/Student/Grades';
import Attendance from './pages/Student/Attendance';
import MedicalCertificates from './pages/Student/MedicalCertificates';

// Protected Route Component
import ProtectedRoute from './components/Routes/ProtectedRoute';

// Root redirect component
const RootRedirect = () => {
  const { currentUser, userProfile, loading } = useAuth();

  if (loading) return null;

  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  if (!userProfile?.approved) {
    return <Navigate to="/approval-waiting" />;
  }

  switch (userProfile.role) {
    case 'student':
      return <Navigate to="/student-dashboard" />;
    case 'teacher':
      return <Navigate to="/teacher-dashboard" />;
    case 'admin':
      return <Navigate to="/admin-dashboard" />;
    default:
      return <Navigate to="/login" />;
  }
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              style: {
                background: '#22c55e',
                color: '#fff',
              },
            },
            error: {
              duration: 4000,
              style: {
                background: '#ef4444',
                color: '#fff',
              },
            },
          }}
        />
        <Routes>
          {/* Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/approval-waiting" element={<ApprovalWaiting />} />

          {/* Student Routes */}
          <Route
            path="/student-dashboard"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <StudentDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/achievements"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <Achievements />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/announcements"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <Announcements />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/grades"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <Grades />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/attendance"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <Attendance />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/medical-certificates"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <MedicalCertificates />
              </ProtectedRoute>
            }
          />

          {/* Teacher Routes - Also accessible by admins */}
          <Route
            path="/teacher-dashboard"
            element={
              <ProtectedRoute allowedRoles={['teacher', 'admin']}>
                <TeacherDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/student-records"
            element={
              <ProtectedRoute allowedRoles={['teacher', 'admin']}>
                <StudentRecords />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/grades"
            element={
              <ProtectedRoute allowedRoles={['teacher', 'admin']}>
                <GradeManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/attendance"
            element={
              <ProtectedRoute allowedRoles={['teacher', 'admin']}>
                <AttendanceManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/announcements"
            element={
              <ProtectedRoute allowedRoles={['teacher', 'admin']}>
                <AnnouncementManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/achievements"
            element={
              <ProtectedRoute allowedRoles={['teacher', 'admin']}>
                <AchievementReview />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/medical-certificates"
            element={
              <ProtectedRoute allowedRoles={['teacher', 'admin']}>
                <MedicalCertificateReview />
              </ProtectedRoute>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin-dashboard"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/analytics"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Analytics />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <UserManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/achievements"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AchievementsManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/medical-certificates"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <MedicalCertificatesManagement />
              </ProtectedRoute>
            }
          />

          {/* Root Route */}
          <Route path="/" element={<RootRedirect />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;