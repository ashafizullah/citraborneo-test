<template>
  <div>
    <!-- Actions -->
    <div class="mb-6 flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
      <div class="w-full sm:w-auto">
        <select v-model="filterStatus" class="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg" @change="fetchLeaves">
          <option value="">Semua Status</option>
          <option value="pending">Menunggu</option>
          <option value="approved">Disetujui</option>
          <option value="rejected">Ditolak</option>
        </select>
      </div>
      <div class="flex gap-2">
        <button @click="openAddModal" class="flex-1 sm:flex-none bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          + Ajukan Cuti
        </button>
        <button v-if="authStore.isAdmin" @click="exportCSV" class="flex-1 sm:flex-none bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
          Export CSV
        </button>
      </div>
    </div>

    <!-- Alert Message -->
    <div v-if="message" :class="['mb-4 p-4 rounded-lg', message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700']">
      {{ message.text }}
    </div>

    <!-- Table -->
    <div class="bg-white rounded-lg shadow overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Karyawan</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jenis Cuti</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal Mulai</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal Selesai</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Alasan</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-if="leavesStore.loading">
              <td colspan="7" class="px-6 py-4 text-center text-gray-500">Memuat data...</td>
            </tr>
            <tr v-else-if="leaves.length === 0">
              <td colspan="7" class="px-6 py-4 text-center text-gray-500">Tidak ada data cuti</td>
            </tr>
            <tr v-for="leave in leaves" :key="leave.id">
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">{{ leave.employee_name }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm">{{ leave.leave_type }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm">{{ formatDate(leave.start_date) }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm">{{ formatDate(leave.end_date) }}</td>
              <td class="px-6 py-4 text-sm">{{ leave.reason || '-' }}</td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span :class="['px-2 py-1 text-xs rounded', statusClass(leave.status)]">{{ statusText(leave.status) }}</span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                <template v-if="authStore.isAdmin && leave.status === 'pending'">
                  <button @click="approveLeave(leave, 'approved')" class="text-green-600 hover:text-green-900">Setuju</button>
                  <button @click="approveLeave(leave, 'rejected')" class="text-red-600 hover:text-red-900">Tolak</button>
                </template>
                <template v-if="leave.status === 'pending'">
                  <button @click="editLeave(leave)" class="text-blue-600 hover:text-blue-900">Edit</button>
                  <button @click="confirmDelete(leave)" class="text-red-600 hover:text-red-900">Hapus</button>
                </template>
                <span v-if="leave.status !== 'pending' && leave.approved_by_name" class="text-gray-500 text-xs">
                  oleh {{ leave.approved_by_name }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Add/Edit Modal -->
    <div v-if="showModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h2 class="text-xl font-bold mb-4">{{ isEdit ? 'Edit Pengajuan Cuti' : 'Ajukan Cuti Baru' }}</h2>
        <form @submit.prevent="handleSubmit">
          <div v-if="authStore.isAdmin && !isEdit" class="mb-4">
            <label class="block text-gray-700 text-sm font-medium mb-2">Karyawan</label>
            <select v-model="formData.employee_id" class="w-full px-4 py-2 border border-gray-300 rounded-lg">
              <option value="">Pilih Karyawan (opsional)</option>
              <option v-for="emp in employees" :key="emp.id" :value="emp.id">{{ emp.name }}</option>
            </select>
          </div>
          <div class="mb-4">
            <label class="block text-gray-700 text-sm font-medium mb-2">Jenis Cuti *</label>
            <select v-model="formData.leave_type" class="w-full px-4 py-2 border border-gray-300 rounded-lg" required>
              <option value="">Pilih Jenis Cuti</option>
              <option value="Cuti Tahunan">Cuti Tahunan</option>
              <option value="Cuti Sakit">Cuti Sakit</option>
              <option value="Cuti Melahirkan">Cuti Melahirkan</option>
              <option value="Cuti Menikah">Cuti Menikah</option>
              <option value="Cuti Keluarga">Cuti Keluarga</option>
              <option value="Izin Khusus">Izin Khusus</option>
            </select>
          </div>
          <div class="mb-4">
            <label class="block text-gray-700 text-sm font-medium mb-2">Tanggal Mulai *</label>
            <input v-model="formData.start_date" type="date" class="w-full px-4 py-2 border border-gray-300 rounded-lg" required />
          </div>
          <div class="mb-4">
            <label class="block text-gray-700 text-sm font-medium mb-2">Tanggal Selesai *</label>
            <input v-model="formData.end_date" type="date" class="w-full px-4 py-2 border border-gray-300 rounded-lg" required />
          </div>
          <div class="mb-6">
            <label class="block text-gray-700 text-sm font-medium mb-2">Alasan</label>
            <textarea v-model="formData.reason" class="w-full px-4 py-2 border border-gray-300 rounded-lg" rows="3" placeholder="Jelaskan alasan cuti Anda"></textarea>
          </div>
          <div class="flex justify-end gap-4">
            <button type="button" @click="closeModal" class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Batal</button>
            <button type="submit" :disabled="leavesStore.loading" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {{ leavesStore.loading ? 'Menyimpan...' : 'Simpan' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Delete Modal -->
    <div v-if="showDeleteModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h2 class="text-xl font-bold mb-4">Konfirmasi Hapus</h2>
        <p class="text-gray-600 mb-6">Apakah Anda yakin ingin menghapus pengajuan cuti ini?</p>
        <div class="flex justify-end gap-4">
          <button @click="showDeleteModal = false" class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Batal</button>
          <button @click="handleDelete" :disabled="leavesStore.loading" class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50">
            {{ leavesStore.loading ? 'Menghapus...' : 'Hapus' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useLeavesStore } from '../stores/leaves'
import { useEmployeesStore } from '../stores/employees'

const authStore = useAuthStore()
const leavesStore = useLeavesStore()
const employeesStore = useEmployeesStore()

const filterStatus = ref('')
const showModal = ref(false)
const showDeleteModal = ref(false)
const isEdit = ref(false)
const selectedItem = ref(null)
const message = ref(null)

const formData = ref({
  employee_id: '',
  leave_type: '',
  start_date: '',
  end_date: '',
  reason: ''
})

const leaves = computed(() => leavesStore.leaves)
const employees = computed(() => employeesStore.employees)

onMounted(() => {
  fetchLeaves()
  if (authStore.isAdmin) {
    employeesStore.fetchEmployees()
  }
})

const fetchLeaves = () => {
  const params = {}
  if (filterStatus.value) params.status = filterStatus.value
  leavesStore.fetchLeaves(params)
}

const openAddModal = () => {
  isEdit.value = false
  formData.value = { employee_id: '', leave_type: '', start_date: '', end_date: '', reason: '' }
  showModal.value = true
}

const editLeave = (leave) => {
  isEdit.value = true
  selectedItem.value = leave
  formData.value = {
    leave_type: leave.leave_type,
    start_date: leave.start_date.split('T')[0],
    end_date: leave.end_date.split('T')[0],
    reason: leave.reason || ''
  }
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  selectedItem.value = null
}

const handleSubmit = async () => {
  let result
  if (isEdit.value) {
    result = await leavesStore.updateLeave(selectedItem.value.id, formData.value)
  } else {
    result = await leavesStore.createLeave(formData.value)
  }

  if (result.success) {
    closeModal()
    showMessage(result.message, 'success')
  } else {
    showMessage(result.message, 'error')
  }
}

const approveLeave = async (leave, status) => {
  const result = await leavesStore.approveLeave(leave.id, status)
  showMessage(result.message, result.success ? 'success' : 'error')
}

const confirmDelete = (leave) => {
  selectedItem.value = leave
  showDeleteModal.value = true
}

const handleDelete = async () => {
  const result = await leavesStore.deleteLeave(selectedItem.value.id)
  showDeleteModal.value = false
  showMessage(result.message, result.success ? 'success' : 'error')
}

const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
}

const statusClass = (status) => {
  const classes = { pending: 'bg-yellow-100 text-yellow-800', approved: 'bg-green-100 text-green-800', rejected: 'bg-red-100 text-red-800' }
  return classes[status] || 'bg-gray-100 text-gray-800'
}

const statusText = (status) => {
  const texts = { pending: 'Menunggu', approved: 'Disetujui', rejected: 'Ditolak' }
  return texts[status] || status
}

const showMessage = (text, type) => {
  message.value = { text, type }
  setTimeout(() => { message.value = null }, 3000)
}

const exportCSV = () => {
  const params = new URLSearchParams()
  if (filterStatus.value) params.append('status', filterStatus.value)
  const url = `http://localhost:3001/api/leaves/export/csv?${params.toString()}`
  window.open(url, '_blank')
}
</script>
