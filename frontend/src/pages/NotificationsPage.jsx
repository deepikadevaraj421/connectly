import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, Heart, MessageCircle, UserPlus, CheckCheck } from 'lucide-react'
import AppLayout from '../components/layout/AppLayout'
import { Avatar, Spinner } from '../components/ui'
import { useNotifStore } from '../store'
import api from '../api/client'
import toast from 'react-hot-toast'
import { formatDistanceToNow } from 'date-fns'
import { Link } from 'react-router-dom'

const ICONS = {
  follow: { icon: UserPlus, bg: '#ede9fe', color: '#7c3aed' },
  like: { icon: Heart, bg: '#fce7f3', color: '#ec4899' },
  comment: { icon: MessageCircle, bg: '#dbeafe', color: '#2563eb' },
  reply: { icon: MessageCircle, bg: '#dcfce7', color: '#16a34a' },
  message: { icon: MessageCircle, bg: '#fff7ed', color: '#ea580c' },
  community_invite: { icon: Bell, bg: '#fef9c3', color: '#ca8a04' },
  community_post: { icon: Bell, bg: '#f0fdf4', color: '#15803d' },
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const { setCount, markAllRead } = useNotifStore()

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get('/notifications?limit=50')
        setNotifications(data)
      } catch { toast.error('Failed to load notifications') }
      setLoading(false)
    }
    load()
  }, [])

  const handleMarkAll = async () => {
    try {
      await api.put('/notifications/read-all')
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      markAllRead()
      setCount(0)
      toast.success('All marked as read')
    } catch { toast.error('Failed') }
  }

  const handleMarkOne = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`)
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
      setCount(c => Math.max(0, c - 1))
    } catch {}
  }

  const unreadCount = notifications.filter(n => !n.is_read).length

  return (
    <AppLayout>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.3rem' }}>Notifications</h2>
            {unreadCount > 0 && <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>{unreadCount} unread</p>}
          </div>
          {unreadCount > 0 && (
            <motion.button onClick={handleMarkAll} whileHover={{ scale: 1.02 }} className="btn-secondary" style={{ fontSize: '0.82rem', padding: '7px 14px' }}>
              <CheckCheck size={14} /> Mark all read
            </motion.button>
          )}
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><Spinner size={32} /></div>
        ) : notifications.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card"
            style={{ padding: '3rem', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔔</div>
            <h3 style={{ margin: 0 }}>No notifications yet</h3>
            <p style={{ color: 'var(--text-muted)' }}>When someone interacts with you, it'll appear here</p>
          </motion.div>
        ) : (
          <div className="card" style={{ overflow: 'hidden' }}>
            <AnimatePresence>
              {notifications.map((n, i) => {
                const typeInfo = ICONS[n.notification_type] || ICONS.follow
                const Icon = typeInfo.icon
                return (
                  <motion.div key={n.id}
                    initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                    onClick={() => !n.is_read && handleMarkOne(n.id)}
                    style={{
                      display: 'flex', gap: 12, padding: '1rem 1.25rem',
                      borderBottom: '1px solid var(--border)',
                      background: n.is_read ? 'transparent' : 'var(--primary-50)',
                      cursor: n.is_read ? 'default' : 'pointer',
                      transition: 'background 0.2s',
                    }}>
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      {n.actor ? (
                        <Link to={`/profile/${n.actor.username}`}>
                          <Avatar src={n.actor.profile?.avatar_url} name={n.actor.full_name} size={44} />
                        </Link>
                      ) : (
                        <div style={{ width: 44, height: 44, borderRadius: '50%', background: typeInfo.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Icon size={20} color={typeInfo.color} />
                        </div>
                      )}
                      <div style={{ position: 'absolute', bottom: -2, right: -2, width: 20, height: 20, borderRadius: '50%', background: typeInfo.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--surface)' }}>
                        <Icon size={10} color={typeInfo.color} />
                      </div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontSize: '0.88rem', lineHeight: 1.5 }}>
                        {n.actor && <Link to={`/profile/${n.actor.username}`} style={{ fontWeight: 700, color: 'var(--text-primary)', textDecoration: 'none' }}>{n.actor.full_name}</Link>}{' '}
                        {n.message?.replace(n.actor?.full_name || '', '').trim()}
                      </p>
                      <p style={{ margin: '4px 0 0 0', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                        {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    {!n.is_read && (
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary-500)', flexShrink: 0, marginTop: 6 }} />
                    )}
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
