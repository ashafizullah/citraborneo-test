import { defineStore } from 'pinia'
import axios from 'axios'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: JSON.parse(localStorage.getItem('user')) || null,
    token: localStorage.getItem('token') || null
  }),

  getters: {
    isAuthenticated: (state) => !!state.token
  },

  actions: {
    async login(email, password) {
      try {
        const params = new URLSearchParams()
        params.append('email', email)
        params.append('password', password)

        const response = await axios.post(
          'https://auth.srs-ssms.com/api/dev/login',
          params,
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded'
            }
          }
        )

        if (response.data.statusCode === 1) {
          this.user = response.data.data
          this.token = response.data.data.api_token

          localStorage.setItem('user', JSON.stringify(this.user))
          localStorage.setItem('token', this.token)

          return { success: true, message: response.data.message }
        } else {
          return { success: false, message: response.data.message || 'Login gagal' }
        }
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || 'Terjadi kesalahan saat login'
        }
      }
    },

    logout() {
      this.user = null
      this.token = null
      localStorage.removeItem('user')
      localStorage.removeItem('token')
    }
  }
})
