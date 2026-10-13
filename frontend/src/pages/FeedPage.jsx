import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import AppLayout from '../components/layout/AppLayout'
import PostCard from '../components/feed/PostCard'
import CreatePost from '../components/feed/CreatePost'
import { Avatar, SkeletonPost, Spinner } from '../components/ui'
import { useAuthStore } from '../store'
import api from '../api/client'
import toast from 'react-hot-toast'
import { Users, TrendingUp, UserPlus, Check } from 'lucide-react'
import { Link } from 'react-router-dom'

const STORIES_SEEDS = ['nature','city','coffee','work','art','travel','food','music']

function StoriesBar({ user }) {
  return (
    <div className="card" style={{ padding: '1rem', marginBottom: '1rem', overflowX: 'auto' }}>
      <div style={{ display: 'flex', gap: 16, minWidth: 'max-content' }}>
        {/* My story */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
          <div className="story-ring">
            <Avatar src={user?.profile?.avatar_url} name={user?.full_name} size={56} />
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', maxWidth: 60, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Your Story</span>
        </div>
        {STORIES_SEEDS.map((seed, i) => (
          <div key={seed} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
            <motion.div className="story-ring" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}${i}`} alt={seed}
                style={{ width: 50, height: 50, borderRadius: '50%', border: '2px solid var(--surface)', display: 'block' }} />
            </motion.div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', maxWidth: 60, textAlign: 'center' }}>
              {['Alex','Sam','Jordan','Casey','Morgan','Taylor','Riley','Jamie'][i]}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function RightSidebar() {
  const [suggestions, setSuggestions] = useState([])
  const [following, setFollowing] = useState({})
  const { user } = useAuthStore()

  useEffect(() => {
    api.get('/users/suggestions').then(r => setSuggestions(r.data)).catch(() => {})
  }, [])

  const handleFollow = async (userId) => {
    try {
      await api.post(`/users/${userId}/follow`)
      setFollowing(f => ({ ...f, [userId]: true }))
      toast.success('Following!')
    } catch (err) {
      if (err.response?.status === 409) setFollowing(f => ({ ...f, [userId]: true }))
      else toast.error('Failed')
    }
  }

  const TRENDING = ['#ReactJS','#WebDev','#UIDesign','#OpenSource','#AITools','#Photography','#DesignSystem','#TypeScript']

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Suggestions */}
      <div className="card" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1rem' }}>
          <UserPlus size={16} color="var(--primary-500)" />
          <h4 style={{ margin: 0, fontSize: '0.9rem' }}>People You May Know</h4>
        </div>
        {suggestions.slice(0, 5).map(u => (
          <motion.div key={u.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '0.875rem' }}>
            <Link to={`/profile/${u.username}`}>
              <Avatar src={u.profile?.avatar_url} name={u.full_name} size={38} />
            </Link>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <Link to={`/profile/${u.username}`} style={{ fontWeight: 600, fontSize: '0.84rem', color: 'var(--text-primary)', textDecoration: 'none', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {u.full_name}
              </Link>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>@{u.username}</div>
            </div>
            <motion.button
              onClick={() => handleFollow(u.id)}
              disabled={following[u.id]}
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              style={{
                padding: '5px 12px', borderRadius: 999, border: 'none', cursor: 'pointer',
                fontSize: '0.78rem', fontWeight: 600, transition: 'all 0.2s',
                background: following[u.id] ? 'var(--surface-2)' : 'var(--gradient-primary)',
                color: following[u.id] ? 'var(--text-muted)' : 'white',
              }}>
              {following[u.id] ? <Check size={13} /> : 'Follow'}
            </motion.button>
          </motion.div>
        ))}
        {suggestions.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>No suggestions right now</p>}
      </div>

      {/* Trending */}
      <div className="card" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1rem' }}>
          <TrendingUp size={16} color="var(--primary-500)" />
          <h4 style={{ margin: 0, fontSize: '0.9rem' }}>Trending Topics</h4>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {TRENDING.map(t => (
            <motion.span key={t} className="trending-tag" whileHover={{ y: -2 }}>{t}</motion.span>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function FeedPage() {
  const { user } = useAuthStore()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [skip, setSkip] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const LIMIT = 10

  const fetchPosts = useCallback(async (s = 0, reset = false) => {
    if (s === 0) setLoading(true); else setLoadingMore(true)
    try {
      const { data } = await api.get(`/posts/feed?skip=${s}&limit=${LIMIT}`)
      setPosts(prev => reset ? data : [...prev, ...data])
      setHasMore(data.length === LIMIT)
      setSkip(s + data.length)
    } catch { toast.error('Failed to load feed') }
    setLoading(false)
    setLoadingMore(false)
  }, [])

  useEffect(() => { fetchPosts(0, true) }, [fetchPosts])

  // Infinite scroll
  useEffect(() => {
    const onScroll = () => {
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 300 && !loadingMore && hasMore)
        fetchPosts(skip)
    }
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [loadingMore, hasMore, skip, fetchPosts])

  const handlePostCreated = (newPost) => setPosts(prev => [newPost, ...prev])
  const handlePostDeleted = (id) => setPosts(prev => prev.filter(p => p.id !== id))

  return (
    <AppLayout>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }} className="feed-grid">
        <div style={{ minWidth: 0 }}>
          <StoriesBar user={user} />
          <CreatePost user={user} onPostCreated={handlePostCreated} />
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => <SkeletonPost key={i} />)
          ) : posts.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card"
              style={{ padding: '3rem', textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🌱</div>
              <h3 style={{ margin: 0, marginBottom: 8 }}>Your feed is empty</h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Follow some people to see their posts here</p>
              <Link to="/explore" className="btn-primary" style={{ textDecoration: 'none' }}>Explore People</Link>
            </motion.div>
          ) : (
            <>
              {posts.map((post, i) => (
                <motion.div key={post.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                  <PostCard post={post} onDelete={handlePostDeleted} />
                </motion.div>
              ))}
              {loadingMore && <div style={{ display: 'flex', justifyContent: 'center', padding: '1rem' }}><Spinner /></div>}
              {!hasMore && posts.length > 0 && (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1.5rem', fontSize: '0.88rem' }}>You're all caught up! 🎉</p>
              )}
            </>
          )}
        </div>
        <div className="feed-right">
          <RightSidebar />
        </div>
      </div>
      <style>{`@media (min-width: 1024px) { .feed-grid { grid-template-columns: 1fr 300px !important; } } .feed-right { display: none; } @media (min-width: 1024px) { .feed-right { display: block; } }`}</style>
    </AppLayout>
  )
}
