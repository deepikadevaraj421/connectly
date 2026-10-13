import { useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useAuthStore, useThemeStore, useNotifStore } from './store'
import api from './api/client'

// Pages
import LandingPage from './pages/LandingPage'
import AuthPage from './pages/AuthPage'
import FeedPage from './pages/FeedPage'
import ProfilePage from './pages/ProfilePage'
import ExplorePage from './pages/ExplorePage'
import MessagesPage from './pages/MessagesPage'
import NotificationsPage from './pages/NotificationsPage'
import CommunitiesPage from './pages/CommunitiesPage'
import SettingsPage from './pages/SettingsPage'

// Protected Route wrapper
function ProtectedRoute({ children }) {
  const { isAuthenticated, token } = useAuthStore()
  const location = useLocation()

  if (!isAuthenticated && !token) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}

// Public Only Route wrapper (e.g. login/register redirect to /feed if already logged in)
function PublicRoute({ children }) {
  const { isAuthenticated } = useAuthStore()
  if (isAuthenticated) {
    return <Navigate to="/feed" replace />
  }
  return children
}

// Scroll to top helper
function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

export default function App() {
  const { token, isAuthenticated, fetchMe } = useAuthStore()
  const { theme } = useThemeStore()
  const { setCount } = useNotifStore()

  // Initialize theme class on document
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  // Sync current user on load if token exists
  useEffect(() => {
    if (token) {
      fetchMe()
    }
  }, [token])

  // Periodic notification check for badge updates
  useEffect(() => {
    if (!isAuthenticated) return

    const checkNotifs = async () => {
      try {
        const { data } = await api.get('/notifications/unread-count')
        setCount(data.count ?? data.unread_count ?? 0)
      } catch {
        // quiet failure
      }
    }

    checkNotifs()
    const interval = setInterval(checkNotifs, 15000)
    return () => clearInterval(interval)
  }, [isAuthenticated, setCount])

  return (
    <>
      <ScrollToTop />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            background: 'var(--bg-card)',
            color: 'var(--text-main)',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-lg)',
            borderRadius: 12,
            fontSize: '0.9rem',
            fontWeight: 500,
          },
        }}
      />

      <Routes>
        {/* Public Landing */}
        <Route
          path="/"
          element={
            isAuthenticated ? <Navigate to="/feed" replace /> : <LandingPage />
          }
        />

        {/* Auth routes */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <AuthPage initialMode="login" />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <AuthPage initialMode="register" />
            </PublicRoute>
          }
        />
        <Route
          path="/auth"
          element={
            <PublicRoute>
              <AuthPage />
            </PublicRoute>
          }
        />

        {/* Authenticated Application routes */}
        <Route
          path="/feed"
          element={
            <ProtectedRoute>
              <FeedPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/explore"
          element={
            <ProtectedRoute>
              <ExplorePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/communities"
          element={
            <ProtectedRoute>
              <CommunitiesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/messages"
          element={
            <ProtectedRoute>
              <MessagesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/messages/:conversationId"
          element={
            <ProtectedRoute>
              <MessagesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <NotificationsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile/:username"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}
