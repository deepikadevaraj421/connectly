import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Zap, MessageCircle, Heart, Users, Sparkles, Shield,
  ArrowRight, CheckCircle2, Moon, Sun, Flame, Compass, Bell
} from 'lucide-react'
import { useAuthStore, useThemeStore } from '../store'
import api from '../api/client'
import toast from 'react-hot-toast'

export default function LandingPage() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const { theme, toggleTheme } = useThemeStore()
  const [demoLoading, setDemoLoading] = useState(false)

  const quickDemoLogin = async (email, password = 'password123') => {
    setDemoLoading(true)
    try {
      const { data } = await api.post('/auth/login', { email, password })
      setAuth(data.access_token, data.user)
      toast.success(`Welcome back, ${data.user.full_name}! 👋`)
      navigate('/feed')
    } catch {
      toast.error('Demo login failed. Please ensure the backend is running.')
    } finally {
      setDemoLoading(false)
    }
  }

  const features = [
    {
      icon: MessageCircle,
      color: '#7c3aed',
      title: 'Real-Time Messaging',
      desc: 'Instant 1-on-1 and group chats powered by WebSockets with typing indicators and online presence.',
    },
    {
      icon: Heart,
      color: '#f43f5e',
      title: 'Rich Social Feed',
      desc: 'Share media, double-tap hearts, react with interactive emojis, comment in real time, and bookmark favorites.',
    },
    {
      icon: Users,
      color: '#3b82f6',
      title: 'Vibrant Communities',
      desc: 'Join and create specialized spaces for designers, developers, photographers, and creatives.',
    },
    {
      icon: Bell,
      color: '#f59e0b',
      title: 'Instant Notifications',
      desc: 'Never miss a beat with real-time badges for likes, mentions, comments, and new followers.',
    },
    {
      icon: Sparkles,
      color: '#10b981',
      title: 'Immersive Profiles',
      desc: 'Customizable covers, avatars, bio, followers count, and rich post galleries showcasing your best work.',
    },
    {
      icon: Shield,
      color: '#8b5cf6',
      title: 'Fast & Secure',
      desc: 'Built with modern JWT authentication, encrypted credentials, responsive design, and fluid animations.',
    },
  ]

  const demoUsers = [
    { name: 'Alice Chen', role: 'UI/UX Designer', email: 'alice@connectly.io', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alice' },
    { name: 'Bob Martinez', role: 'Full-Stack Dev', email: 'bob@connectly.io', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=bob' },
    { name: 'Carol Park', role: 'Photographer', email: 'carol@connectly.io', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=carol' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-main)', color: 'var(--text-main)', display: 'flex', flexDirection: 'column' }}>
      {/* Top Navigation */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
        backgroundColor: 'rgba(var(--bg-card-rgb, 255, 255, 255), 0.85)',
        borderBottom: '1px solid var(--border-color)',
        padding: '0.875rem 1.5rem',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Logo */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10,
              background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(124,58,237,0.35)',
            }}>
              <Zap size={22} color="white" />
            </div>
            <span style={{ fontSize: '1.35rem', fontWeight: 800, background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Connectly
            </span>
          </Link>

          {/* Nav links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              onClick={toggleTheme}
              style={{
                background: 'var(--bg-hover)', border: '1px solid var(--border-color)',
                borderRadius: '50%', width: 38, height: 38, display: 'flex',
                alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                color: 'var(--text-main)',
              }}
              title="Toggle Theme"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <Link
              to="/login"
              style={{
                color: 'var(--text-main)', textDecoration: 'none', fontWeight: 600,
                fontSize: '0.925rem', padding: '0.5rem 1rem', borderRadius: 8,
              }}
            >
              Sign In
            </Link>

            <Link
              to="/register"
              className="btn btn-primary"
              style={{ padding: '0.5rem 1.25rem', fontSize: '0.925rem' }}
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section style={{
        padding: '5rem 1.5rem 3.5rem',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Background glow decoration */}
        <div style={{
          position: 'absolute', top: '-10%', left: '50%', transform: 'translateX(-50%)',
          width: '700px', height: '400px',
          background: 'radial-gradient(circle, rgba(124, 58, 237, 0.18) 0%, rgba(236, 72, 153, 0.08) 50%, transparent 70%)',
          pointerEvents: 'none', filter: 'blur(50px)', zIndex: 0,
        }} />

        <div style={{ maxWidth: 880, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '6px 16px', borderRadius: 999,
              background: 'rgba(124, 58, 237, 0.1)', border: '1px solid rgba(124, 58, 237, 0.25)',
              color: 'var(--primary-600)', fontSize: '0.85rem', fontWeight: 600,
              marginBottom: '1.75rem',
            }}>
              <Sparkles size={16} />
              <span>Next-Generation Social Networking</span>
            </div>

            <h1 style={{
              fontSize: 'clamp(2.5rem, 5.5vw, 4.2rem)',
              fontWeight: 900,
              lineHeight: 1.15,
              letterSpacing: '-0.03em',
              marginBottom: '1.5rem',
            }}>
              Where authentic moments <br />
              <span style={{
                background: 'linear-gradient(135deg, #7c3aed 20%, #ec4899 70%, #f97316 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                turn into vibrant communities
              </span>
            </h1>

            <p style={{
              fontSize: 'clamp(1.05rem, 2vw, 1.25rem)',
              color: 'var(--text-muted)',
              lineHeight: 1.6,
              maxWidth: 680,
              margin: '0 auto 2.5rem',
            }}>
              Connectly combines real-time conversations, curated niche communities, interactive media feeds,
              and live messaging in an ultra-modern, fluid experience.
            </p>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <Link
                to="/register"
                className="btn btn-primary"
                style={{ padding: '0.875rem 2rem', fontSize: '1.05rem', gap: 10 }}
              >
                Create Account <ArrowRight size={18} />
              </Link>
              <button
                onClick={() => quickDemoLogin('alice@connectly.io')}
                disabled={demoLoading}
                className="btn btn-secondary"
                style={{ padding: '0.875rem 1.75rem', fontSize: '1.05rem', gap: 8 }}
              >
                <Zap size={18} color="#7c3aed" />
                {demoLoading ? 'Logging in...' : 'Explore Demo as Alice'}
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Quick Demo Login Cards */}
      <section style={{ padding: '2rem 1.5rem 4rem' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <span style={{ fontSize: '0.825rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>
              ⚡ One-Click Demo Access
            </span>
            <p style={{ margin: '4px 0 0', fontSize: '0.925rem', color: 'var(--text-muted)' }}>
              Try Connectly instantly with any of the pre-configured creators:
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
            {demoUsers.map((u) => (
              <motion.div
                key={u.email}
                whileHover={{ y: -4, boxShadow: 'var(--shadow-md)' }}
                className="card"
                style={{
                  padding: '1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  cursor: 'pointer',
                  border: '1px solid var(--border-color)',
                }}
                onClick={() => quickDemoLogin(u.email)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <img
                    src={u.avatar}
                    alt={u.name}
                    style={{ width: 46, height: 46, borderRadius: '50%', background: 'var(--bg-hover)' }}
                  />
                  <div>
                    <h4 style={{ margin: 0, fontSize: '0.975rem', fontWeight: 700 }}>{u.name}</h4>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{u.role}</span>
                  </div>
                </div>
                <button
                  className="btn btn-secondary"
                  style={{ padding: '6px 14px', fontSize: '0.8rem', flexShrink: 0 }}
                  onClick={(e) => { e.stopPropagation(); quickDemoLogin(u.email) }}
                >
                  Enter →
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section style={{ padding: '4rem 1.5rem', background: 'var(--bg-secondary)', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <h2 style={{ fontSize: '2.2rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.75rem' }}>
              Engineered for Modern Interaction
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', maxWidth: 560, margin: '0 auto' }}>
              Every feature is built from the ground up to be lightning-fast, reactive, and visually delightful.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {features.map((f, i) => {
              const Icon = f.icon
              return (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="card"
                  style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}
                >
                  <div style={{
                    width: 44, height: 44, borderRadius: 12,
                    background: `${f.color}18`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: f.color,
                  }}>
                    <Icon size={24} />
                  </div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700 }}>{f.title}</h3>
                  <p style={{ margin: 0, fontSize: '0.925rem', color: 'var(--text-muted)', lineHeight: 1.55 }}>
                    {f.desc}
                  </p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Live Preview Teaser Card */}
      <section style={{ padding: '5rem 1.5rem', textAlign: 'center' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '1rem' }}>
            Ready to experience Connectly?
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', marginBottom: '2rem' }}>
            Join creators, builders, and community leaders already sharing their best ideas.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <Link to="/register" className="btn btn-primary" style={{ padding: '0.875rem 2.25rem', fontSize: '1rem' }}>
              Sign Up Now
            </Link>
            <Link to="/explore" className="btn btn-secondary" style={{ padding: '0.875rem 2rem', fontSize: '1rem' }}>
              Explore Content
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        marginTop: 'auto',
        borderTop: '1px solid var(--border-color)',
        padding: '2rem 1.5rem',
        textAlign: 'center',
        color: 'var(--text-muted)',
        fontSize: '0.875rem',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Zap size={18} color="#7c3aed" />
            <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>Connectly</span>
            <span>&copy; {new Date().getFullYear()} Social Networking & Messaging Platform</span>
          </div>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <Link to="/login" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Login</Link>
            <Link to="/register" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Register</Link>
            <Link to="/feed" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Feed</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
