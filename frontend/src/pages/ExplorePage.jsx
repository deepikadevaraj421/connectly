import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Search, Filter } from 'lucide-react'
import AppLayout from '../components/layout/AppLayout'
import PostCard from '../components/feed/PostCard'
import { Avatar, SkeletonPost, Spinner } from '../components/ui'
import api from '../api/client'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'

const CATEGORIES = ['All', 'Technology', 'Design', 'Photography', 'Music', 'Travel', 'Health', 'Education']

export default function ExplorePage() {
  const [q, setQ] = useState('')
  const [posts, setPosts] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('posts')
  const [category, setCategory] = useState('All')
  const [following, setFollowing] = useState({})
  const debounce = useRef(null)

  useEffect(() => {
    clearTimeout(debounce.current)
    debounce.current = setTimeout(async () => {
      setLoading(true)
      try {
        const [pRes, uRes] = await Promise.all([
          api.get(`/posts/explore?limit=30`),
          api.get(`/users?q=${q}&limit=20`),
        ])
        setPosts(pRes.data)
        setUsers(uRes.data)
      } catch { toast.error('Search failed') }
      setLoading(false)
    }, 350)
  }, [q])

  const handleFollow = async (userId) => {
    try {
      if (following[userId]) {
        await api.delete(`/users/${userId}/follow`)
        setFollowing(f => ({ ...f, [userId]: false }))
      } else {
        await api.post(`/users/${userId}/follow`)
        setFollowing(f => ({ ...f, [userId]: true }))
      }
    } catch (err) {
      if (err.response?.status === 409) setFollowing(f => ({ ...f, [userId]: true }))
      else toast.error('Failed')
    }
  }

  return (
    <AppLayout>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        {/* Search */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="card"
          style={{ padding: '1.25rem', marginBottom: '1rem' }}>
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              className="search-input"
              style={{ paddingLeft: 42 }}
              placeholder="Search people, posts, topics..."
              value={q} onChange={e => setQ(e.target.value)}
            />
          </div>

          {/* Category chips */}
          <div style={{ display: 'flex', gap: 8, marginTop: '1rem', overflowX: 'auto', paddingBottom: 4 }}>
            {CATEGORIES.map(c => (
              <button key={c} onClick={() => setCategory(c)}
                style={{
                  padding: '5px 14px', borderRadius: 999, border: 'none', cursor: 'pointer',
                  fontSize: '0.82rem', fontWeight: 600, whiteSpace: 'nowrap', transition: 'all 0.15s',
                  background: category === c ? 'var(--gradient-primary)' : 'var(--surface-2)',
                  color: category === c ? 'white' : 'var(--text-secondary)',
                }}>
                {c}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, marginBottom: '1rem', background: 'var(--surface)', borderRadius: 12, border: '1px solid var(--border)', padding: 4 }}>
          {['posts', 'people'].map(t => (
            <button key={t} onClick={() => setActiveTab(t)}
              style={{
                flex: 1, padding: '10px 0', border: 'none', cursor: 'pointer', borderRadius: 10,
                fontWeight: 600, fontSize: '0.88rem', transition: 'all 0.15s',
                background: activeTab === t ? 'var(--gradient-primary)' : 'transparent',
                color: activeTab === t ? 'white' : 'var(--text-muted)',
              }}>
              {t === 'posts' ? '📝 Posts' : '👥 People'}
            </button>
          ))}
        </div>

        {loading ? (
          <>{Array.from({ length: 4 }).map((_, i) => <SkeletonPost key={i} />)}</>
        ) : activeTab === 'posts' ? (
          posts.length === 0
            ? <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>No posts found</div>
            : posts.map((p, i) => (
                <motion.div key={p.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                  <PostCard post={p} />
                </motion.div>
              ))
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {users.length === 0
              ? <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>No users found</div>
              : users.map((u, i) => (
                  <motion.div key={u.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                    className="card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: 14 }}>
                    <Link to={`/profile/${u.username}`}>
                      <Avatar src={u.profile?.avatar_url} name={u.full_name} size={52} />
                    </Link>
                    <div style={{ flex: 1 }}>
                      <Link to={`/profile/${u.username}`} style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', textDecoration: 'none' }}>{u.full_name}</Link>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>@{u.username}</div>
                      {u.profile?.bio && <div style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', marginTop: 4, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', maxWidth: 300 }}>{u.profile.bio}</div>}
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>{u.followers_count} followers · {u.following_count} following</div>
                    </div>
                    <motion.button onClick={() => handleFollow(u.id)} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                      style={{
                        padding: '7px 16px', borderRadius: 999, border: 'none', cursor: 'pointer',
                        fontWeight: 600, fontSize: '0.82rem',
                        background: (following[u.id] || u.is_following) ? 'var(--surface-2)' : 'var(--gradient-primary)',
                        color: (following[u.id] || u.is_following) ? 'var(--text-muted)' : 'white',
                      }}>
                      {(following[u.id] || u.is_following) ? 'Following' : 'Follow'}
                    </motion.button>
                  </motion.div>
                ))
            }
          </div>
        )}
      </div>
    </AppLayout>
  )
}
