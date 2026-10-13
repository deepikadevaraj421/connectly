import { motion, AnimatePresence } from 'framer-motion'

export const Avatar = ({ src, name = '', size = 40, ring = false, online = false, className = '' }) => {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  return (
    <div className={`relative inline-flex flex-shrink-0 ${className}`} style={{ width: size, height: size }}>
      <div className={ring ? 'story-ring' : ''} style={{ width: size, height: size, borderRadius: '50%' }}>
        {src ? (
          <img
            src={src}
            alt={name}
            className="avatar"
            style={{ width: ring ? size - 6 : size, height: ring ? size - 6 : size, margin: ring ? 3 : 0 }}
            onError={(e) => { e.target.style.display='none'; e.target.nextSibling.style.display='flex' }}
          />
        ) : null}
        <div
          style={{
            width: ring ? size - 6 : size, height: ring ? size - 6 : size,
            borderRadius: '50%', display: src ? 'none' : 'flex',
            alignItems: 'center', justifyContent: 'center',
            background: 'linear-gradient(135deg, #7c3aed, #f472b6)',
            color: 'white', fontWeight: 700,
            fontSize: size * 0.35,
            margin: ring ? 3 : 0,
          }}
        >
          {initials}
        </div>
      </div>
      {online && (
        <span className="online-dot" style={{ position: 'absolute', bottom: 0, right: 0 }} />
      )}
    </div>
  )
}

export const Skeleton = ({ width = '100%', height = 16, className = '' }) => (
  <div className={`skeleton ${className}`} style={{ width, height, borderRadius: 8 }} />
)

export const SkeletonPost = () => (
  <div className="post-card space-y-3">
    <div className="flex items-center gap-3">
      <Skeleton width={44} height={44} className="!rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton height={14} width="40%" />
        <Skeleton height={12} width="25%" />
      </div>
    </div>
    <Skeleton height={14} />
    <Skeleton height={14} width="80%" />
    <Skeleton height={200} />
  </div>
)

export const Badge = ({ children, color = 'primary' }) => {
  const colors = {
    primary: 'background:var(--primary-50);color:var(--primary-700);border:1px solid var(--primary-200)',
    green: 'background:#f0fdf4;color:#16a34a;border:1px solid #bbf7d0',
    red: 'background:#fef2f2;color:#dc2626;border:1px solid #fecaca',
  }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', padding: '2px 10px',
      borderRadius: 999, fontSize: '0.75rem', fontWeight: 600,
      ...(Object.fromEntries(colors[color].split(';').map(s => s.split(':')))),
    }}>
      {children}
    </span>
  )
}

export const Modal = ({ isOpen, onClose, title, children }) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '1rem', backdropFilter: 'blur(4px)',
        }}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', damping: 25 }}
          onClick={(e) => e.stopPropagation()}
          className="card"
          style={{ width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto', padding: '1.5rem' }}
        >
          {title && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{title}</h3>
              <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.25rem', color: 'var(--text-muted)' }}>×</button>
            </div>
          )}
          {children}
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
)

export const Toast = () => null // react-hot-toast handles this

export const Spinner = ({ size = 24 }) => (
  <div style={{
    width: size, height: size, borderRadius: '50%',
    border: `3px solid var(--primary-100)`,
    borderTopColor: 'var(--primary-500)',
    animation: 'spin-slow 0.7s linear infinite',
    flexShrink: 0,
  }} />
)
