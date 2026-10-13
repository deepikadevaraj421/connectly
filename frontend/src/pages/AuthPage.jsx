import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Zap, ArrowRight, UserCheck, Sparkles } from 'lucide-react'
import { useAuthStore } from '../store'
import api from '../api/client'
import toast from 'react-hot-toast'

export default function AuthPage({ initialMode }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()

  // Mode: 'login' or 'register'
  const isRegisterRoute = location.pathname === '/register'
  const [mode, setMode] = useState(initialMode || (isRegisterRoute ? 'register' : 'login'))

  useEffect(() => {
    if (location.pathname === '/register') {
      setMode('register')
    } else if (location.pathname === '/login') {
      setMode('login')
    }
  }, [location.pathname])

  // Form State
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    username: '',
    password: '',
    confirm_password: '',
  })
  const [showPw, setShowPw] = useState(false)
  const [showConfirmPw, setShowConfirmPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  // Handle typing in any field
  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }))
    }
  }

  const validate = () => {
    const errs = {}
    if (mode === 'register') {
      if (!form.full_name.trim()) errs.full_name = 'Full name is required'
      if (!form.username.trim()) errs.username = 'Username is required'
      else if (!/^[a-zA-Z0-9_]+$/.test(form.username.trim())) {
        errs.username = 'Only letters, numbers, and underscores allowed'
      }
      if (form.password !== form.confirm_password) {
        errs.confirm_password = 'Passwords do not match'
      }
    }
    if (!form.email.trim()) {
      errs.email = 'Email address is required'
    }
    if (!form.password) {
      errs.password = 'Password is required'
    } else if (form.password.length < 6) {
      errs.password = 'Password must be at least 6 characters'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    try {
      const endpoint = mode === 'login' ? '/auth/login' : '/auth/register'
      const payload = mode === 'login'
        ? { email: form.email.trim(), password: form.password }
        : {
            full_name: form.full_name.trim(),
            email: form.email.trim(),
            username: form.username.trim(),
            password: form.password,
          }

      const { data } = await api.post(endpoint, payload)
      setAuth(data.access_token, data.user)
      toast.success(mode === 'login' ? `Welcome back, ${data.user.full_name}! 👋` : 'Account created successfully! 🎉')
      navigate('/feed')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Authentication failed. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  const switchMode = (newMode) => {
    setMode(newMode)
    setErrors({})
    navigate(newMode === 'login' ? '/login' : '/register')
  }

  const fillDemoAccount = () => {
    setMode('login')
    setForm(prev => ({
      ...prev,
      email: 'alice@connectly.io',
      password: 'password123',
    }))
    setErrors({})
    toast('Filled Alice demo credentials ⚡', { icon: '✨' })
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', position: 'relative', overflow: 'hidden', background: 'var(--surface-2)' }}>
      {/* Background Decorative Blobs */}
      <div style={{ position: 'absolute', inset: 0, background: 'var(--gradient-hero)', opacity: 0.06, pointerEvents: 'none' }} />
      <div className="blob blob-1" style={{ top: '-10%', left: '-5%', pointerEvents: 'none' }} />
      <div className="blob blob-2" style={{ bottom: '-10%', right: '-5%', pointerEvents: 'none' }} />

      {/* Left Branding Panel (Desktop) */}
      <div
        className="auth-left"
        style={{
          flex: 1,
          display: 'none',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '4rem',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', marginBottom: '3rem' }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: 'var(--gradient-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 6px 20px rgba(124,58,237,0.4)',
          }}>
            <Zap size={22} color="white" />
          </div>
          <span style={{ fontSize: '1.6rem', fontWeight: 800 }} className="gradient-text">Connectly</span>
        </Link>

        <h1 style={{ fontSize: '2.8rem', fontWeight: 900, marginBottom: '1.25rem', lineHeight: 1.15, letterSpacing: '-0.02em' }}>
          Connect.<br />
          Share.<br />
          <span className="gradient-text">Grow Together.</span>
        </h1>

        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', lineHeight: 1.7, maxWidth: 420 }}>
          Join creators and builders sharing real-time stories, exploring niche communities, and chatting freely.
        </p>

        <div style={{ display: 'flex', gap: '2.5rem', marginTop: '3rem' }}>
          {[
            ['6+', 'Active Creators'],
            ['10+', 'Engaging Posts'],
            ['4', 'Vibrant Spaces'],
          ].map(([count, label]) => (
            <div key={label}>
              <div style={{ fontSize: '1.6rem', fontWeight: 800 }} className="gradient-text">{count}</div>
              <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Form Container */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1.5rem',
        position: 'relative',
        zIndex: 2,
      }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="card"
          style={{ width: '100%', maxWidth: 460, padding: '2.5rem', boxShadow: 'var(--shadow-xl)' }}
        >
          {/* Form Header */}
          <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
            <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none', marginBottom: '1.25rem' }}>
              <div style={{
                width: 38, height: 38, borderRadius: 10,
                background: 'var(--gradient-primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Zap size={20} color="white" />
              </div>
              <span style={{ fontWeight: 800, fontSize: '1.25rem' }} className="gradient-text">Connectly</span>
            </Link>

            <h2 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
              {mode === 'login' ? 'Welcome back' : 'Create an account'}
            </h2>
            <p style={{ color: 'var(--text-muted)', marginTop: 6, fontSize: '0.9rem' }}>
              {mode === 'login' ? 'Sign in to access your feed & messages' : 'Join Connectly in seconds — free forever'}
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div style={{
            display: 'flex',
            background: 'var(--surface-2)',
            borderRadius: 999,
            padding: 4,
            marginBottom: '1.75rem',
            border: '1px solid var(--border)',
          }}>
            <button
              type="button"
              onClick={() => switchMode('login')}
              style={{
                flex: 1,
                padding: '9px 0',
                border: 'none',
                borderRadius: 999,
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.9rem',
                transition: 'all 0.2s',
                background: mode === 'login' ? 'var(--gradient-primary)' : 'transparent',
                color: mode === 'login' ? 'white' : 'var(--text-muted)',
                boxShadow: mode === 'login' ? '0 2px 10px rgba(124,58,237,0.35)' : 'none',
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => switchMode('register')}
              style={{
                flex: 1,
                padding: '9px 0',
                border: 'none',
                borderRadius: 999,
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.9rem',
                transition: 'all 0.2s',
                background: mode === 'register' ? 'var(--gradient-primary)' : 'transparent',
                color: mode === 'register' ? 'white' : 'var(--text-muted)',
                boxShadow: mode === 'register' ? '0 2px 10px rgba(124,58,237,0.35)' : 'none',
              }}
            >
              Sign Up
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate>
            {mode === 'register' && (
              <>
                {/* Full Name */}
                <div style={{ marginBottom: '1.1rem' }}>
                  <label htmlFor="auth-full-name" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6, color: 'var(--text-primary)' }}>
                    Full Name *
                  </label>
                  <input
                    id="auth-full-name"
                    name="full_name"
                    type="text"
                    autoComplete="name"
                    placeholder="Alice Chen"
                    value={form.full_name}
                    onChange={handleChange}
                    className="input-field"
                    style={{ borderColor: errors.full_name ? '#ef4444' : undefined }}
                  />
                  {errors.full_name && (
                    <p style={{ color: '#ef4444', fontSize: '0.78rem', marginTop: 4, margin: '4px 0 0' }}>{errors.full_name}</p>
                  )}
                </div>

                {/* Username */}
                <div style={{ marginBottom: '1.1rem' }}>
                  <label htmlFor="auth-username" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6, color: 'var(--text-primary)' }}>
                    Username *
                  </label>
                  <input
                    id="auth-username"
                    name="username"
                    type="text"
                    autoComplete="username"
                    placeholder="alicechen"
                    value={form.username}
                    onChange={handleChange}
                    className="input-field"
                    style={{ borderColor: errors.username ? '#ef4444' : undefined }}
                  />
                  {errors.username && (
                    <p style={{ color: '#ef4444', fontSize: '0.78rem', marginTop: 4, margin: '4px 0 0' }}>{errors.username}</p>
                  )}
                </div>
              </>
            )}

            {/* Email */}
            <div style={{ marginBottom: '1.1rem' }}>
              <label htmlFor="auth-email" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6, color: 'var(--text-primary)' }}>
                Email Address *
              </label>
              <input
                id="auth-email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="alice@connectly.io"
                value={form.email}
                onChange={handleChange}
                className="input-field"
                style={{ borderColor: errors.email ? '#ef4444' : undefined }}
              />
              {errors.email && (
                <p style={{ color: '#ef4444', fontSize: '0.78rem', marginTop: 4, margin: '4px 0 0' }}>{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div style={{ marginBottom: '1.1rem' }}>
              <label htmlFor="auth-password" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6, color: 'var(--text-primary)' }}>
                Password *
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="auth-password"
                  name="password"
                  type={showPw ? 'text' : 'password'}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={handleChange}
                  className="input-field"
                  style={{
                    paddingRight: 42,
                    borderColor: errors.password ? '#ef4444' : undefined,
                  }}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPw(prev => !prev)}
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    padding: 4,
                  }}
                  title={showPw ? 'Hide password' : 'Show password'}
                >
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <p style={{ color: '#ef4444', fontSize: '0.78rem', marginTop: 4, margin: '4px 0 0' }}>{errors.password}</p>
              )}
            </div>

            {/* Confirm Password (Register only) */}
            {mode === 'register' && (
              <div style={{ marginBottom: '1.1rem' }}>
                <label htmlFor="auth-confirm-password" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6, color: 'var(--text-primary)' }}>
                  Confirm Password *
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="auth-confirm-password"
                    name="confirm_password"
                    type={showConfirmPw ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="••••••••"
                    value={form.confirm_password}
                    onChange={handleChange}
                    className="input-field"
                    style={{
                      paddingRight: 42,
                      borderColor: errors.confirm_password ? '#ef4444' : undefined,
                    }}
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowConfirmPw(prev => !prev)}
                    style={{
                      position: 'absolute',
                      right: 12,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      padding: 4,
                    }}
                    title={showConfirmPw ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPw ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.confirm_password && (
                  <p style={{ color: '#ef4444', fontSize: '0.78rem', marginTop: 4, margin: '4px 0 0' }}>{errors.confirm_password}</p>
                )}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{
                width: '100%',
                justifyContent: 'center',
                marginTop: '0.75rem',
                padding: '0.85rem',
                fontSize: '0.975rem',
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? (
                'Processing...'
              ) : (
                <>
                  {mode === 'login' ? 'Sign In to Connectly' : 'Create Free Account'}
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {/* Demo account quick fill button */}
          <div style={{
            marginTop: '1.5rem',
            padding: '0.875rem 1rem',
            background: 'var(--surface-2)',
            borderRadius: 12,
            border: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
          }}>
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Sparkles size={14} color="#a855f7" /> Pre-Seeded Demo Account
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                alice@connectly.io / password123
              </div>
            </div>
            <button
              type="button"
              onClick={fillDemoAccount}
              style={{
                background: 'var(--gradient-primary)',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                padding: '5px 10px',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              Auto-Fill
            </button>
          </div>
        </motion.div>
      </div>

      <style>{`
        @media (min-width: 900px) {
          .auth-left { display: flex !important; }
        }
      `}</style>
    </div>
  )
}
