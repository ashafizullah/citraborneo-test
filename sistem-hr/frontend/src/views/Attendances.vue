<template>
  <div>
    <!-- Check In/Out Section (for employees) -->
    <div v-if="authStore.user?.employee_id" class="mb-6 bg-white rounded-lg shadow p-6">
      <h3 class="text-lg font-semibold mb-4">Absensi Hari Ini</h3>
      <div class="flex flex-wrap gap-4 items-center">
        <div v-if="todayStatus">
          <p class="text-sm text-gray-600">Check-in: <span class="font-medium">{{ todayStatus.check_in || '-' }}</span></p>
          <p class="text-sm text-gray-600">Check-out: <span class="font-medium">{{ todayStatus.check_out || '-' }}</span></p>
        </div>
        <div v-else class="text-gray-500">Belum ada absensi hari ini</div>
        <div class="flex gap-2">
          <button
            @click="handleCheckIn"
            :disabled="attendancesStore.loading || todayStatus?.check_in"
            class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            Check In
          </button>
          <button
            @click="handleCheckOut"
            :disabled="attendancesStore.loading || !todayStatus?.check_in || todayStatus?.check_out"
            class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            Check Out
          </button>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="mb-6 flex flex-wrap gap-4 justify-between items-center">
      <div class="flex gap-4">
        <input v-model="filterStartDate" type="date" class="px-4 py-2 border border-gray-300 rounded-lg" @change="fetchAttendances" />
        <input v-model="filterEndDate" type="date" class="px-4 py-2 border border-gray-300 rounded-lg" @change="fetchAttendances" />
        <select v-model="filterStatus" class="px-4 py-2 border border-gray-300 rounded-lg" @change="fetchAttendances">
          <option value="">Semua Status</option>
          <option value="present">Hadir</option>
          <option value="absent">Tidak Hadir</option>
          <option value="late">Terlambat</option>
        </select>
      </div>
      <div class="flex gap-2">
        <button v-if="authStore.isAdmin" @click="openAddModal" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          + Tambah Absensi
        </button>
        <button v-if="authStore.isAdmin" @click="exportCSV" class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
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
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Karyawan</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check In</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check Out</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Catatan</th>
              <th v-if="authStore.isAdmin" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-if="attendancesStore.loading">
              <td colspan="7" class="px-6 py-4 text-center text-gray-500">Memuat data...</td>
            </tr>
            <tr v-else-if="attendances.length === 0">
              <td colspan="7" class="px-6 py-4 text-center text-gray-500">Tidak ada data absensi</td>
            </tr>
            <tr v-for="att in attendances" :key="att.id">
              <td class="px-6 py-4 whitespace-nowrap text-sm">{{ formatDate(att.date) }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">{{ att.employee_name }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm">{{ att.check_in || '-' }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm">{{ att.check_out || '-' }}</td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span :class="['px-2 py-1 text-xs rounded', statusClass(att.status)]">{{ statusText(att.status) }}</span>
              </td>
              <td class="px-6 py-4 text-sm">{{ att.notes || '-' }}</td>
              <td v-if="authStore.isAdmin" class="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                <button @click="editAttendance(att)" class="text-blue-600 hover:text-blue-900">Edit</button>
                <button @click="confirmDelete(att)" class="text-red-600 hover:text-red-900">Hapus</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Add/Edit Modal -->
    <div v-if="showModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h2 class="text-xl font-bold mb-4">{{ isEdit ? 'Edit Absensi' : 'Tambah Absensi Baru' }}</h2>
        <form @submit.prevent="handleSubmit">
          <div v-if="!isEdit" class="mb-4">
            <label class="block text-gray-700 text-sm font-medium mb-2">Karyawan *</label>
            <select v-model="formData.employee_id" class="w-full px-4 py-2 border border-gray-300 rounded-lg" required>
              <option value="">Pilih Karyawan</option>
              <option v-for="emp in employees" :key="emp.id" :value="emp.id">{{ emp.name }}</option>
            </select>
          </div>
          <div v-if="!isEdit" class="mb-4">
            <label class="block text-gray-700 text-sm font-medium mb-2">Tanggal *</label>
            <input v-model="formData.date" type="date" class="w-full px-4 py-2 border border-gray-300 rounded-lg" required />
          </div>
          <div class="mb-4">
            <label class="block text-gray-700 text-sm font-medium mb-2">Check In</label>
            <input v-model="formData.check_in" type="time" class="w-full px-4 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div class="mb-4">
            <label class="block text-gray-700 text-sm font-medium mb-2">Check Out</label>
            <input v-model="formData.check_out" type="time" class="w-full px-4 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div class="mb-4">
            <label class="block text-gray-700 text-sm font-medium mb-2">Status</label>
            <select v-model="formData.status" class="w-full px-4 py-2 border border-gray-300 rounded-lg">
              <option value="present">Hadir</option>
              <option value="absent">Tidak Hadir</option>
              <option value="late">Terlambat</option>
            </select>
          </div>
          <div class="mb-6">
            <label class="block text-gray-700 text-sm font-medium mb-2">Catatan</label>
            <textarea v-model="formData.notes" class="w-full px-4 py-2 border border-gray-300 rounded-lg" rows="2"></textarea>
          </div>
          <div class="flex justify-end gap-4">
            <button type="button" @click="closeModal" class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Batal</button>
            <button type="submit" :disabled="attendancesStore.loading" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {{ attendancesStore.loading ? 'Menyimpan...' : 'Simpan' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Delete Modal -->
    <div v-if="showDeleteModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h2 class="text-xl font-bold mb-4">Konfirmasi Hapus</h2>
        <p class="text-gray-600 mb-6">Apakah Anda yakin ingin menghapus data absensi ini?</p>
        <div class="flex justify-end gap-4">
          <button @click="showDeleteModal = false" class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Batal</button>
          <button @click="handleDelete" :disabled="attendancesStore.loading" class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50">
            {{ attendancesStore.loading ? 'Menghapus...' : 'Hapus' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useAttendancesStore } from '../stores/attendances'
import { useEmployeesStore } from '../stores/employees'

const authStore = useAuthStore()
const attendancesStore = useAttendancesStore()
const employeesStore = useEmployeesStore()

const filterStartDate = ref('')
const filterEndDate = ref('')
const filterStatus = ref('')
const showModal = ref(false)
const showDeleteModal = ref(false)
const isEdit = ref(false)
const selectedItem = ref(null)
const message = ref(null)

const formData = ref({
  employee_id: '',
  date: '',
  check_in: '',
  check_out: '',
  status: 'present',
  notes: ''
})

const attendances = computed(() => attendancesStore.attendances)
const todayStatus = computed(() => attendancesStore.todayStatus)
const employees = computed(() => employeesStore.employees)

onMounted(() => {
  fetchAttendances()
  attendancesStore.fetchTodayStatus()
  if (authStore.isAdmin) {
    employeesStore.fetchEmployees()
  }
})

const fetchAttendances = () => {
  const params = {}
  if (filterStartDate.value) params.start_date = filterStartDate.value
  if (filterEndDate.value) params.end_date = filterEndDate.value
  if (filterStatus.value) params.status = filterStatus.value
  attendancesStore.fetchAttendances(params)
}

const handleCheckIn = async () => {
  const result = await attendancesStore.checkIn()
  showMessage(result.message, result.success ? 'success' : 'error')
}

const handleCheckOut = async () => {
  const result = await attendancesStore.checkOut()
  showMessage(result.message, result.success ? 'success' : 'error')
}

const openAddModal = () => {
  isEdit.value = false
  formData.value = { employee_id: '', date: '', check_in: '', check_out: '', status: 'present', notes: '' }
  showModal.value = true
}

const editAttendance = (att) => {
  isEdit.value = true
  selectedItem.value = att
  formData.value = {
    check_in: att.check_in || '',
    check_out: att.check_out || '',
    status: att.status,
    notes: att.notes || ''
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
    result = await attendancesStore.updateAttendance(selectedItem.value.id, formData.value)
  } else {
    result = await attendancesStore.createAttendance(formData.value)
  }

  if (result.success) {
    closeModal()
    showMessage(result.message, 'success')
  } else {
    showMessage(result.message, 'error')
  }
}

const confirmDelete = (att) => {
  selectedItem.value = att
  showDeleteModal.value = true
}

const handleDelete = async () => {
  const result = await attendancesStore.deleteAttendance(selectedItem.value.id)
  showDeleteModal.value = false
  showMessage(result.message, result.success ? 'success' : 'error')
}

const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
}

const statusClass = (status) => {
  const classes = { present: 'bg-green-100 text-green-800', absent: 'bg-red-100 text-red-800', late: 'bg-yellow-100 text-yellow-800' }
  return classes[status] || 'bg-gray-100 text-gray-800'
}

const statusText = (status) => {
  const texts = { present: 'Hadir', absent: 'Tidak Hadir', late: 'Terlambat' }
  return texts[status] || status
}

const showMessage = (text, type) => {
  message.value = { text, type }
  setTimeout(() => { message.value = null }, 3000)
}

const exportCSV = () => {
  const params = new URLSearchParams()
  if (filterStartDate.value) params.append('start_date', filterStartDate.value)
  if (filterEndDate.value) params.append('end_date', filterEndDate.value)
  if (filterStatus.value) params.append('status', filterStatus.value)
  const url = `http://localhost:3001/api/attendances/export/csv?${params.toString()}`
  window.open(url, '_blank')
}
</script>
