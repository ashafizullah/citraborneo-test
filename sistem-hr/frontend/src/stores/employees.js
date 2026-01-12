import { defineStore } from 'pinia'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

export const useEmployeesStore = defineStore('employees', {
  state: () => ({
    employees: [],
    employee: null,
    loading: false,
    error: null
  }),

  actions: {
    async fetchEmployees(params = {}) {
      this.loading = true
      this.error = null
      try {
        const response = await axios.get(`${API_URL}/employees`, { params })
        this.employees = response.data.data
      } catch (error) {
        this.error = error.response?.data?.message || 'Gagal mengambil data karyawan'
      } finally {
        this.loading = false
      }
    },

    async fetchEmployee(id) {
      this.loading = true
      try {
        const response = await axios.get(`${API_URL}/employees/${id}`)
        this.employee = response.data.data
        return response.data.data
      } catch (error) {
        this.error = error.response?.data?.message || 'Gagal mengambil data karyawan'
        return null
      } finally {
        this.loading = false
      }
    },

    async createEmployee(data) {
      this.loading = true
      try {
        const response = await axios.post(`${API_URL}/employees`, data)
        if (response.data.success) {
          await this.fetchEmployees()
          return { success: true, message: response.data.message }
        }
        return { success: false, message: response.data.message }
      } catch (error) {
        return { success: false, message: error.response?.data?.message || 'Gagal menambahkan karyawan' }
      } finally {
        this.loading = false
      }
    },

    async updateEmployee(id, data) {
      this.loading = true
      try {
        const response = await axios.put(`${API_URL}/employees/${id}`, data)
        if (response.data.success) {
          await this.fetchEmployees()
          return { success: true, message: response.data.message }
        }
        return { success: false, message: response.data.message }
      } catch (error) {
        return { success: false, message: error.response?.data?.message || 'Gagal mengupdate karyawan' }
      } finally {
        this.loading = false
      }
    },

    async deleteEmployee(id) {
      this.loading = true
      try {
        const response = await axios.delete(`${API_URL}/employees/${id}`)
        if (response.data.success) {
          await this.fetchEmployees()
          return { success: true, message: response.data.message }
        }
        return { success: false, message: response.data.message }
      } catch (error) {
        return { success: false, message: error.response?.data?.message || 'Gagal menghapus karyawan' }
      } finally {
        this.loading = false
      }
    }
  }
})
