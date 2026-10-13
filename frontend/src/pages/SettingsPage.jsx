import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  User, Bell, Moon, Sun, Shield, Lock, LogOut, Check,
  Save, Eye, EyeOff, AlertCircle
} from 'lucide-react'
import AppLayout from '../components/layout/AppLayout'
import { Avatar } from '../components/ui'
import { useAuthStore, useThemeStore } from '../store'
import api from '../api/client'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

export default function SettingsPage() {
  const { user, updateUser, logout } = useAuthStore()
  const { theme, setTheme, toggleTheme } = useThemeStore()
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState('profile') // 'profile' | 'appearance' | 'notifications' | 'security'
  const [loading, setLoading] = useState(false)

  // Profile Form State
  const [profileForm, setProfileForm] = useState({
    full_name: '',
    username: '',
    bio: '',
    location: '',
    website: '',
  })

  // Settings State
  const [settings, setSettings] = useState({
    theme: 'light',
    is_private: false,
    notify_follows: true,
    notify_likes: true,
    notify_comments: true,
    notify_messages: true,
  })

  // Password Form State
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  })
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    if (user) {
      setProfileForm({
        full_name: user.full_name || '',
        username: user.username || '',
        bio: user.profile?.bio || '',
        location: user.profile?.location || '',
        website: user.profile?.website || '',
      })
    }

    const loadSettings = async () => {
      try {
        const { data } = await api.get('/users/me/settings')
        setSettings(data)
      } catch {
        // use defaults
      }
    }
    loadSettings()
  }, [user])

  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('full_name', profileForm.full_name.trim())
      formData.append('username', profileForm.username.trim())
      formData.append('bio', profileForm.bio.trim())
      formData.append('location', profileForm.location.trim())
      formData.append('website', profileForm.website.trim())

      const { data } = await api.put('/users/me/profile', formData)
      updateUser(data)
      toast.success('Profile updated successfully! ✨')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleSetting = async (key) => {
    const nextVal = !settings[key]
    const nextSettings = { ...settings, [key]: nextVal }
    setSettings(nextSettings)
    try {
      await api.put('/users/me/settings', { [key]: nextVal })
      toast.success('Preference updated')
    } catch {
      toast.error('Failed to save preference')
    }
  }

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme)
    setSettings(prev => ({ ...prev, theme: newTheme }))
    api.put('/users/me/settings', { theme: newTheme }).catch(() => {})
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      return toast.error('New passwords do not match')
    }
    if (passwordForm.new_password.length < 6) {
      return toast.error('New password must be at least 6 characters')
    }

    setLoading(true)
    try {
      await api.post('/users/me/change-password', {
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
      })
      toast.success('Password changed successfully!')
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' })
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to change password')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/')
    toast.success('Signed out')
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'appearance', label: 'Appearance', icon: Moon },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
  ]

  return (
    <AppLayout>
      <div style={{ maxWidth: 840, margin: '0 auto', padding: '1.5rem 1rem 3rem' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.5rem' }}>Settings</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '2rem' }}>
          Manage your profile information, preferences, privacy, and account security.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '2rem', alignItems: 'start' }}>
          {/* Settings Sidebar Tabs */}
          <div className="card" style={{ padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {tabs.map(t => {
              const Icon = t.icon
              const active = activeTab === t.id
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '0.75rem 1rem', borderRadius: 8,
                    border: 'none', cursor: 'pointer', textAlign: 'left',
                    fontWeight: 600, fontSize: '0.9rem',
                    background: active ? 'var(--primary-50)' : 'transparent',
                    color: active ? 'var(--primary-700)' : 'var(--text-main)',
                    transition: 'all 0.15s',
                  }}
                >
                  <Icon size={18} color={active ? 'var(--primary-600)' : 'var(--text-muted)'} />
                  {t.label}
                </button>
              )
            })}

            <div style={{ height: 1, background: 'var(--border-color)', margin: '0.5rem 0' }} />

            <button
              onClick={handleLogout}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '0.75rem 1rem', borderRadius: 8,
                border: 'none', cursor: 'pointer', textAlign: 'left',
                fontWeight: 600, fontSize: '0.9rem',
                background: 'transparent', color: '#ef4444',
              }}
            >
              <LogOut size={18} />
              Sign Out
            </button>
          </div>

          {/* Settings Tab Content */}
          <div className="card" style={{ padding: '1.75rem' }}>
            {/* PROFILE TAB */}
            {activeTab === 'profile' && (
              <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', paddingBottom: '1.25rem', borderBottom: '1px solid var(--border-color)' }}>
                  <Avatar
                    src={user?.profile?.avatar_url}
                    name={user?.full_name || 'User'}
                    size={64}
                  />
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>{user?.full_name}</h3>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>@{user?.username}</span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 4 }}>Full Name</label>
                    <input
                      type="text"
                      value={profileForm.full_name}
                      onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                      required
                      style={{
                        width: '100%', padding: '0.65rem 0.875rem', borderRadius: 8,
                        background: 'var(--bg-input)', border: '1px solid var(--border-color)',
                        color: 'var(--text-main)', fontSize: '0.9rem', outline: 'none',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 4 }}>Username</label>
                    <input
                      type="text"
                      value={profileForm.username}
                      onChange={(e) => setProfileForm({ ...profileForm, username: e.target.value })}
                      required
                      style={{
                        width: '100%', padding: '0.65rem 0.875rem', borderRadius: 8,
                        background: 'var(--bg-input)', border: '1px solid var(--border-color)',
                        color: 'var(--text-main)', fontSize: '0.9rem', outline: 'none',
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 4 }}>Bio</label>
                  <textarea
                    rows={3}
                    placeholder="Tell everyone a little bit about yourself..."
                    value={profileForm.bio}
                    onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                    style={{
                      width: '100%', padding: '0.65rem 0.875rem', borderRadius: 8,
                      background: 'var(--bg-input)', border: '1px solid var(--border-color)',
                      color: 'var(--text-main)', fontSize: '0.9rem', outline: 'none', resize: 'vertical',
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 4 }}>Location</label>
                    <input
                      type="text"
                      placeholder="e.g. San Francisco, CA"
                      value={profileForm.location}
                      onChange={(e) => setProfileForm({ ...profileForm, location: e.target.value })}
                      style={{
                        width: '100%', padding: '0.65rem 0.875rem', borderRadius: 8,
                        background: 'var(--bg-input)', border: '1px solid var(--border-color)',
                        color: 'var(--text-main)', fontSize: '0.9rem', outline: 'none',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 4 }}>Website</label>
                    <input
                      type="url"
                      placeholder="https://yourwebsite.com"
                      value={profileForm.website}
                      onChange={(e) => setProfileForm({ ...profileForm, website: e.target.value })}
                      style={{
                        width: '100%', padding: '0.65rem 0.875rem', borderRadius: 8,
                        background: 'var(--bg-input)', border: '1px solid var(--border-color)',
                        color: 'var(--text-main)', fontSize: '0.9rem', outline: 'none',
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-primary"
                    style={{ gap: 8, padding: '0.65rem 1.5rem', fontSize: '0.9rem' }}
                  >
                    <Save size={16} />
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            )}

            {/* APPEARANCE TAB */}
            {activeTab === 'appearance' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div>
                  <h3 style={{ margin: '0 0 6px', fontSize: '1.05rem', fontWeight: 700 }}>Theme Mode</h3>
                  <p style={{ margin: '0 0 1rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                    Choose your interface color scheme. Connectly looks gorgeous in both light and dark modes.
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div
                      onClick={() => handleThemeChange('light')}
                      style={{
                        padding: '1.25rem', borderRadius: 12, border: '2px solid',
                        borderColor: theme === 'light' ? 'var(--primary-600)' : 'var(--border-color)',
                        cursor: 'pointer', background: '#f8fafc', color: '#0f172a',
                        display: 'flex', flexDirection: 'column', gap: 8,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Sun size={24} color="#f59e0b" />
                        {theme === 'light' && <Check size={18} color="var(--primary-600)" />}
                      </div>
                      <span style={{ fontWeight: 700 }}>Light Mode</span>
                      <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Clean, bright and crisp contrast</span>
                    </div>

                    <div
                      onClick={() => handleThemeChange('dark')}
                      style={{
                        padding: '1.25rem', borderRadius: 12, border: '2px solid',
                        borderColor: theme === 'dark' ? 'var(--primary-600)' : 'var(--border-color)',
                        cursor: 'pointer', background: '#090d16', color: '#f8fafc',
                        display: 'flex', flexDirection: 'column', gap: 8,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Moon size={24} color="#818cf8" />
                        {theme === 'dark' && <Check size={18} color="var(--primary-600)" />}
                      </div>
                      <span style={{ fontWeight: 700 }}>Dark Mode</span>
                      <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Sleek, deep contrast with neon accents</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* NOTIFICATIONS TAB */}
            {activeTab === 'notifications' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>Notification Preferences</h3>
                <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                  Control which activity alerts you wish to receive in real time.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
                  {[
                    { key: 'notify_likes', label: 'Likes & Reactions', desc: 'Notify when someone likes or reacts to your posts' },
                    { key: 'notify_comments', label: 'Comments & Replies', desc: 'Notify when someone comments on your post' },
                    { key: 'notify_follows', label: 'New Followers', desc: 'Notify when another creator follows you' },
                    { key: 'notify_messages', label: 'Direct Messages', desc: 'Notify for new real-time direct messages' },
                  ].map(item => (
                    <div
                      key={item.key}
                      onClick={() => handleToggleSetting(item.key)}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '1rem', borderRadius: 10, background: 'var(--bg-secondary)',
                        border: '1px solid var(--border-color)', cursor: 'pointer',
                      }}
                    >
                      <div>
                        <h4 style={{ margin: '0 0 2px', fontSize: '0.925rem', fontWeight: 600 }}>{item.label}</h4>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{item.desc}</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={Boolean(settings[item.key])}
                        onChange={() => {}}
                        style={{ width: 18, height: 18, cursor: 'pointer' }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SECURITY TAB */}
            {activeTab === 'security' && (
              <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>Change Password</h3>
                <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                  Ensure your account is using a strong, unique password.
                </p>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 4 }}>Current Password</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={passwordForm.current_password}
                    onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                    required
                    style={{
                      width: '100%', padding: '0.65rem 0.875rem', borderRadius: 8,
                      background: 'var(--bg-input)', border: '1px solid var(--border-color)',
                      color: 'var(--text-main)', fontSize: '0.9rem', outline: 'none',
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 4 }}>New Password</label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={passwordForm.new_password}
                      onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                      required
                      style={{
                        width: '100%', padding: '0.65rem 0.875rem', borderRadius: 8,
                        background: 'var(--bg-input)', border: '1px solid var(--border-color)',
                        color: 'var(--text-main)', fontSize: '0.9rem', outline: 'none',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 4 }}>Confirm New Password</label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={passwordForm.confirm_password}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                      required
                      style={{
                        width: '100%', padding: '0.65rem 0.875rem', borderRadius: 8,
                        background: 'var(--bg-input)', border: '1px solid var(--border-color)',
                        color: 'var(--text-main)', fontSize: '0.9rem', outline: 'none',
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', cursor: 'pointer', color: 'var(--text-muted)' }}>
                    <input
                      type="checkbox"
                      checked={showPassword}
                      onChange={(e) => setShowPassword(e.target.checked)}
                    />
                    Show password characters
                  </label>

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-primary"
                    style={{ padding: '0.65rem 1.5rem', fontSize: '0.9rem' }}
                  >
                    {loading ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
