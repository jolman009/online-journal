import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider, useAuth } from './context/AuthContext'; // Import useAuth
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import LoadingSpinner from './components/LoadingSpinner';
import MasterPasswordModal from './components/MasterPasswordModal'; // Import the modal
import PageTransition from './components/PageTransition';
import './styles.css';

// Eagerly loaded pages (critical path)
import Home from './pages/Home';
import Login from './pages/Login';

// Lazy loaded pages (code splitting)
const Journal = lazy(() => import('./pages/Journal'));
const NewEntry = lazy(() => import('./pages/NewEntry'));
const CalendarPage = lazy(() => import('./pages/CalendarPage'));
const Todos = lazy(() => import('./pages/Todos'));
const WeeklyReview = lazy(() => import('./pages/WeeklyReview'));

function SuspenseWrapper({ children }) {
  return (
    <Suspense fallback={<LoadingSpinner message="Loading page..." />}>
      {children}
    </Suspense>
  );
}

// Animated wrapper for pages
function AnimatedPage({ children }) {
  return (
    <PageTransition>
      {children}
    </PageTransition>
  );
}

// Main App component
function AppContent() {
  const { user, loading, encryptionKey } = useAuth(); // Use useAuth hook
  const location = useLocation();

  // Show master password modal if user is logged in, auth is not loading, and encryption key is not set
  const showMasterPasswordModal = !loading && user && !encryptionKey;

  return (
    <ErrorBoundary>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route element={<Layout />}>
            <Route path="/" element={<AnimatedPage><Home /></AnimatedPage>} />
            <Route path="/login" element={<AnimatedPage><Login /></AnimatedPage>} />
            <Route
              path="/journal"
              element={
                <ProtectedRoute>
                  <SuspenseWrapper>
                    <AnimatedPage><Journal /></AnimatedPage>
                  </SuspenseWrapper>
                </ProtectedRoute>
              }
            />
            <Route
              path="/new-entry"
              element={
                <ProtectedRoute>
                  <SuspenseWrapper>
                    <AnimatedPage><NewEntry /></AnimatedPage>
                  </SuspenseWrapper>
                </ProtectedRoute>
              }
            />
            <Route
              path="/calendar"
              element={
                <ProtectedRoute>
                  <SuspenseWrapper>
                    <AnimatedPage><CalendarPage /></AnimatedPage>
                  </SuspenseWrapper>
                </ProtectedRoute>
              }
            />
            <Route
              path="/todos"
              element={
                <ProtectedRoute>
                  <SuspenseWrapper>
                    <AnimatedPage><Todos /></AnimatedPage>
                  </SuspenseWrapper>
                </ProtectedRoute>
              }
            />
            <Route
              path="/review"
              element={
                <ProtectedRoute>
                  <SuspenseWrapper>
                    <AnimatedPage><WeeklyReview /></AnimatedPage>
                  </SuspenseWrapper>
                </ProtectedRoute>
              }
            />
          </Route>
        </Routes>
      </AnimatePresence>
      {showMasterPasswordModal && (
        <MasterPasswordModal onClose={() => { /* Potentially handle skipping / closing */ }} />
      )}
    </ErrorBoundary>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <AppContent /> {/* Render the content within AuthProvider */}
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
