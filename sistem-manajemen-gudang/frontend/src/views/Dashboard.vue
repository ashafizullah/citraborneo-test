<template>
  <div class="min-h-screen bg-gray-100 flex flex-col">
    <!-- Header -->
    <header class="bg-white shadow">
      <div class="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8 flex justify-between items-center">
        <h1 class="text-base sm:text-xl font-bold text-gray-800">Sistem Manajemen Gudang</h1>
        <div class="flex items-center gap-2 sm:gap-4">
          <span class="text-gray-600 text-sm hidden sm:block">{{ authStore.user?.name }}</span>
          <button
            @click="handleLogout"
            class="bg-red-500 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-red-600 text-xs sm:text-sm"
          >
            Logout
          </button>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 flex-1">
      <!-- Actions -->
      <div class="mb-6 flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
        <div class="flex flex-col gap-2 sm:flex-row sm:gap-4 w-full sm:w-auto">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Cari barang..."
            class="w-full sm:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            @input="handleSearch"
          />
        </div>
        <div class="flex gap-2">
          <button
            @click="showAddModal = true"
            class="flex-1 sm:flex-none bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            + Tambah Barang
          </button>
          <button
            @click="syncData"
            :disabled="itemsStore.loading"
            class="flex-1 sm:flex-none bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            Sync dari API
          </button>
        </div>
      </div>

      <!-- Alert Messages -->
      <div v-if="message" :class="[
        'mb-4 p-4 rounded-lg',
        message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
      ]">
        {{ message.text }}
      </div>

      <!-- Loading -->
      <div v-if="itemsStore.loading" class="text-center py-8">
        <p class="text-gray-600">Memuat data...</p>
      </div>

      <!-- Items Table -->
      <div v-else class="bg-white rounded-lg shadow overflow-hidden">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                No
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nama Barang
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stok
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Satuan
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-if="itemsStore.items.length === 0">
              <td colspan="5" class="px-6 py-4 text-center text-gray-500">
                Tidak ada data barang. Klik "Sync dari API" atau "Tambah Barang".
              </td>
            </tr>
            <tr v-for="(item, index) in itemsStore.items" :key="item.id">
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {{ (itemsStore.pagination.page - 1) * itemsStore.pagination.limit + index + 1 }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {{ item.item_name }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {{ item.stock }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {{ item.unit }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                <button
                  @click="editItem(item)"
                  class="text-blue-600 hover:text-blue-900"
                >
                  Edit
                </button>
                <button
                  @click="confirmDelete(item)"
                  class="text-red-600 hover:text-red-900"
                >
                  Hapus
                </button>
              </td>
            </tr>
          </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div v-if="itemsStore.pagination.totalPages > 1" class="px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div class="text-sm text-gray-600">
            Menampilkan {{ (itemsStore.pagination.page - 1) * itemsStore.pagination.limit + 1 }} -
            {{ Math.min(itemsStore.pagination.page * itemsStore.pagination.limit, itemsStore.pagination.total) }}
            dari {{ itemsStore.pagination.total }} data
          </div>
          <div class="flex gap-2">
            <button
              @click="goToPage(1)"
              :disabled="itemsStore.pagination.page === 1"
              class="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              &laquo;
            </button>
            <button
              @click="goToPage(itemsStore.pagination.page - 1)"
              :disabled="itemsStore.pagination.page === 1"
              class="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              &lsaquo;
            </button>
            <template v-for="page in visiblePages" :key="page">
              <button
                @click="goToPage(page)"
                :class="[
                  'px-3 py-1 border rounded',
                  page === itemsStore.pagination.page
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'border-gray-300 hover:bg-gray-50'
                ]"
              >
                {{ page }}
              </button>
            </template>
            <button
              @click="goToPage(itemsStore.pagination.page + 1)"
              :disabled="itemsStore.pagination.page === itemsStore.pagination.totalPages"
              class="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              &rsaquo;
            </button>
            <button
              @click="goToPage(itemsStore.pagination.totalPages)"
              :disabled="itemsStore.pagination.page === itemsStore.pagination.totalPages"
              class="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              &raquo;
            </button>
          </div>
        </div>
      </div>
    </main>

    <!-- Add/Edit Modal -->
    <div v-if="showAddModal || showEditModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h2 class="text-xl font-bold mb-4">
          {{ showEditModal ? 'Edit Barang' : 'Tambah Barang Baru' }}
        </h2>

        <form @submit.prevent="showEditModal ? handleUpdate() : handleAdd()">
          <div class="mb-4">
            <label class="block text-gray-700 text-sm font-medium mb-2">
              Nama Barang
            </label>
            <input
              v-model="formData.item_name"
              type="text"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div class="mb-4">
            <label class="block text-gray-700 text-sm font-medium mb-2">
              Stok
            </label>
            <input
              v-model.number="formData.stock"
              type="number"
              min="0"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div class="mb-6">
            <label class="block text-gray-700 text-sm font-medium mb-2">
              Satuan
            </label>
            <input
              v-model="formData.unit"
              type="text"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Pcs, Roll, Kg, dll"
              required
            />
          </div>

          <div class="flex justify-end gap-4">
            <button
              type="button"
              @click="closeModal"
              class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Batal
            </button>
            <button
              type="submit"
              :disabled="itemsStore.loading"
              class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {{ itemsStore.loading ? 'Menyimpan...' : 'Simpan' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h2 class="text-xl font-bold mb-4">Konfirmasi Hapus</h2>
        <p class="text-gray-600 mb-6">
          Apakah Anda yakin ingin menghapus barang "{{ selectedItem?.item_name }}"?
        </p>
        <div class="flex justify-end gap-4">
          <button
            @click="showDeleteModal = false"
            class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Batal
          </button>
          <button
            @click="handleDelete"
            :disabled="itemsStore.loading"
            class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            {{ itemsStore.loading ? 'Menghapus...' : 'Hapus' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Footer (Sticky Bottom) -->
    <footer class="bg-white border-t border-gray-200 py-4 text-center text-sm text-gray-500">
      <p>&copy; {{ new Date().getFullYear() }} Adam Suchi Hafizullah. All rights reserved.</p>
    </footer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useItemsStore } from '../stores/items'

const router = useRouter()
const authStore = useAuthStore()
const itemsStore = useItemsStore()

const showAddModal = ref(false)
const showEditModal = ref(false)
const showDeleteModal = ref(false)
const selectedItem = ref(null)
const message = ref(null)
const searchQuery = ref('')
let searchTimeout = null

const formData = ref({
  item_name: '',
  stock: 0,
  unit: ''
})

// Computed untuk visible pages di pagination
const visiblePages = computed(() => {
  const current = itemsStore.pagination.page
  const total = itemsStore.pagination.totalPages
  const pages = []

  let start = Math.max(1, current - 2)
  let end = Math.min(total, current + 2)

  // Adjust if at the start
  if (current <= 3) {
    end = Math.min(5, total)
  }
  // Adjust if at the end
  if (current >= total - 2) {
    start = Math.max(1, total - 4)
  }

  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  return pages
})

onMounted(() => {
  itemsStore.fetchItems()
})

const handleSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    itemsStore.setSearch(searchQuery.value)
  }, 300)
}

const goToPage = (page) => {
  itemsStore.setPage(page)
}

const handleLogout = async () => {
  await authStore.logout()
  router.push('/login')
}

const syncData = async () => {
  const result = await itemsStore.syncFromExternalAPI()
  showMessage(result.message, result.success ? 'success' : 'error')
}

const handleAdd = async () => {
  const result = await itemsStore.addItem(formData.value)
  if (result.success) {
    closeModal()
    showMessage(result.message, 'success')
  } else {
    showMessage(result.message, 'error')
  }
}

const editItem = (item) => {
  selectedItem.value = item
  formData.value = {
    item_name: item.item_name,
    stock: item.stock,
    unit: item.unit
  }
  showEditModal.value = true
}

const handleUpdate = async () => {
  const result = await itemsStore.updateItem(selectedItem.value.id, formData.value)
  if (result.success) {
    closeModal()
    showMessage(result.message, 'success')
  } else {
    showMessage(result.message, 'error')
  }
}

const confirmDelete = (item) => {
  selectedItem.value = item
  showDeleteModal.value = true
}

const handleDelete = async () => {
  const result = await itemsStore.deleteItem(selectedItem.value.id)
  showDeleteModal.value = false
  showMessage(result.message, result.success ? 'success' : 'error')
}

const closeModal = () => {
  showAddModal.value = false
  showEditModal.value = false
  selectedItem.value = null
  formData.value = {
    item_name: '',
    stock: 0,
    unit: ''
  }
}

const showMessage = (text, type) => {
  message.value = { text, type }
  setTimeout(() => {
    message.value = null
  }, 3000)
}
</script>
