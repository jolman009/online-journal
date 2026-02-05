import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import LoadingSpinner from './components/LoadingSpinner';
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

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <ErrorBoundary>
            <Routes>
              <Route element={<Layout />}>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route
                  path="/journal"
                  element={
                    <ProtectedRoute>
                      <SuspenseWrapper>
                        <Journal />
                      </SuspenseWrapper>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/new-entry"
                  element={
                    <ProtectedRoute>
                      <SuspenseWrapper>
                        <NewEntry />
                      </SuspenseWrapper>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/calendar"
                  element={
                    <ProtectedRoute>
                      <SuspenseWrapper>
                        <CalendarPage />
                      </SuspenseWrapper>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/todos"
                  element={
                    <ProtectedRoute>
                      <SuspenseWrapper>
                        <Todos />
                      </SuspenseWrapper>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/review"
                  element={
                    <ProtectedRoute>
                      <SuspenseWrapper>
                        <WeeklyReview />
                      </SuspenseWrapper>
                    </ProtectedRoute>
                  }
                />
              </Route>
            </Routes>
          </ErrorBoundary>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
