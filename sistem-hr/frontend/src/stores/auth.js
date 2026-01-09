import { defineStore } from 'pinia'
import axios from 'axios'

const API_URL = 'http://localhost:3001/api'

// Create axios instance with interceptors for token refresh
const api = axios.create({
  baseURL: API_URL
})

let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: JSON.parse(localStorage.getItem('hr_user')) || null,
    accessToken: localStorage.getItem('hr_access_token') || null,
    refreshToken: localStorage.getItem('hr_refresh_token') || null,
    tokenExpiresAt: parseInt(localStorage.getItem('hr_token_expires_at')) || null
  }),

  getters: {
    isAuthenticated: (state) => !!state.accessToken,
    isAdmin: (state) => state.user?.role === 'admin',
    token: (state) => state.accessToken // backward compatibility
  },

  actions: {
    async login(email, password) {
      try {
        const response = await axios.post(`${API_URL}/auth/login`, {
          email,
          password
        })

        if (response.data.success) {
          const { accessToken, refreshToken, expiresIn, user } = response.data.data

          this.user = user
          this.accessToken = accessToken
          this.refreshToken = refreshToken
          this.tokenExpiresAt = Date.now() + (expiresIn * 1000)

          localStorage.setItem('hr_user', JSON.stringify(this.user))
          localStorage.setItem('hr_access_token', accessToken)
          localStorage.setItem('hr_refresh_token', refreshToken)
          localStorage.setItem('hr_token_expires_at', this.tokenExpiresAt.toString())

          // Set default axios header
          axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`

          // Start token refresh timer
          this.startRefreshTimer()

          return { success: true, message: response.data.message }
        }
        return { success: false, message: response.data.message }
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || 'Terjadi kesalahan saat login'
        }
      }
    },

    async refreshAccessToken() {
      try {
        const response = await axios.post(`${API_URL}/auth/refresh`, {
          refreshToken: this.refreshToken
        })

        if (response.data.success) {
          const { accessToken, refreshToken, expiresIn } = response.data.data

          this.accessToken = accessToken
          this.refreshToken = refreshToken
          this.tokenExpiresAt = Date.now() + (expiresIn * 1000)

          localStorage.setItem('hr_access_token', accessToken)
          localStorage.setItem('hr_refresh_token', refreshToken)
          localStorage.setItem('hr_token_expires_at', this.tokenExpiresAt.toString())

          axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`

          return { success: true, accessToken }
        }
        return { success: false }
      } catch (error) {
        // Refresh token expired or invalid
        this.logout()
        return { success: false }
      }
    },

    startRefreshTimer() {
      // Refresh token 1 minute before expiry
      if (this.tokenExpiresAt) {
        const timeUntilRefresh = this.tokenExpiresAt - Date.now() - (60 * 1000)
        if (timeUntilRefresh > 0) {
          setTimeout(() => {
            this.refreshAccessToken()
          }, timeUntilRefresh)
        }
      }
    },

    async fetchCurrentUser() {
      try {
        const response = await axios.get(`${API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${this.accessToken}` }
        })

        if (response.data.success) {
          this.user = response.data.data
          localStorage.setItem('hr_user', JSON.stringify(this.user))
        }
      } catch (error) {
        if (error.response?.status === 401) {
          // Try to refresh token
          const refreshResult = await this.refreshAccessToken()
          if (refreshResult.success) {
            // Retry fetch user
            return this.fetchCurrentUser()
          }
        }
        this.logout()
      }
    },

    async logout() {
      try {
        if (this.accessToken) {
          await axios.post(`${API_URL}/auth/logout`, {}, {
            headers: { Authorization: `Bearer ${this.accessToken}` }
          })
        }
      } catch (error) {
        // Ignore logout errors
      }

      this.user = null
      this.accessToken = null
      this.refreshToken = null
      this.tokenExpiresAt = null

      localStorage.removeItem('hr_user')
      localStorage.removeItem('hr_access_token')
      localStorage.removeItem('hr_refresh_token')
      localStorage.removeItem('hr_token_expires_at')
      // Also remove legacy token
      localStorage.removeItem('hr_token')

      delete axios.defaults.headers.common['Authorization']
    },

    initAuth() {
      if (this.accessToken) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${this.accessToken}`

        // Check if token is about to expire
        if (this.tokenExpiresAt && this.tokenExpiresAt - Date.now() < 60 * 1000) {
          this.refreshAccessToken()
        } else {
          this.startRefreshTimer()
        }
      }
    }
  }
})

// Setup axios interceptor for automatic token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then(token => {
          originalRequest.headers['Authorization'] = `Bearer ${token}`
          return api(originalRequest)
        }).catch(err => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      const authStore = useAuthStore()
      const result = await authStore.refreshAccessToken()

      if (result.success) {
        processQueue(null, result.accessToken)
        originalRequest.headers['Authorization'] = `Bearer ${result.accessToken}`
        return api(originalRequest)
      } else {
        processQueue(error, null)
        return Promise.reject(error)
      }
    }

    return Promise.reject(error)
  }
)

export { api }
