import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { useUIStore } from './store/uiStore';
import { useProfileStore } from './store/profileStore';
import LandingPage from './components/LandingPage';
import Login from './components/Login';
import Signup from './components/Signup';
import AppLayout from './layout/AppLayout';
import ProtectedRoute from './layout/ProtectedRoute';
import Dashboard from './components/Dashboard';
import UsernameModal from './components/UsernameModal';

function AppShell() {
  const user = useAuthStore((s) => s.user);
  const { fetchProfile, profile } = useProfileStore();
  const { showUsernameModal, setShowUsernameModal } = useUIStore();

  useEffect(() => {
    if (user) fetchProfile(user.id);
  }, [user, fetchProfile]);

  // Show modal when profile is loaded and username is missing
  useEffect(() => {
    if (profile !== undefined && profile !== null && !profile.username) {
      setShowUsernameModal(true);
    }
    if (profile === null) {
      // no row at all — first time user
      setShowUsernameModal(true);
    }
  }, [profile, setShowUsernameModal]);

  return (
    <ProtectedRoute>
      <AppLayout>
        <Dashboard />
      </AppLayout>
      {showUsernameModal && <UsernameModal />}
    </ProtectedRoute>
  );
}

export default function App() {
  const initialize = useAuthStore((s) => s.initialize);
  const darkMode = useUIStore((s) => s.darkMode);

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    const themeColor = darkMode ? '#0f172a' : '#f9fafb';
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', themeColor);
  }, [darkMode]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/app" element={<AppShell />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
