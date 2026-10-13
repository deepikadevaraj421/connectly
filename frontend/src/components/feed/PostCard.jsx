import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, MessageCircle, Bookmark, Share2, MoreHorizontal, Trash2, Send } from 'lucide-react'
import { Avatar } from '../ui'
import api from '../../api/client'
import { useAuthStore } from '../../store'
import toast from 'react-hot-toast'
import { formatDistanceToNow } from 'date-fns'

const REACTIONS = [
  { key: 'like', emoji: '👍', label: 'Like' },
  { key: 'love', emoji: '❤️', label: 'Love' },
  { key: 'haha', emoji: '😂', label: 'Haha' },
  { key: 'wow', emoji: '😮', label: 'Wow' },
  { key: 'sad', emoji: '😢', label: 'Sad' },
  { key: 'angry', emoji: '😠', label: 'Angry' },
]

export default function PostCard({ post: initialPost, onDelete }) {
  const [post, setPost] = useState(initialPost)
  const [showComments, setShowComments] = useState(false)
  const [comments, setComments] = useState([])
  const [commentText, setCommentText] = useState('')
  const [showReactions, setShowReactions] = useState(false)
  const [heartAnim, setHeartAnim] = useState(false)
  const [loadingComment, setLoadingComment] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const { user } = useAuthStore()
  const doubleClickTimer = useRef(null)

  const isOwner = user?.id === post.author_id

  const handleReact = async (type = 'like') => {
    try {
      const { data } = await api.post(`/posts/${post.id}/react`, { reaction_type: type })
      setPost(p => ({
        ...p,
        user_reaction: data.action === 'added' ? type : null,
        reactions_count: data.action === 'added' ? p.reactions_count + 1 : Math.max(0, p.reactions_count - 1),
      }))
      if (data.action === 'added' && type === 'love') {
        setHeartAnim(true)
        setTimeout(() => setHeartAnim(false), 700)
      }
    } catch { toast.error('Failed to react') }
    setShowReactions(false)
  }

  const handleDoubleClick = () => {
    if (!post.user_reaction) handleReact('love')
    setHeartAnim(true)
    setTimeout(() => setHeartAnim(false), 700)
  }

  const handleBookmark = async () => {
    try {
      const { data } = await api.post(`/posts/${post.id}/bookmark`)
      setPost(p => ({
        ...p,
        is_bookmarked: data.action === 'added',
        bookmarks_count: data.action === 'added' ? p.bookmarks_count + 1 : Math.max(0, p.bookmarks_count - 1),
      }))
    } catch { toast.error('Failed to bookmark') }
  }

  const loadComments = async () => {
    if (!showComments) {
      try {
        const { data } = await api.get(`/posts/${post.id}/comments`)
        setComments(data)
      } catch { toast.error('Failed to load comments') }
    }
    setShowComments(p => !p)
  }

  const submitComment = async (e) => {
    e.preventDefault()
    if (!commentText.trim()) return
    setLoadingComment(true)
    try {
      const { data } = await api.post(`/posts/${post.id}/comments`, { content: commentText })
      setComments(prev => [...prev, data])
      setPost(p => ({ ...p, comments_count: p.comments_count + 1 }))
      setCommentText('')
    } catch { toast.error('Failed to post comment') }
    setLoadingComment(false)
  }

  const handleDelete = async () => {
    if (!confirm('Delete this post?')) return
    try {
      await api.delete(`/posts/${post.id}`)
      onDelete?.(post.id)
      toast.success('Post deleted')
    } catch { toast.error('Failed to delete') }
    setShowMenu(false)
  }

  const reactionIcon = REACTIONS.find(r => r.key === post.user_reaction)?.emoji || '👍'

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="post-card"
      style={{ marginBottom: '1rem' }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.875rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <a href={`/profile/${post.author.username}`}>
            <Avatar src={post.author.profile?.avatar_url} name={post.author.full_name} size={42} />
          </a>
          <div>
            <a href={`/profile/${post.author.username}`} style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)', textDecoration: 'none' }}>
              {post.author.full_name}
            </a>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              @{post.author.username} · {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
            </div>
          </div>
        </div>
        <div style={{ position: 'relative' }}>
          <button onClick={() => setShowMenu(p => !p)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, borderRadius: 8, color: 'var(--text-muted)' }}>
            <MoreHorizontal size={18} />
          </button>
          <AnimatePresence>
            {showMenu && (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                className="card" style={{ position: 'absolute', right: 0, top: '110%', zIndex: 100, minWidth: 140, padding: '0.5rem' }}>
                {isOwner && (
                  <button onClick={handleDelete} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 12px', border: 'none', background: 'none', cursor: 'pointer', color: '#ef4444', borderRadius: 8, fontSize: '0.85rem', fontWeight: 500 }}>
                    <Trash2 size={15} /> Delete
                  </button>
                )}
                <button onClick={() => { navigator.clipboard.writeText(window.location.origin + '/post/' + post.id); toast.success('Link copied!'); setShowMenu(false) }}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 12px', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-secondary)', borderRadius: 8, fontSize: '0.85rem', fontWeight: 500 }}>
                  <Share2 size={15} /> Copy Link
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Content */}
      {post.content && (
        <p style={{ marginBottom: post.media?.length ? '0.75rem' : 0, lineHeight: 1.7, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
          {post.content}
        </p>
      )}

      {/* Media */}
      {post.media?.length > 0 && (
        <div style={{ position: 'relative', marginTop: '0.5rem', marginBottom: '0.5rem', borderRadius: 12, overflow: 'hidden', cursor: 'pointer' }}
          onDoubleClick={handleDoubleClick}>
          <img
            src={post.media[0].url}
            alt="post media"
            style={{ width: '100%', maxHeight: 480, objectFit: 'cover', display: 'block', borderRadius: 12 }}
          />
          {heartAnim && (
            <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 1.5, opacity: 0 }}
              style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', fontSize: '4rem', pointerEvents: 'none' }}>
              ❤️
            </motion.div>
          )}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: '0.875rem', paddingTop: '0.875rem', borderTop: '1px solid var(--border)' }}>
        {/* Reaction */}
        <div style={{ position: 'relative' }}>
          <button
            className={`reaction-btn ${post.user_reaction ? 'active' : ''}`}
            onClick={() => handleReact(post.user_reaction || 'like')}
            onMouseEnter={() => setShowReactions(true)}
            onMouseLeave={() => setShowReactions(false)}
          >
            <span>{post.user_reaction ? reactionIcon : '👍'}</span>
            <span>{post.reactions_count || 0}</span>
          </button>
          <AnimatePresence>
            {showReactions && (
              <motion.div
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
                onMouseEnter={() => setShowReactions(true)} onMouseLeave={() => setShowReactions(false)}
                className="glass card"
                style={{ position: 'absolute', bottom: '110%', left: 0, display: 'flex', gap: 4, padding: '8px 10px', zIndex: 50, borderRadius: 999 }}
              >
                {REACTIONS.map(r => (
                  <motion.button key={r.key} whileHover={{ scale: 1.3 }} onClick={() => handleReact(r.key)}
                    title={r.label}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.4rem', padding: '2px 4px' }}>
                    {r.emoji}
                  </motion.button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button className="reaction-btn" onClick={loadComments}>
          <MessageCircle size={16} />
          <span>{post.comments_count || 0}</span>
        </button>

        <button className={`reaction-btn ${post.is_bookmarked ? 'active' : ''}`} onClick={handleBookmark}>
          <Bookmark size={16} fill={post.is_bookmarked ? 'currentColor' : 'none'} />
          <span>{post.bookmarks_count || 0}</span>
        </button>

        <button className="reaction-btn" onClick={() => { navigator.clipboard.writeText(window.location.origin); toast.success('Link copied!') }}>
          <Share2 size={16} />
        </button>
      </div>

      {/* Comments */}
      <AnimatePresence>
        {showComments && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            style={{ marginTop: '0.875rem', paddingTop: '0.875rem', borderTop: '1px solid var(--border)', overflow: 'hidden' }}>
            {/* Comment input */}
            <form onSubmit={submitComment} style={{ display: 'flex', gap: 8, marginBottom: '0.875rem' }}>
              <Avatar src={user?.profile?.avatar_url} name={user?.full_name} size={32} />
              <div style={{ flex: 1, display: 'flex', gap: 6 }}>
                <input
                  value={commentText} onChange={e => setCommentText(e.target.value)}
                  placeholder="Write a comment..."
                  className="input-field" style={{ flex: 1, padding: '8px 12px', fontSize: '0.88rem' }}
                />
                <button type="submit" disabled={loadingComment || !commentText.trim()} className="btn-primary" style={{ padding: '8px 14px' }}>
                  <Send size={14} />
                </button>
              </div>
            </form>

            {/* Comment list */}
            {comments.map(c => (
              <motion.div key={c.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                style={{ display: 'flex', gap: 8, marginBottom: '0.75rem' }}>
                <Avatar src={c.author.profile?.avatar_url} name={c.author.full_name} size={30} />
                <div style={{ background: 'var(--surface-2)', borderRadius: 12, padding: '8px 12px', flex: 1 }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>{c.author.full_name}</div>
                  <div style={{ fontSize: '0.88rem', marginTop: 2 }}>{c.content}</div>
                </div>
              </motion.div>
            ))}
            {comments.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center' }}>No comments yet. Be first! 💬</p>}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
