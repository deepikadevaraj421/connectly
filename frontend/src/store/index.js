import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '../api/client'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      setAuth: (token, user) => {
        localStorage.setItem('connectly_token', token)
        set({ token, user, isAuthenticated: true })
      },

      updateUser: (user) => set({ user }),

      logout: () => {
        localStorage.removeItem('connectly_token')
        localStorage.removeItem('connectly_user')
        set({ token: null, user: null, isAuthenticated: false })
      },

      fetchMe: async () => {
        try {
          const { data } = await api.get('/auth/me')
          set({ user: data, isAuthenticated: true })
          return data
        } catch {
          get().logout()
        }
      },
    }),
    {
      name: 'connectly_auth',
      partialize: (s) => ({ token: s.token, user: s.user, isAuthenticated: s.isAuthenticated }),
    }
  )
)

export const useThemeStore = create(
  persist(
    (set) => ({
      theme: 'light',
      setTheme: (t) => {
        document.documentElement.classList.toggle('dark', t === 'dark')
        set({ theme: t })
      },
      toggleTheme: () => {
        const cur = document.documentElement.classList.contains('dark') ? 'dark' : 'light'
        const next = cur === 'dark' ? 'light' : 'dark'
        document.documentElement.classList.toggle('dark', next === 'dark')
        set({ theme: next })
      },
    }),
    { name: 'connectly_theme' }
  )
)

export const useNotifStore = create((set) => ({
  count: 0,
  notifications: [],
  setCount: (c) => set({ count: c }),
  setNotifications: (n) => set({ notifications: n }),
  addNotification: (n) => set((s) => ({ notifications: [n, ...s.notifications], count: s.count + 1 })),
  markAllRead: () => set((s) => ({ count: 0, notifications: s.notifications.map(n => ({ ...n, is_read: true })) })),
}))
