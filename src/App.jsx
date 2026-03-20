import { useEffect, useState, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { useUIStore } from './store/uiStore';
import { useWidgetStore } from './store/widgetStore';
import { useProfileStore } from './store/profileStore';
import { useGamificationStore } from './store/gamificationStore';
import XPToastManager from './components/gamification/XPToast';
import { checkIsAdmin } from './services/admin';
import AppLayout from './layout/AppLayout';
import ProtectedRoute from './layout/ProtectedRoute';
import Dashboard from './components/Dashboard';
import ErrorBoundary from './components/ErrorBoundary';
import UsernameModal from './components/UsernameModal';
import LoadingScreen from './components/LoadingScreen';

// Non-critical pages — code-split so authenticated dashboard users never
// download bundles they won't visit.
const LandingPage    = lazy(() => import('./components/LandingPage'));
const Login          = lazy(() => import('./components/Login'));
const Signup         = lazy(() => import('./components/Signup'));
const TermsPage      = lazy(() => import('./components/TermsPage'));
const PrivacyPage    = lazy(() => import('./components/PrivacyPage'));
const ChangelogPage  = lazy(() => import('./components/ChangelogPage'));
const AdminPage      = lazy(() => import('./components/AdminPage'));
const NotFoundPage   = lazy(() => import('./components/NotFoundPage'));

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

function applyDarkMode(darkMode) {
  document.documentElement.classList.toggle('dark', darkMode);
  const themeColor = darkMode ? '#030712' : '#f9fafb';
  document.querySelectorAll('meta[name="theme-color"]').forEach((el) => {
    el.setAttribute('content', themeColor);
  });
  document.documentElement.style.backgroundColor = themeColor;
}

// Syncs dark mode class to <html> globally for all routes
function DarkModeSync() {
  const darkMode = useUIStore((s) => s.darkMode);
  useEffect(() => { applyDarkMode(darkMode); }, [darkMode]);
  return null;
}

function DemoShell() {
  const { enterDemo, exitDemo } = useUIStore();
  const setDemoLayout = useWidgetStore((s) => s.setDemoLayout);

  useEffect(() => {
    enterDemo();
    setDemoLayout();
    return () => exitDemo();
  }, [enterDemo, exitDemo, setDemoLayout]);

  return (
    <AppLayout>
      <Dashboard />
    </AppLayout>
  );
}

function AppShell() {
  const user = useAuthStore((s) => s.user);
  const { fetchProfile, profile } = useProfileStore();
  const { showUsernameModal, setShowUsernameModal } = useUIStore();
  const { load: loadGamification, reset: resetGamification } = useGamificationStore();

  useEffect(() => {
    if (user) {
      fetchProfile(user.id);
      loadGamification(user.id);
    } else {
      resetGamification();
    }
  }, [user, fetchProfile, loadGamification, resetGamification]);

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

// Renders AdminPage for admins, NotFoundPage for everyone else.
// /admin is indistinguishable from any unknown URL to non-admins.
function AdminGate() {
  const [status, setStatus] = useState(null); // null=loading, true=admin, false=not
  useEffect(() => {
    checkIsAdmin().then(setStatus).catch(() => setStatus(false));
  }, []);
  if (status === null) return <div className="min-h-screen bg-gray-50 dark:bg-gray-950" />;
  if (status) return <AdminPage />;
  return <NotFoundPage />;
}

export default function App() {
  const initialize = useAuthStore((s) => s.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <BrowserRouter>
      <DarkModeSync />
      <ScrollToTop />
      <XPToastManager />
      <ErrorBoundary>
        <Suspense fallback={<LoadingScreen />}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/app" element={<AppShell />} />
            <Route path="/demo" element={<DemoShell />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/changelog" element={<ChangelogPage />} />
            <Route path="/admin" element={<AdminGate />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </BrowserRouter>
  );
}
