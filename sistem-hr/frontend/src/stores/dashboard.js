import { defineStore } from 'pinia'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

export const useDashboardStore = defineStore('dashboard', {
  state: () => ({
    stats: null,
    loading: false,
    error: null
  }),

  actions: {
    async fetchStats() {
      this.loading = true
      this.error = null
      try {
        const response = await axios.get(`${API_URL}/dashboard/stats`)
        this.stats = response.data.data
      } catch (error) {
        this.error = error.response?.data?.message || 'Gagal mengambil data dashboard'
      } finally {
        this.loading = false
      }
    }
  }
})
