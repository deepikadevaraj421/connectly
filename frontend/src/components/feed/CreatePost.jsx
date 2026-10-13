import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Image, X, Send } from 'lucide-react'
import { Avatar } from '../ui'
import api from '../../api/client'
import toast from 'react-hot-toast'

export default function CreatePost({ user, onPostCreated }) {
  const [content, setContent] = useState('')
  const [files, setFiles] = useState([])
  const [previews, setPreviews] = useState([])
  const [loading, setLoading] = useState(false)
  const fileRef = useRef()

  const handleFiles = (e) => {
    const selected = Array.from(e.target.files)
    setFiles(selected)
    setPreviews(selected.map(f => URL.createObjectURL(f)))
  }

  const removeFile = (i) => {
    setFiles(f => f.filter((_, idx) => idx !== i))
    setPreviews(p => p.filter((_, idx) => idx !== i))
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!content.trim() && files.length === 0) return
    setLoading(true)
    try {
      const form = new FormData()
      if (content) form.append('content', content)
      files.forEach(f => form.append('files', f))
      const { data } = await api.post('/posts', form, { headers: { 'Content-Type': 'multipart/form-data' } })
      onPostCreated?.(data)
      setContent('')
      setFiles([])
      setPreviews([])
      toast.success('Post shared! 🎉')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create post')
    }
    setLoading(false)
  }

  return (
    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="post-card" style={{ marginBottom: '1rem' }}>
      <form onSubmit={submit}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <Avatar src={user?.profile?.avatar_url} name={user?.full_name} size={42} />
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="What's on your mind?"
            rows={3}
            style={{
              flex: 1, border: 'none', outline: 'none', resize: 'none',
              fontSize: '0.95rem', background: 'transparent', color: 'var(--text-primary)',
              fontFamily: 'inherit', lineHeight: 1.6, padding: '4px 0',
            }}
          />
        </div>

        {previews.length > 0 && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: '0.75rem' }}>
            {previews.map((p, i) => (
              <div key={i} style={{ position: 'relative', borderRadius: 8, overflow: 'hidden' }}>
                <img src={p} alt="" style={{ width: 100, height: 80, objectFit: 'cover', borderRadius: 8 }} />
                <button type="button" onClick={() => removeFile(i)}
                  style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%', width: 20, height: 20, cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.875rem', paddingTop: '0.875rem', borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" onClick={() => fileRef.current?.click()}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 999, border: '1.5px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500 }}>
              <Image size={16} /> Photo
            </button>
            <input ref={fileRef} type="file" accept="image/*,video/*" multiple onChange={handleFiles} style={{ display: 'none' }} />
          </div>

          <motion.button
            type="submit"
            disabled={loading || (!content.trim() && files.length === 0)}
            className="btn-primary"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            style={{ opacity: (loading || (!content.trim() && files.length === 0)) ? 0.6 : 1 }}
          >
            {loading ? 'Posting...' : <><Send size={15} /> Post</>}
          </motion.button>
        </div>
      </form>
    </motion.div>
  )
}
