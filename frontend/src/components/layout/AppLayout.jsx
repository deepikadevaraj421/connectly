import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Home, Compass, Users, MessageCircle, Bell, User, Settings,
  LogOut, Moon, Sun, Zap, Menu, X
} from 'lucide-react'
import { Avatar } from '../ui'
import { useAuthStore, useThemeStore, useNotifStore } from '../../store'
import api from '../../api/client'

const NAV = [
  { to: '/feed',          icon: Home,          label: 'Home' },
  { to: '/explore',       icon: Compass,        label: 'Explore' },
  { to: '/communities',   icon: Users,          label: 'Communities' },
  { to: '/messages',      icon: MessageCircle,  label: 'Messages' },
  { to: '/notifications', icon: Bell,           label: 'Notifications', badge: true },
  { to: '/profile',       icon: User,           label: 'Profile' },
  { to: '/settings',      icon: Settings,       label: 'Settings' },
]

function SidebarContent({ collapsed, onClose }) {
  const { user, logout } = useAuthStore()
  const { theme, toggleTheme } = useThemeStore()
  const { count } = useNotifStore()
  const location = useLocation()
  const navigate = useNavigate()

  const handleLogout = () => { logout(); navigate('/') }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '1.25rem 0.75rem' }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 0.5rem', marginBottom: '1.75rem' }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10, flexShrink: 0,
          background: 'linear-gradient(135deg, #7c3aed, #f472b6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(124,58,237,0.4)',
        }}>
          <Zap size={18} color="white" />
        </div>
        {!collapsed && (
          <span style={{ fontSize: '1.2rem', fontWeight: 800, background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Connectly
          </span>
        )}
        {onClose && (
          <button onClick={onClose} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        )}
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {NAV.map(({ to, icon: Icon, label, badge }) => {
          const active = location.pathname === to || (to !== '/feed' && location.pathname.startsWith(to))
          return (
            <Link key={to} to={to} onClick={onClose} className={`sidebar-nav-item ${active ? 'active' : ''}`}>
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <Icon size={20} />
                {badge && count > 0 && (
                  <span className="notif-badge">{count > 9 ? '9+' : count}</span>
                )}
              </div>
              {!collapsed && <span>{label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Bottom */}
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: 4 }}>
        <button onClick={toggleTheme} className="sidebar-nav-item">
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          {!collapsed && <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>}
        </button>
        <button onClick={handleLogout} className="sidebar-nav-item" style={{ color: '#ef4444' }}>
          <LogOut size={20} />
          {!collapsed && <span>Logout</span>}
        </button>

        {!collapsed && user && (
          <Link to="/profile" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 12, background: 'var(--surface-2)', marginTop: 4, textDecoration: 'none' }}>
            <Avatar src={user.profile?.avatar_url} name={user.full_name} size={36} />
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.full_name}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>@{user.username}</div>
            </div>
          </Link>
        )}
      </div>
    </div>
  )
}

export default function AppLayout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { count, setCount } = useNotifStore()

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const { data } = await api.get('/notifications/unread-count')
        setCount(data.count)
      } catch {}
    }
    fetchCount()
    const interval = setInterval(fetchCount, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--surface-2)' }}>
      {/* Desktop Sidebar */}
      <aside className="sidebar-desktop" style={{
        width: 240, flexShrink: 0, position: 'sticky', top: 0, height: '100vh',
        background: 'var(--surface)', borderRight: '1px solid var(--border)', overflowY: 'auto',
      }}>
        <SidebarContent collapsed={false} />
      </aside>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200, backdropFilter: 'blur(4px)' }} />
            <motion.aside initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }} transition={{ type: 'spring', damping: 28 }}
              style={{ position: 'fixed', left: 0, top: 0, bottom: 0, width: 260, background: 'var(--surface)', zIndex: 201, overflowY: 'auto', boxShadow: 'var(--shadow-xl)' }}>
              <SidebarContent collapsed={false} onClose={() => setMobileOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main style={{ flex: 1, minWidth: 0, paddingBottom: 80 }}>
        {/* Mobile Top Bar */}
        <div style={{
          display: 'none', position: 'sticky', top: 0, zIndex: 100,
          background: 'var(--surface)', borderBottom: '1px solid var(--border)',
          padding: '12px 16px', alignItems: 'center', justifyContent: 'space-between',
        }} className="mobile-topbar">
          <button onClick={() => setMobileOpen(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)' }}>
            <Menu size={22} />
          </button>
          <span style={{ fontWeight: 800, fontSize: '1.1rem', background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Connectly</span>
          <div style={{ width: 22 }} />
        </div>

        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '1.5rem 1rem' }}>
          {children}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="mobile-nav">
        {NAV.slice(0, 5).map(({ to, icon: Icon, badge }) => {
          const active = window.location.pathname === to
          return (
            <Link key={to} to={to} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              padding: '6px 12px', color: active ? 'var(--primary-600)' : 'var(--text-muted)',
              textDecoration: 'none', position: 'relative',
            }}>
              <div style={{ position: 'relative' }}>
                <Icon size={22} />
                {badge && count > 0 && <span className="notif-badge">{count > 9 ? '9+' : count}</span>}
              </div>
            </Link>
          )
        })}
      </nav>

      <style>{`.mobile-topbar { display: flex !important; } @media (min-width: 769px) { .mobile-topbar { display: none !important; } }`}</style>
    </div>
  )
}
