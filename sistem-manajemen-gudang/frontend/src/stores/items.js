import { defineStore } from 'pinia'
import axios from 'axios'
import { useAuthStore } from './auth'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

export const useItemsStore = defineStore('items', {
  state: () => ({
    items: [],
    loading: false,
    error: null,
    pagination: {
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 0
    },
    search: ''
  }),

  actions: {
    async fetchItemsFromExternalAPI() {
      const authStore = useAuthStore()
      this.loading = true
      this.error = null

      try {
        const response = await axios.get(
          'https://auth.srs-ssms.com/api/dev/list-items',
          {
            headers: {
              Authorization: `Bearer ${authStore.token}`
            }
          }
        )

        if (response.data.statusCode === 1) {
          return response.data.data
        }
        return []
      } catch (error) {
        this.error = error.response?.data?.message || 'Gagal mengambil data dari API eksternal'
        return []
      } finally {
        this.loading = false
      }
    },

    async fetchItems(page = null, search = null) {
      this.loading = true
      this.error = null

      if (page !== null) this.pagination.page = page
      if (search !== null) this.search = search

      try {
        const params = new URLSearchParams({
          page: this.pagination.page,
          limit: this.pagination.limit
        })
        if (this.search) params.append('search', this.search)

        const response = await axios.get(`${API_URL}/items?${params}`)
        this.items = response.data.data || []
        if (response.data.pagination) {
          this.pagination = response.data.pagination
        }
      } catch (error) {
        this.error = error.response?.data?.message || 'Gagal mengambil data barang'
      } finally {
        this.loading = false
      }
    },

    setPage(page) {
      this.fetchItems(page)
    },

    setSearch(search) {
      this.pagination.page = 1
      this.fetchItems(1, search)
    },

    async syncFromExternalAPI() {
      const externalItems = await this.fetchItemsFromExternalAPI()

      if (externalItems.length > 0) {
        try {
          const response = await axios.post(`${API_URL}/items/sync`, {
            items: externalItems
          })

          if (response.data.success) {
            await this.fetchItems()
            return { success: true, message: 'Data berhasil disinkronkan' }
          }
        } catch (error) {
          return {
            success: false,
            message: error.response?.data?.message || 'Gagal menyinkronkan data'
          }
        }
      }

      return { success: false, message: 'Tidak ada data untuk disinkronkan' }
    },

    async addItem(item) {
      this.loading = true
      try {
        const response = await axios.post(`${API_URL}/items`, item)
        if (response.data.success) {
          await this.fetchItems()
          return { success: true, message: 'Barang berhasil ditambahkan' }
        }
        return { success: false, message: response.data.message }
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || 'Gagal menambahkan barang'
        }
      } finally {
        this.loading = false
      }
    },

    async updateItem(id, item) {
      this.loading = true
      try {
        const response = await axios.put(`${API_URL}/items/${id}`, item)
        if (response.data.success) {
          await this.fetchItems()
          return { success: true, message: 'Barang berhasil diupdate' }
        }
        return { success: false, message: response.data.message }
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || 'Gagal mengupdate barang'
        }
      } finally {
        this.loading = false
      }
    },

    async deleteItem(id) {
      this.loading = true
      try {
        const response = await axios.delete(`${API_URL}/items/${id}`)
        if (response.data.success) {
          await this.fetchItems()
          return { success: true, message: 'Barang berhasil dihapus' }
        }
        return { success: false, message: response.data.message }
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || 'Gagal menghapus barang'
        }
      } finally {
        this.loading = false
      }
    }
  }
})
