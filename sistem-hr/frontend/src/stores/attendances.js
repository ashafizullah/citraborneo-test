import { defineStore } from 'pinia'
import axios from 'axios'

const API_URL = 'http://localhost:3001/api'

export const useAttendancesStore = defineStore('attendances', {
  state: () => ({
    attendances: [],
    todayStatus: null,
    loading: false,
    error: null
  }),

  actions: {
    async fetchAttendances(params = {}) {
      this.loading = true
      this.error = null
      try {
        const response = await axios.get(`${API_URL}/attendances`, { params })
        this.attendances = response.data.data
      } catch (error) {
        this.error = error.response?.data?.message || 'Gagal mengambil data absensi'
      } finally {
        this.loading = false
      }
    },

    async fetchTodayStatus() {
      try {
        const response = await axios.get(`${API_URL}/attendances/today/status`)
        this.todayStatus = response.data.data
      } catch (error) {
        this.error = error.response?.data?.message || 'Gagal mengambil status absensi'
      }
    },

    async checkIn(employeeId = null) {
      this.loading = true
      try {
        const response = await axios.post(`${API_URL}/attendances/check-in`, {
          employee_id: employeeId
        })
        if (response.data.success) {
          await this.fetchTodayStatus()
          return { success: true, message: response.data.message }
        }
        return { success: false, message: response.data.message }
      } catch (error) {
        return { success: false, message: error.response?.data?.message || 'Gagal check-in' }
      } finally {
        this.loading = false
      }
    },

    async checkOut(employeeId = null) {
      this.loading = true
      try {
        const response = await axios.post(`${API_URL}/attendances/check-out`, {
          employee_id: employeeId
        })
        if (response.data.success) {
          await this.fetchTodayStatus()
          return { success: true, message: response.data.message }
        }
        return { success: false, message: response.data.message }
      } catch (error) {
        return { success: false, message: error.response?.data?.message || 'Gagal check-out' }
      } finally {
        this.loading = false
      }
    },

    async createAttendance(data) {
      this.loading = true
      try {
        const response = await axios.post(`${API_URL}/attendances`, data)
        if (response.data.success) {
          await this.fetchAttendances()
          return { success: true, message: response.data.message }
        }
        return { success: false, message: response.data.message }
      } catch (error) {
        return { success: false, message: error.response?.data?.message || 'Gagal menambahkan absensi' }
      } finally {
        this.loading = false
      }
    },

    async updateAttendance(id, data) {
      this.loading = true
      try {
        const response = await axios.put(`${API_URL}/attendances/${id}`, data)
        if (response.data.success) {
          await this.fetchAttendances()
          return { success: true, message: response.data.message }
        }
        return { success: false, message: response.data.message }
      } catch (error) {
        return { success: false, message: error.response?.data?.message || 'Gagal mengupdate absensi' }
      } finally {
        this.loading = false
      }
    },

    async deleteAttendance(id) {
      this.loading = true
      try {
        const response = await axios.delete(`${API_URL}/attendances/${id}`)
        if (response.data.success) {
          await this.fetchAttendances()
          return { success: true, message: response.data.message }
        }
        return { success: false, message: response.data.message }
      } catch (error) {
        return { success: false, message: error.response?.data?.message || 'Gagal menghapus absensi' }
      } finally {
        this.loading = false
      }
    }
  }
})
