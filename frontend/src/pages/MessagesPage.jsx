import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Search, Phone, Video, MoreHorizontal, Smile } from 'lucide-react'
import AppLayout from '../components/layout/AppLayout'
import { Avatar, Spinner } from '../components/ui'
import { useAuthStore } from '../store'
import api from '../api/client'
import toast from 'react-hot-toast'
import { formatDistanceToNow, format } from 'date-fns'

function TypingIndicator() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '8px 14px', background: 'var(--surface-2)', borderRadius: 18, borderBottomLeftRadius: 4, width: 60 }}>
      {[0, 1, 2].map(i => (
        <motion.div key={i} animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.15 }}
          style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--primary-400)' }} />
      ))}
    </div>
  )
}

export default function MessagesPage() {
  const { user, token } = useAuthStore()
  const [conversations, setConversations] = useState([])
  const [activeConv, setActiveConv] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [wsReady, setWsReady] = useState(false)
  const [typing, setTyping] = useState(false)
  const [typingTimeout, setTypingTimeout] = useState(null)
  const [loading, setLoading] = useState(true)
  const [msgLoading, setMsgLoading] = useState(false)
  const [searchQ, setSearchQ] = useState('')
  const ws = useRef(null)
  const bottomRef = useRef(null)
  const typingClearRef = useRef(null)

  // Load conversations
  useEffect(() => {
    api.get('/messages/conversations').then(r => {
      setConversations(r.data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  // WebSocket
  useEffect(() => {
    if (!token) return
    const connect = () => {
      const url = `ws://localhost:8000/api/messages/ws?token=${token}`
      ws.current = new WebSocket(url)
      ws.current.onopen = () => {
        setWsReady(true)
        // Keep-alive ping
        const ping = setInterval(() => ws.current?.send(JSON.stringify({ type: 'ping' })), 30000)
        ws.current._ping = ping
      }
      ws.current.onmessage = (e) => {
        const data = JSON.parse(e.data)
        if (data.type === 'new_message') {
          setMessages(prev => {
            if (prev.find(m => m.id === data.message.id)) return prev
            return [...prev, data.message]
          })
          // Update conversation last message
          setConversations(prev => prev.map(c =>
            c.id === data.message.conversation_id
              ? { ...c, last_message: data.message, unread_count: activeConv?.id === c.id ? 0 : (c.unread_count || 0) + 1 }
              : c
          ))
        }
        if (data.type === 'message_sent') {
          setMessages(prev => {
            if (prev.find(m => m.id === data.message.id)) return prev
            return [...prev, data.message]
          })
        }
        if (data.type === 'typing') {
          if (data.conversation_id === activeConv?.id && data.user_id !== user.id) {
            setTyping(true)
            clearTimeout(typingClearRef.current)
            typingClearRef.current = setTimeout(() => setTyping(false), 3000)
          }
        }
      }
      ws.current.onclose = () => {
        setWsReady(false)
        clearInterval(ws.current?._ping)
        setTimeout(connect, 3000) // reconnect
      }
      ws.current.onerror = () => ws.current?.close()
    }
    connect()
    return () => { ws.current?.close(); clearTimeout(typingClearRef.current) }
  }, [token])

  // Scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typing])

  const openConversation = async (conv) => {
    setActiveConv(conv)
    setMsgLoading(true)
    try {
      const { data } = await api.get(`/messages/conversations/${conv.id}/messages`)
      setMessages(data)
      // Mark as read
      setConversations(prev => prev.map(c => c.id === conv.id ? { ...c, unread_count: 0 } : c))
    } catch { toast.error('Failed to load messages') }
    setMsgLoading(false)
  }

  const sendMessage = (e) => {
    e?.preventDefault()
    if (!input.trim() || !activeConv || !wsReady) return
    ws.current.send(JSON.stringify({ type: 'send_message', conversation_id: activeConv.id, content: input }))
    setInput('')
  }

  const handleTyping = (e) => {
    setInput(e.target.value)
    if (ws.current && activeConv && wsReady) {
      ws.current.send(JSON.stringify({ type: 'typing', conversation_id: activeConv.id }))
    }
  }

  const filteredConvs = conversations.filter(c => {
    const other = c.members[0]
    return !searchQ || other?.full_name?.toLowerCase().includes(searchQ.toLowerCase())
  })

  const otherUser = activeConv?.members[0]

  return (
    <AppLayout>
      <div style={{ height: 'calc(100vh - 120px)', display: 'flex', gap: '1rem', minHeight: 500 }}>
        {/* Sidebar */}
        <div className="card" style={{ width: 300, flexShrink: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)' }}>
            <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '1rem' }}>Messages</h3>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input className="search-input" style={{ paddingLeft: 30, fontSize: '0.85rem' }}
                placeholder="Search conversations..." value={searchQ} onChange={e => setSearchQ(e.target.value)} />
            </div>
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}><Spinner /></div>
            ) : filteredConvs.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No conversations yet.<br />Explore people and start chatting!
              </div>
            ) : (
              filteredConvs.map(conv => {
                const other = conv.members[0]
                const isActive = activeConv?.id === conv.id
                return (
                  <motion.button key={conv.id} onClick={() => openConversation(conv)}
                    whileHover={{ x: 2 }}
                    style={{
                      width: '100%', padding: '0.875rem 1rem', border: 'none', cursor: 'pointer', textAlign: 'left',
                      background: isActive ? 'var(--primary-50)' : 'transparent',
                      borderLeft: isActive ? '3px solid var(--primary-500)' : '3px solid transparent',
                      display: 'flex', gap: 10, alignItems: 'center',
                    }}>
                    <div style={{ position: 'relative' }}>
                      <Avatar src={other?.profile?.avatar_url} name={other?.full_name || '?'} size={42} online={other?.is_online} />
                    </div>
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)' }}>{other?.full_name}</span>
                        {conv.last_message && <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{formatDistanceToNow(new Date(conv.last_message.created_at), { addSuffix: false })}</span>}
                      </div>
                      <div style={{ fontSize: '0.79rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 2 }}>
                        {conv.last_message?.content || 'Start a conversation'}
                      </div>
                    </div>
                    {conv.unread_count > 0 && (
                      <span style={{ background: 'var(--primary-500)', color: 'white', borderRadius: 999, fontSize: '0.7rem', fontWeight: 700, padding: '1px 6px', flexShrink: 0 }}>
                        {conv.unread_count}
                      </span>
                    )}
                  </motion.button>
                )
              })
            )}
          </div>
        </div>

        {/* Chat window */}
        <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {!activeConv ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💬</div>
              <h3 style={{ margin: 0 }}>Select a conversation</h3>
              <p style={{ fontSize: '0.88rem' }}>Choose from your conversations to start chatting</p>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
                <Avatar src={otherUser?.profile?.avatar_url} name={otherUser?.full_name || '?'} size={40} online={otherUser?.is_online} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{otherUser?.full_name}</div>
                  <div style={{ fontSize: '0.77rem', color: otherUser?.is_online ? '#22c55e' : 'var(--text-muted)' }}>
                    {otherUser?.is_online ? 'Online' : 'Offline'}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[Phone, Video, MoreHorizontal].map((Icon, i) => (
                    <button key={i} style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 10, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                      <Icon size={16} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Messages */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {msgLoading ? (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}><Spinner /></div>
                ) : messages.length === 0 ? (
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                    Say hello to {otherUser?.full_name}! 👋
                  </div>
                ) : (
                  <>
                    {messages.map((msg, i) => {
                      const isMine = msg.sender_id === user?.id
                      const showAvatar = !isMine && (i === 0 || messages[i - 1]?.sender_id !== msg.sender_id)
                      return (
                        <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                          style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start', alignItems: 'flex-end', gap: 8 }}>
                          {!isMine && <div style={{ width: 30 }}>{showAvatar && <Avatar src={msg.sender?.profile?.avatar_url} name={msg.sender?.full_name} size={28} />}</div>}
                          <div style={{ maxWidth: '70%' }}>
                            <div className={`msg-bubble ${isMine ? 'sent' : 'received'}`}>{msg.content}</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2, textAlign: isMine ? 'right' : 'left' }}>
                              {format(new Date(msg.created_at), 'HH:mm')}
                            </div>
                          </div>
                        </motion.div>
                      )
                    })}
                    {typing && (
                      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
                        <div style={{ width: 30 }}><Avatar src={otherUser?.profile?.avatar_url} name={otherUser?.full_name} size={28} /></div>
                        <TypingIndicator />
                      </div>
                    )}
                  </>
                )}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div style={{ padding: '0.875rem 1.25rem', borderTop: '1px solid var(--border)' }}>
                <form onSubmit={sendMessage} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '6px', borderRadius: 8 }}>
                    <Smile size={20} />
                  </button>
                  <input
                    value={input} onChange={handleTyping}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage(e)}
                    placeholder="Type a message..."
                    className="input-field" style={{ flex: 1 }}
                  />
                  <motion.button type="submit" disabled={!input.trim() || !wsReady}
                    className="btn-primary" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    style={{ padding: '10px 16px', opacity: !input.trim() ? 0.5 : 1 }}>
                    <Send size={16} />
                  </motion.button>
                </form>
                {!wsReady && <p style={{ color: '#f59e0b', fontSize: '0.76rem', marginTop: 4, textAlign: 'center' }}>⚡ Reconnecting...</p>}
              </div>
            </>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
