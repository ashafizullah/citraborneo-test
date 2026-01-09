import { defineStore } from 'pinia'
import axios from 'axios'

const API_URL = 'http://localhost:3001/api'

export const usePositionsStore = defineStore('positions', {
  state: () => ({
    positions: [],
    loading: false,
    error: null
  }),

  actions: {
    async fetchPositions(departmentId = null) {
      this.loading = true
      this.error = null
      try {
        const params = departmentId ? { department_id: departmentId } : {}
        const response = await axios.get(`${API_URL}/positions`, { params })
        this.positions = response.data.data
      } catch (error) {
        this.error = error.response?.data?.message || 'Gagal mengambil data jabatan'
      } finally {
        this.loading = false
      }
    },

    async createPosition(data) {
      this.loading = true
      try {
        const response = await axios.post(`${API_URL}/positions`, data)
        if (response.data.success) {
          await this.fetchPositions()
          return { success: true, message: response.data.message }
        }
        return { success: false, message: response.data.message }
      } catch (error) {
        return { success: false, message: error.response?.data?.message || 'Gagal menambahkan jabatan' }
      } finally {
        this.loading = false
      }
    },

    async updatePosition(id, data) {
      this.loading = true
      try {
        const response = await axios.put(`${API_URL}/positions/${id}`, data)
        if (response.data.success) {
          await this.fetchPositions()
          return { success: true, message: response.data.message }
        }
        return { success: false, message: response.data.message }
      } catch (error) {
        return { success: false, message: error.response?.data?.message || 'Gagal mengupdate jabatan' }
      } finally {
        this.loading = false
      }
    },

    async deletePosition(id) {
      this.loading = true
      try {
        const response = await axios.delete(`${API_URL}/positions/${id}`)
        if (response.data.success) {
          await this.fetchPositions()
          return { success: true, message: response.data.message }
        }
        return { success: false, message: response.data.message }
      } catch (error) {
        return { success: false, message: error.response?.data?.message || 'Gagal menghapus jabatan' }
      } finally {
        this.loading = false
      }
    }
  }
})
