import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, Link2, Calendar, Edit3, UserPlus, UserCheck, Grid, FileText, Users } from 'lucide-react'
import AppLayout from '../components/layout/AppLayout'
import PostCard from '../components/feed/PostCard'
import { Avatar, SkeletonPost, Modal, Spinner } from '../components/ui'
import { useAuthStore } from '../store'
import api from '../api/client'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

const TABS = [
  { key: 'posts', label: 'Posts', icon: FileText },
  { key: 'media', label: 'Media', icon: Grid },
  { key: 'about', label: 'About', icon: Users },
]

export default function ProfilePage() {
  const { username } = useParams()
  const { user: me, updateUser } = useAuthStore()
  const [profile, setProfile] = useState(null)
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('posts')
  const [isFollowing, setIsFollowing] = useState(false)
  const [followCount, setFollowCount] = useState(0)
  const [editOpen, setEditOpen] = useState(false)
  const [editForm, setEditForm] = useState({ full_name: '', bio: '', location: '', website: '' })
  const [avatarFile, setAvatarFile] = useState(null)
  const [coverFile, setCoverFile] = useState(null)
  const [saving, setSaving] = useState(false)

  const targetUsername = username || me?.username
  const isMe = !username || username === me?.username

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const [uRes, pRes] = await Promise.all([
          api.get(`/users/${targetUsername}`),
          api.get(`/posts/user/${targetUsername}`),
        ])
        setProfile(uRes.data)
        setPosts(pRes.data)
        setIsFollowing(uRes.data.is_following)
        setFollowCount(uRes.data.followers_count)
        setEditForm({
          full_name: uRes.data.full_name,
          bio: uRes.data.profile?.bio || '',
          location: uRes.data.profile?.location || '',
          website: uRes.data.profile?.website || '',
        })
      } catch { toast.error('Failed to load profile') }
      setLoading(false)
    }
    load()
  }, [targetUsername])

  const handleFollow = async () => {
    try {
      if (isFollowing) {
        await api.delete(`/users/${profile.id}/follow`)
        setIsFollowing(false)
        setFollowCount(c => c - 1)
        toast.success('Unfollowed')
      } else {
        await api.post(`/users/${profile.id}/follow`)
        setIsFollowing(true)
        setFollowCount(c => c + 1)
        toast.success('Following!')
      }
    } catch (err) {
      if (err.response?.status === 409) { setIsFollowing(true); setFollowCount(c => c + 1) }
      else toast.error('Failed')
    }
  }

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const form = new FormData()
      Object.entries(editForm).forEach(([k, v]) => v && form.append(k, v))
      if (avatarFile) form.append('avatar', avatarFile)
      if (coverFile) form.append('cover', coverFile)
      const { data } = await api.put('/users/me/profile', form, { headers: { 'Content-Type': 'multipart/form-data' } })
      setProfile(data)
      updateUser(data)
      setEditOpen(false)
      toast.success('Profile updated!')
    } catch { toast.error('Failed to save') }
    setSaving(false)
  }

  if (loading) return (
    <AppLayout>
      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        <div className="skeleton" style={{ height: 200, borderRadius: 16, marginBottom: '1rem' }} />
        <SkeletonPost />
      </div>
    </AppLayout>
  )

  if (!profile) return <AppLayout><div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>User not found</div></AppLayout>

  const mediaPosts = posts.filter(p => p.media?.length > 0)

  return (
    <AppLayout>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        {/* Cover */}
        <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', marginBottom: '0', height: 200 }}>
          <img
            src={profile.profile?.cover_url || `https://picsum.photos/seed/${profile.username}/1200/400`}
            alt="cover"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.4))' }} />
        </div>

        {/* Profile Header Card */}
        <div className="card" style={{ padding: '1.5rem', marginBottom: '1rem', position: 'relative' }}>
          {/* Avatar */}
          <div style={{ position: 'absolute', top: -44, left: '1.5rem' }}>
            <Avatar src={profile.profile?.avatar_url} name={profile.full_name} size={88}
              ring className="shadow-xl" />
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
            {isMe ? (
              <motion.button onClick={() => setEditOpen(true)} className="btn-secondary" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                <Edit3 size={15} /> Edit Profile
              </motion.button>
            ) : (
              <motion.button onClick={handleFollow}
                className={isFollowing ? 'btn-secondary' : 'btn-primary'}
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                {isFollowing ? <><UserCheck size={15} /> Following</> : <><UserPlus size={15} /> Follow</>}
              </motion.button>
            )}
          </div>

          {/* Info */}
          <h2 style={{ margin: '0 0 4px 0', fontSize: '1.3rem' }}>{profile.full_name}</h2>
          <p style={{ margin: '0 0 8px 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>@{profile.username}</p>
          {profile.profile?.bio && <p style={{ margin: '0 0 12px 0', lineHeight: 1.6, fontSize: '0.93rem' }}>{profile.profile.bio}</p>}

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px 20px', fontSize: '0.83rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            {profile.profile?.location && <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><MapPin size={13} />{profile.profile.location}</span>}
            {profile.profile?.website && <a href={profile.profile.website} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--primary-500)', textDecoration: 'none' }}><Link2 size={13} />{profile.profile.website.replace(/^https?:\/\//, '')}</a>}
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Calendar size={13} />Joined {format(new Date(profile.created_at), 'MMM yyyy')}</span>
          </div>

          <div style={{ display: 'flex', gap: 24, fontSize: '0.88rem' }}>
            <div><strong>{profile.following_count}</strong> <span style={{ color: 'var(--text-muted)' }}>Following</span></div>
            <div><strong>{followCount}</strong> <span style={{ color: 'var(--text-muted)' }}>Followers</span></div>
            <div><strong>{posts.length}</strong> <span style={{ color: 'var(--text-muted)' }}>Posts</span></div>
          </div>
        </div>

        {/* Tabs */}
        <div className="card" style={{ padding: '0 1rem', marginBottom: '1rem', display: 'flex', gap: 0 }}>
          {TABS.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setTab(key)}
              style={{
                flex: 1, padding: '1rem 0', border: 'none', background: 'none', cursor: 'pointer',
                fontSize: '0.88rem', fontWeight: 600, color: tab === key ? 'var(--primary-600)' : 'var(--text-muted)',
                borderBottom: tab === key ? '2px solid var(--primary-500)' : '2px solid transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all 0.15s',
              }}>
              <Icon size={15} /> {label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            {tab === 'posts' && (
              posts.length === 0
                ? <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>No posts yet</div>
                : posts.map(p => <PostCard key={p.id} post={p} onDelete={id => setPosts(prev => prev.filter(x => x.id !== id))} />)
            )}
            {tab === 'media' && (
              mediaPosts.length === 0
                ? <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>No media yet</div>
                : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4 }}>
                    {mediaPosts.map(p => (
                      <motion.img key={p.id} src={p.media[0].url} alt="" whileHover={{ opacity: 0.85 }}
                        style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: 4, cursor: 'pointer' }} />
                    ))}
                  </div>
            )}
            {tab === 'about' && (
              <div className="card" style={{ padding: '1.5rem' }}>
                <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.95rem' }}>About</h4>
                {[
                  ['Full Name', profile.full_name],
                  ['Username', `@${profile.username}`],
                  ['Email', isMe ? profile.email : '—'],
                  ['Bio', profile.profile?.bio],
                  ['Location', profile.profile?.location],
                  ['Website', profile.profile?.website],
                  ['Member Since', format(new Date(profile.created_at), 'MMMM d, yyyy')],
                ].map(([k, v]) => v && (
                  <div key={k} style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', width: 110, flexShrink: 0 }}>{k}</span>
                    <span style={{ fontSize: '0.88rem' }}>{v}</span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Edit Profile Modal */}
      <Modal isOpen={editOpen} onClose={() => setEditOpen(false)} title="Edit Profile">
        <form onSubmit={handleSaveProfile}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: 6, display: 'block' }}>Full Name</label>
            <input className="input-field" value={editForm.full_name} onChange={e => setEditForm(f => ({ ...f, full_name: e.target.value }))} />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: 6, display: 'block' }}>Bio</label>
            <textarea className="input-field" rows={3} value={editForm.bio} onChange={e => setEditForm(f => ({ ...f, bio: e.target.value }))} style={{ resize: 'vertical' }} />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: 6, display: 'block' }}>Location</label>
            <input className="input-field" value={editForm.location} onChange={e => setEditForm(f => ({ ...f, location: e.target.value }))} />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: 6, display: 'block' }}>Website</label>
            <input className="input-field" value={editForm.website} onChange={e => setEditForm(f => ({ ...f, website: e.target.value }))} />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: 6, display: 'block' }}>Profile Picture</label>
            <input type="file" accept="image/*" onChange={e => setAvatarFile(e.target.files[0])} />
          </div>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: 6, display: 'block' }}>Cover Image</label>
            <input type="file" accept="image/*" onChange={e => setCoverFile(e.target.files[0])} />
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" className="btn-secondary" onClick={() => setEditOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  )
}
