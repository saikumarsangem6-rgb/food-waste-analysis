import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './pages/auth/LoginPage';
import InchargeDashboard from './pages/incharge/Dashboard';
import DailyReportsPage from './pages/incharge/DailyReportsPage';
import ReviewsPage from './pages/incharge/ReviewsPage';
import MenuManagementPage from './pages/incharge/MenuManagementPage';
import WasteAnalysis from './pages/incharge/WasteAnalysis';
import StudentHome from './pages/student/Home';
import ReviewPage from './pages/student/Review';
import HelpPage from './pages/student/Help';
import ProfilePage from './pages/student/Profile';

const ProtectedRoute = ({ children, role }: { children: React.ReactNode, role?: string }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (role && user.role !== role) return <Navigate to="/" />;
  return <>{children}</>;
};

const RootRedirect = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  return user.role === 'incharge' ? <Navigate to="/incharge/dashboard" /> : <Navigate to="/student/home" />;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          
          <Route path="/incharge/*" element={
            <ProtectedRoute role="incharge">
              <Routes>
                <Route path="dashboard" element={<InchargeDashboard />} />
                <Route path="reports" element={<DailyReportsPage />} />
                <Route path="reviews" element={<ReviewsPage />} />
                <Route path="menu" element={<MenuManagementPage />} />
                <Route path="analysis" element={<WasteAnalysis />} />
              </Routes>
            </ProtectedRoute>
          } />

          <Route path="/student/*" element={
            <ProtectedRoute role="student">
              <Routes>
                <Route path="home" element={<StudentHome />} />
                <Route path="review" element={<ReviewPage />} />
                <Route path="help" element={<HelpPage />} />
                <Route path="profile" element={<ProfilePage />} />
              </Routes>
            </ProtectedRoute>
          } />

          <Route path="/" element={<RootRedirect />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
