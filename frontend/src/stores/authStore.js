import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '../services/api'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      error: null,

      login: async (email, password) => {
        set({ isLoading: true, error: null })
        try {
          const response = await api.post('/auth/login', { email, password })
          const { token, user } = response.data
          
          set({ user, token, isLoading: false })
          localStorage.setItem('token', token)
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`
          
          return { success: true }
        } catch (error) {
          const errorMessage = error.response?.data?.error || 'Login failed'
          set({ error: errorMessage, isLoading: false })
          return { success: false, error: errorMessage }
        }
      },

      register: async (userData) => {
        set({ isLoading: true, error: null })
        try {
          const response = await api.post('/auth/register', userData)
          const { token, user } = response.data
          
          set({ user, token, isLoading: false })
          localStorage.setItem('token', token)
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`
          
          return { success: true }
        } catch (error) {
          const errorMessage = error.response?.data?.error || 'Registration failed'
          set({ error: errorMessage, isLoading: false })
          return { success: false, error: errorMessage }
        }
      },

      logout: () => {
        set({ user: null, token: null, error: null })
        localStorage.removeItem('token')
        delete api.defaults.headers.common['Authorization']
      },

      checkAuth: async () => {
        const token = localStorage.getItem('token')
        if (!token) return

        try {
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`
          const response = await api.get('/users/profile')
          set({ user: response.data, token })
        } catch (error) {
          get().logout()
        }
      },

      updateProfile: async (updates) => {
        set({ isLoading: true, error: null })
        try {
          const response = await api.put('/users/profile', updates)
          set({ user: response.data, isLoading: false })
          return { success: true }
        } catch (error) {
          const errorMessage = error.response?.data?.error || 'Profile update failed'
          set({ error: errorMessage, isLoading: false })
          return { success: false, error: errorMessage }
        }
      },

      connectStacks: async (stacksData) => {
        set({ isLoading: true, error: null })
        try {
          const response = await api.post('/auth/connect-stacks', {
            email: get().user.email,
            ...stacksData
          })
          
          const { token, user } = response.data
          set({ user, token, isLoading: false })
          
          return { success: true }
        } catch (error) {
          const errorMessage = error.response?.data?.error || 'Stacks connection failed'
          set({ error: errorMessage, isLoading: false })
          return { success: false, error: errorMessage }
        }
      },

      updateStreak: async () => {
        try {
          const response = await api.post('/users/update-streak')
          const currentUser = get().user
          if (currentUser) {
            set({ 
              user: { 
                ...currentUser, 
                streakDays: response.data.streakDays,
                lastActivityDate: response.data.lastActivity
              }
            })
          }
        } catch (error) {
          console.error('Failed to update streak:', error)
        }
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ token: state.token })
    }
  )
)