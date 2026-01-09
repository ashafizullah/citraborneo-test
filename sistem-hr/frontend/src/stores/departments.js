import { defineStore } from 'pinia'
import axios from 'axios'

const API_URL = 'http://localhost:3001/api'

export const useDepartmentsStore = defineStore('departments', {
  state: () => ({
    departments: [],
    loading: false,
    error: null
  }),

  actions: {
    async fetchDepartments() {
      this.loading = true
      this.error = null
      try {
        const response = await axios.get(`${API_URL}/departments`)
        this.departments = response.data.data
      } catch (error) {
        this.error = error.response?.data?.message || 'Gagal mengambil data departemen'
      } finally {
        this.loading = false
      }
    },

    async createDepartment(data) {
      this.loading = true
      try {
        const response = await axios.post(`${API_URL}/departments`, data)
        if (response.data.success) {
          await this.fetchDepartments()
          return { success: true, message: response.data.message }
        }
        return { success: false, message: response.data.message }
      } catch (error) {
        return { success: false, message: error.response?.data?.message || 'Gagal menambahkan departemen' }
      } finally {
        this.loading = false
      }
    },

    async updateDepartment(id, data) {
      this.loading = true
      try {
        const response = await axios.put(`${API_URL}/departments/${id}`, data)
        if (response.data.success) {
          await this.fetchDepartments()
          return { success: true, message: response.data.message }
        }
        return { success: false, message: response.data.message }
      } catch (error) {
        return { success: false, message: error.response?.data?.message || 'Gagal mengupdate departemen' }
      } finally {
        this.loading = false
      }
    },

    async deleteDepartment(id) {
      this.loading = true
      try {
        const response = await axios.delete(`${API_URL}/departments/${id}`)
        if (response.data.success) {
          await this.fetchDepartments()
          return { success: true, message: response.data.message }
        }
        return { success: false, message: response.data.message }
      } catch (error) {
        return { success: false, message: error.response?.data?.message || 'Gagal menghapus departemen' }
      } finally {
        this.loading = false
      }
    }
  }
})
