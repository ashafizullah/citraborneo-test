import { defineStore } from 'pinia'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

export const useLeavesStore = defineStore('leaves', {
  state: () => ({
    leaves: [],
    loading: false,
    error: null
  }),

  actions: {
    async fetchLeaves(params = {}) {
      this.loading = true
      this.error = null
      try {
        const response = await axios.get(`${API_URL}/leaves`, { params })
        this.leaves = response.data.data
      } catch (error) {
        this.error = error.response?.data?.message || 'Gagal mengambil data cuti'
      } finally {
        this.loading = false
      }
    },

    async createLeave(data) {
      this.loading = true
      try {
        const response = await axios.post(`${API_URL}/leaves`, data)
        if (response.data.success) {
          await this.fetchLeaves()
          return { success: true, message: response.data.message }
        }
        return { success: false, message: response.data.message }
      } catch (error) {
        return { success: false, message: error.response?.data?.message || 'Gagal mengajukan cuti' }
      } finally {
        this.loading = false
      }
    },

    async updateLeave(id, data) {
      this.loading = true
      try {
        const response = await axios.put(`${API_URL}/leaves/${id}`, data)
        if (response.data.success) {
          await this.fetchLeaves()
          return { success: true, message: response.data.message }
        }
        return { success: false, message: response.data.message }
      } catch (error) {
        return { success: false, message: error.response?.data?.message || 'Gagal mengupdate cuti' }
      } finally {
        this.loading = false
      }
    },

    async approveLeave(id, status) {
      this.loading = true
      try {
        const response = await axios.put(`${API_URL}/leaves/${id}/approve`, { status })
        if (response.data.success) {
          await this.fetchLeaves()
          return { success: true, message: response.data.message }
        }
        return { success: false, message: response.data.message }
      } catch (error) {
        return { success: false, message: error.response?.data?.message || 'Gagal memproses cuti' }
      } finally {
        this.loading = false
      }
    },

    async deleteLeave(id) {
      this.loading = true
      try {
        const response = await axios.delete(`${API_URL}/leaves/${id}`)
        if (response.data.success) {
          await this.fetchLeaves()
          return { success: true, message: response.data.message }
        }
        return { success: false, message: response.data.message }
      } catch (error) {
        return { success: false, message: error.response?.data?.message || 'Gagal menghapus cuti' }
      } finally {
        this.loading = false
      }
    }
  }
})
