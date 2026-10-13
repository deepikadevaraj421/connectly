import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, Plus, Search, Check, Lock, Globe, Sparkles,
  ArrowRight, Shield, Layers, Filter, X
} from 'lucide-react'
import AppLayout from '../components/layout/AppLayout'
import { Avatar, Modal } from '../components/ui'
import api from '../api/client'
import toast from 'react-hot-toast'

const CATEGORIES = [
  'All',
  'Design',
  'Tech',
  'Photography',
  'Music',
  'AI & Machine Learning',
  'Fitness',
  'Gaming',
]

export default function CommunitiesPage() {
  const [communities, setCommunities] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [tab, setTab] = useState('all') // 'all' | 'joined'
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [joiningId, setJoiningId] = useState(null)

  // Create form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'Tech',
    privacy: 'public',
  })
  const [createLoading, setCreateLoading] = useState(false)

  const fetchCommunities = async () => {
    setLoading(true)
    try {
      const params = {}
      if (search.trim()) params.q = search.trim()
      if (selectedCategory !== 'All') params.category = selectedCategory

      const { data } = await api.get('/communities', { params })
      setCommunities(data)
    } catch {
      toast.error('Failed to load communities')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(fetchCommunities, 300)
    return () => clearTimeout(timer)
  }, [search, selectedCategory])

  const handleToggleJoin = async (c) => {
    setJoiningId(c.id)
    const isMember = c.is_member
    try {
      if (isMember) {
        await api.delete(`/communities/${c.id}/leave`)
        setCommunities(prev => prev.map(item => item.id === c.id ? {
          ...item,
          is_member: false,
          member_count: Math.max(0, item.member_count - 1),
        } : item))
        toast.success(`Left ${c.name}`)
      } else {
        await api.post(`/communities/${c.id}/join`)
        setCommunities(prev => prev.map(item => item.id === c.id ? {
          ...item,
          is_member: true,
          member_count: item.member_count + 1,
        } : item))
        toast.success(`Joined ${c.name}! 🎉`)
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Action failed')
    } finally {
      setJoiningId(null)
    }
  }

  const handleCreateCommunity = async (e) => {
    e.preventDefault()
    if (!formData.name.trim()) return toast.error('Please enter a name')

    setCreateLoading(true)
    try {
      const body = new FormData()
      body.append('name', formData.name.trim())
      body.append('description', formData.description.trim())
      body.append('category', formData.category)
      body.append('privacy', formData.privacy)

      const { data } = await api.post('/communities', body)
      setCommunities(prev => [data, ...prev])
      setShowCreateModal(false)
      setFormData({ name: '', description: '', category: 'Tech', privacy: 'public' })
      toast.success(`Community "${data.name}" created! 🎉`)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create community')
    } finally {
      setCreateLoading(false)
    }
  }

  const filteredCommunities = communities.filter(c => {
    if (tab === 'joined') return c.is_member
    return true
  })

  return (
    <AppLayout>
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '1.5rem 1rem 3rem' }}>
        {/* Header banner */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.12) 0%, rgba(236, 72, 153, 0.12) 100%)',
          borderRadius: 16,
          padding: '2rem 1.5rem',
          marginBottom: '2rem',
          border: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{
                background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
                color: 'white', padding: '4px 10px', borderRadius: 999,
                fontSize: '0.75rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4,
              }}>
                <Sparkles size={12} /> Explore Spaces
              </span>
            </div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: '0 0 6px' }}>Communities</h1>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.95rem' }}>
              Connect with fellow creators, share expertise, and collaborate in dedicated spaces.
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary"
            style={{ gap: 8, padding: '0.65rem 1.25rem', fontSize: '0.925rem' }}
          >
            <Plus size={18} /> Create Community
          </button>
        </div>

        {/* Controls: Search, Tabs, Categories */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            {/* Search Input */}
            <div style={{
              position: 'relative', flex: 1, minWidth: 240,
              background: 'var(--bg-card)', borderRadius: 10,
              border: '1px solid var(--border-color)',
              display: 'flex', alignItems: 'center', padding: '0 0.875rem',
            }}>
              <Search size={18} color="var(--text-muted)" style={{ marginRight: 8 }} />
              <input
                type="text"
                placeholder="Search communities by name or topic..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: '100%', padding: '0.65rem 0',
                  background: 'none', border: 'none', outline: 'none',
                  color: 'var(--text-main)', fontSize: '0.9rem',
                }}
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', background: 'var(--bg-secondary)', padding: 4, borderRadius: 10, border: '1px solid var(--border-color)' }}>
              <button
                onClick={() => setTab('all')}
                style={{
                  padding: '6px 14px', borderRadius: 8, fontSize: '0.85rem', fontWeight: 600,
                  border: 'none', cursor: 'pointer',
                  background: tab === 'all' ? 'var(--bg-card)' : 'transparent',
                  color: tab === 'all' ? 'var(--primary-600)' : 'var(--text-muted)',
                  boxShadow: tab === 'all' ? 'var(--shadow-sm)' : 'none',
                }}
              >
                All ({communities.length})
              </button>
              <button
                onClick={() => setTab('joined')}
                style={{
                  padding: '6px 14px', borderRadius: 8, fontSize: '0.85rem', fontWeight: 600,
                  border: 'none', cursor: 'pointer',
                  background: tab === 'joined' ? 'var(--bg-card)' : 'transparent',
                  color: tab === 'joined' ? 'var(--primary-600)' : 'var(--text-muted)',
                  boxShadow: tab === 'joined' ? 'var(--shadow-sm)' : 'none',
                }}
              >
                Joined ({communities.filter(c => c.is_member).length})
              </button>
            </div>
          </div>

          {/* Category Chips */}
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: '5px 14px', borderRadius: 999, fontSize: '0.8rem', fontWeight: 600,
                  border: '1px solid', whiteSpace: 'nowrap', cursor: 'pointer',
                  transition: 'all 0.15s',
                  borderColor: selectedCategory === cat ? 'var(--primary-500)' : 'var(--border-color)',
                  background: selectedCategory === cat ? 'var(--primary-50)' : 'var(--bg-card)',
                  color: selectedCategory === cat ? 'var(--primary-700)' : 'var(--text-muted)',
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Communities Grid */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
            {[1, 2, 3, 4, 5, 6].map(n => (
              <div key={n} className="card" style={{ height: 260, padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div className="skeleton" style={{ height: 90, borderRadius: 8 }} />
                <div className="skeleton" style={{ height: 20, width: '60%' }} />
                <div className="skeleton" style={{ height: 14, width: '90%' }} />
                <div className="skeleton" style={{ height: 14, width: '40%' }} />
              </div>
            ))}
          </div>
        ) : filteredCommunities.length === 0 ? (
          <div className="card" style={{ padding: '3.5rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Users size={48} style={{ margin: '0 auto 1rem', opacity: 0.4 }} />
            <h3 style={{ margin: '0 0 6px', color: 'var(--text-main)' }}>No communities found</h3>
            <p style={{ margin: '0 0 1.25rem', fontSize: '0.9rem' }}>
              {tab === 'joined' ? "You haven't joined any communities yet." : "No communities match your criteria."}
            </p>
            <button onClick={() => setShowCreateModal(true)} className="btn btn-primary" style={{ margin: '0 auto', fontSize: '0.875rem' }}>
              Create a Community
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
            {filteredCommunities.map((c) => (
              <motion.div
                key={c.id}
                layout
                whileHover={{ y: -3, boxShadow: 'var(--shadow-md)' }}
                className="card"
                style={{
                  overflow: 'hidden', display: 'flex', flexDirection: 'column',
                  border: '1px solid var(--border-color)',
                }}
              >
                {/* Cover Image */}
                <div style={{
                  height: 90, background: c.cover_url ? `url(${c.cover_url}) center/cover` : 'linear-gradient(135deg, #6366f1, #a855f7)',
                  position: 'relative',
                }}>
                  <span style={{
                    position: 'absolute', top: 8, right: 8,
                    background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
                    color: 'white', borderRadius: 999, padding: '2px 8px',
                    fontSize: '0.7rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4,
                  }}>
                    {c.privacy === 'private' ? <Lock size={10} /> : <Globe size={10} />}
                    {c.privacy}
                  </span>
                </div>

                {/* Content */}
                <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', flex: 1, gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: -24 }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: 12,
                      background: 'var(--bg-card)', border: '2px solid var(--bg-card)',
                      boxShadow: 'var(--shadow-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 800, fontSize: '1.1rem', color: 'var(--primary-600)',
                      overflow: 'hidden',
                    }}>
                      {c.avatar_url ? (
                        <img src={c.avatar_url} alt={c.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        c.name.slice(0, 2).toUpperCase()
                      )}
                    </div>

                    {c.category && (
                      <span style={{
                        fontSize: '0.725rem', fontWeight: 600, padding: '2px 8px', borderRadius: 6,
                        background: 'var(--bg-secondary)', color: 'var(--text-muted)', border: '1px solid var(--border-color)',
                      }}>
                        {c.category}
                      </span>
                    )}
                  </div>

                  <h3 style={{ margin: '6px 0 2px', fontSize: '1.05rem', fontWeight: 700 }}>{c.name}</h3>
                  <p style={{
                    margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)',
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                    overflow: 'hidden', textOverflow: 'ellipsis', minHeight: 38,
                  }}>
                    {c.description || 'Welcome to our space! Join to participate in discussions and share content.'}
                  </p>

                  <div style={{ marginTop: 'auto', paddingTop: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Users size={14} /> {c.member_count} {c.member_count === 1 ? 'member' : 'members'}
                    </span>

                    <button
                      onClick={() => handleToggleJoin(c)}
                      disabled={joiningId === c.id}
                      className={c.is_member ? 'btn btn-secondary' : 'btn btn-primary'}
                      style={{ padding: '4px 12px', fontSize: '0.8rem', gap: 4 }}
                    >
                      {c.is_member ? (
                        <>
                          <Check size={14} /> Joined
                        </>
                      ) : (
                        <>
                          <Plus size={14} /> Join
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Create Community Modal */}
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Create New Community"
        >
          <form onSubmit={handleCreateCommunity} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 4 }}>
                Community Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Frontend Enthusiasts"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                style={{
                  width: '100%', padding: '0.65rem 0.875rem', borderRadius: 8,
                  background: 'var(--bg-input)', border: '1px solid var(--border-color)',
                  color: 'var(--text-main)', fontSize: '0.9rem', outline: 'none',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 4 }}>
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                style={{
                  width: '100%', padding: '0.65rem 0.875rem', borderRadius: 8,
                  background: 'var(--bg-input)', border: '1px solid var(--border-color)',
                  color: 'var(--text-main)', fontSize: '0.9rem', outline: 'none',
                }}
              >
                {CATEGORIES.filter(c => c !== 'All').map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 4 }}>
                Description
              </label>
              <textarea
                placeholder="What is this community about? Who should join?"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                style={{
                  width: '100%', padding: '0.65rem 0.875rem', borderRadius: 8,
                  background: 'var(--bg-input)', border: '1px solid var(--border-color)',
                  color: 'var(--text-main)', fontSize: '0.9rem', outline: 'none', resize: 'vertical',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 4 }}>
                Privacy
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <label style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '0.65rem 0.875rem',
                  borderRadius: 8, border: '1px solid', cursor: 'pointer',
                  borderColor: formData.privacy === 'public' ? 'var(--primary-500)' : 'var(--border-color)',
                  background: formData.privacy === 'public' ? 'var(--primary-50)' : 'transparent',
                }}>
                  <input
                    type="radio"
                    name="privacy"
                    value="public"
                    checked={formData.privacy === 'public'}
                    onChange={() => setFormData({ ...formData, privacy: 'public' })}
                  />
                  <Globe size={16} />
                  <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Public</span>
                </label>

                <label style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '0.65rem 0.875rem',
                  borderRadius: 8, border: '1px solid', cursor: 'pointer',
                  borderColor: formData.privacy === 'private' ? 'var(--primary-500)' : 'var(--border-color)',
                  background: formData.privacy === 'private' ? 'var(--primary-50)' : 'transparent',
                }}>
                  <input
                    type="radio"
                    name="privacy"
                    value="private"
                    checked={formData.privacy === 'private'}
                    onChange={() => setFormData({ ...formData, privacy: 'private' })}
                  />
                  <Lock size={16} />
                  <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Private</span>
                </label>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="btn btn-secondary"
                style={{ fontSize: '0.875rem' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createLoading}
                className="btn btn-primary"
                style={{ fontSize: '0.875rem' }}
              >
                {createLoading ? 'Creating...' : 'Create Space'}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </AppLayout>
  )
}
