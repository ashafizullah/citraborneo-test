<template>
  <div>
    <!-- Actions -->
    <div class="mb-6 flex justify-end">
      <button
        v-if="authStore.isAdmin"
        @click="openAddModal"
        class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
      >
        + Tambah Departemen
      </button>
    </div>

    <!-- Alert Message -->
    <div v-if="message" :class="['mb-4 p-4 rounded-lg', message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700']">
      {{ message.text }}
    </div>

    <!-- Table -->
    <div class="bg-white rounded-lg shadow overflow-hidden">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama Departemen</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Deskripsi</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jumlah Karyawan</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr v-if="departmentsStore.loading">
            <td colspan="4" class="px-6 py-4 text-center text-gray-500">Memuat data...</td>
          </tr>
          <tr v-else-if="departments.length === 0">
            <td colspan="4" class="px-6 py-4 text-center text-gray-500">Tidak ada data departemen</td>
          </tr>
          <tr v-for="dept in departments" :key="dept.id">
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">{{ dept.name }}</td>
            <td class="px-6 py-4 text-sm">{{ dept.description || '-' }}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm">{{ dept.employee_count }} orang</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm space-x-2">
              <button v-if="authStore.isAdmin" @click="editDepartment(dept)" class="text-blue-600 hover:text-blue-900">Edit</button>
              <button v-if="authStore.isAdmin" @click="confirmDelete(dept)" class="text-red-600 hover:text-red-900">Hapus</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Add/Edit Modal -->
    <div v-if="showModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h2 class="text-xl font-bold mb-4">{{ isEdit ? 'Edit Departemen' : 'Tambah Departemen Baru' }}</h2>
        <form @submit.prevent="handleSubmit">
          <div class="mb-4">
            <label class="block text-gray-700 text-sm font-medium mb-2">Nama Departemen *</label>
            <input v-model="formData.name" type="text" class="w-full px-4 py-2 border border-gray-300 rounded-lg" required />
          </div>
          <div class="mb-6">
            <label class="block text-gray-700 text-sm font-medium mb-2">Deskripsi</label>
            <textarea v-model="formData.description" class="w-full px-4 py-2 border border-gray-300 rounded-lg" rows="3"></textarea>
          </div>
          <div class="flex justify-end gap-4">
            <button type="button" @click="closeModal" class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Batal</button>
            <button type="submit" :disabled="departmentsStore.loading" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {{ departmentsStore.loading ? 'Menyimpan...' : 'Simpan' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Delete Modal -->
    <div v-if="showDeleteModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h2 class="text-xl font-bold mb-4">Konfirmasi Hapus</h2>
        <p class="text-gray-600 mb-6">Apakah Anda yakin ingin menghapus departemen "{{ selectedItem?.name }}"?</p>
        <div class="flex justify-end gap-4">
          <button @click="showDeleteModal = false" class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Batal</button>
          <button @click="handleDelete" :disabled="departmentsStore.loading" class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50">
            {{ departmentsStore.loading ? 'Menghapus...' : 'Hapus' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useDepartmentsStore } from '../stores/departments'

const authStore = useAuthStore()
const departmentsStore = useDepartmentsStore()

const showModal = ref(false)
const showDeleteModal = ref(false)
const isEdit = ref(false)
const selectedItem = ref(null)
const message = ref(null)

const formData = ref({ name: '', description: '' })

const departments = computed(() => departmentsStore.departments)

onMounted(() => {
  departmentsStore.fetchDepartments()
})

const openAddModal = () => {
  isEdit.value = false
  formData.value = { name: '', description: '' }
  showModal.value = true
}

const editDepartment = (dept) => {
  isEdit.value = true
  selectedItem.value = dept
  formData.value = { name: dept.name, description: dept.description || '' }
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  selectedItem.value = null
}

const handleSubmit = async () => {
  let result
  if (isEdit.value) {
    result = await departmentsStore.updateDepartment(selectedItem.value.id, formData.value)
  } else {
    result = await departmentsStore.createDepartment(formData.value)
  }

  if (result.success) {
    closeModal()
    showMessage(result.message, 'success')
  } else {
    showMessage(result.message, 'error')
  }
}

const confirmDelete = (dept) => {
  selectedItem.value = dept
  showDeleteModal.value = true
}

const handleDelete = async () => {
  const result = await departmentsStore.deleteDepartment(selectedItem.value.id)
  showDeleteModal.value = false
  showMessage(result.message, result.success ? 'success' : 'error')
}

const showMessage = (text, type) => {
  message.value = { text, type }
  setTimeout(() => { message.value = null }, 3000)
}
</script>
