<template>
  <div>
    <!-- Actions -->
    <div class="mb-6 flex flex-wrap gap-4 justify-between items-center">
      <div class="flex gap-4">
        <input
          v-model="search"
          type="text"
          placeholder="Cari karyawan..."
          class="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          @input="handleSearch"
        />
        <select
          v-model="filterDepartment"
          class="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          @change="fetchEmployees"
        >
          <option value="">Semua Departemen</option>
          <option v-for="dept in departments" :key="dept.id" :value="dept.id">
            {{ dept.name }}
          </option>
        </select>
      </div>
      <div class="flex gap-2">
        <button
          v-if="authStore.isAdmin"
          @click="openAddModal"
          class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          + Tambah Karyawan
        </button>
        <button
          v-if="authStore.isAdmin"
          @click="exportCSV"
          class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
        >
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
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kode</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Departemen</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jabatan</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-if="employeesStore.loading">
              <td colspan="7" class="px-6 py-4 text-center text-gray-500">Memuat data...</td>
            </tr>
            <tr v-else-if="employees.length === 0">
              <td colspan="7" class="px-6 py-4 text-center text-gray-500">Tidak ada data karyawan</td>
            </tr>
            <tr v-for="emp in employees" :key="emp.id">
              <td class="px-6 py-4 whitespace-nowrap text-sm">{{ emp.employee_code }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">{{ emp.name }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm">{{ emp.email }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm">{{ emp.department_name || '-' }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm">{{ emp.position_name || '-' }}</td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span :class="['px-2 py-1 text-xs rounded', emp.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800']">
                  {{ emp.status === 'active' ? 'Aktif' : 'Tidak Aktif' }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                <button v-if="authStore.isAdmin" @click="editEmployee(emp)" class="text-blue-600 hover:text-blue-900">Edit</button>
                <button v-if="authStore.isAdmin" @click="confirmDelete(emp)" class="text-red-600 hover:text-red-900">Hapus</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Add/Edit Modal -->
    <div v-if="showModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <h2 class="text-xl font-bold mb-4">{{ isEdit ? 'Edit Karyawan' : 'Tambah Karyawan Baru' }}</h2>
        <form @submit.prevent="handleSubmit">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-gray-700 text-sm font-medium mb-2">Kode Karyawan *</label>
              <input v-model="formData.employee_code" type="text" class="w-full px-4 py-2 border border-gray-300 rounded-lg" required />
            </div>
            <div>
              <label class="block text-gray-700 text-sm font-medium mb-2">Nama Lengkap *</label>
              <input v-model="formData.name" type="text" class="w-full px-4 py-2 border border-gray-300 rounded-lg" required />
            </div>
            <div>
              <label class="block text-gray-700 text-sm font-medium mb-2">Email *</label>
              <input v-model="formData.email" type="email" class="w-full px-4 py-2 border border-gray-300 rounded-lg" required />
            </div>
            <div>
              <label class="block text-gray-700 text-sm font-medium mb-2">No. Telepon</label>
              <input v-model="formData.phone" type="text" class="w-full px-4 py-2 border border-gray-300 rounded-lg" />
            </div>
            <div>
              <label class="block text-gray-700 text-sm font-medium mb-2">Tanggal Lahir</label>
              <input v-model="formData.date_of_birth" type="date" class="w-full px-4 py-2 border border-gray-300 rounded-lg" />
            </div>
            <div>
              <label class="block text-gray-700 text-sm font-medium mb-2">Tanggal Masuk *</label>
              <input v-model="formData.hire_date" type="date" class="w-full px-4 py-2 border border-gray-300 rounded-lg" required />
            </div>
            <div>
              <label class="block text-gray-700 text-sm font-medium mb-2">Departemen</label>
              <select v-model="formData.department_id" class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                <option value="">Pilih Departemen</option>
                <option v-for="dept in departments" :key="dept.id" :value="dept.id">{{ dept.name }}</option>
              </select>
            </div>
            <div>
              <label class="block text-gray-700 text-sm font-medium mb-2">Jabatan</label>
              <select v-model="formData.position_id" class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                <option value="">Pilih Jabatan</option>
                <option v-for="pos in positions" :key="pos.id" :value="pos.id">{{ pos.name }}</option>
              </select>
            </div>
            <div v-if="isEdit">
              <label class="block text-gray-700 text-sm font-medium mb-2">Status</label>
              <select v-model="formData.status" class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                <option value="active">Aktif</option>
                <option value="inactive">Tidak Aktif</option>
              </select>
            </div>
            <div class="md:col-span-2">
              <label class="block text-gray-700 text-sm font-medium mb-2">Alamat</label>
              <textarea v-model="formData.address" class="w-full px-4 py-2 border border-gray-300 rounded-lg" rows="2"></textarea>
            </div>
            <div v-if="!isEdit" class="md:col-span-2 p-4 bg-gray-50 rounded-lg">
              <label class="flex items-center gap-2 mb-2">
                <input v-model="formData.create_user_account" type="checkbox" class="rounded" />
                <span class="text-sm font-medium text-gray-700">Buat akun login untuk karyawan ini</span>
              </label>
              <div v-if="formData.create_user_account">
                <label class="block text-gray-700 text-sm font-medium mb-2">Password</label>
                <input v-model="formData.password" type="password" class="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="Minimal 6 karakter" />
              </div>
            </div>
          </div>
          <div class="flex justify-end gap-4 mt-6">
            <button type="button" @click="closeModal" class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Batal</button>
            <button type="submit" :disabled="employeesStore.loading" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {{ employeesStore.loading ? 'Menyimpan...' : 'Simpan' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Delete Modal -->
    <div v-if="showDeleteModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h2 class="text-xl font-bold mb-4">Konfirmasi Hapus</h2>
        <p class="text-gray-600 mb-6">Apakah Anda yakin ingin menghapus karyawan "{{ selectedEmployee?.name }}"?</p>
        <div class="flex justify-end gap-4">
          <button @click="showDeleteModal = false" class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Batal</button>
          <button @click="handleDelete" :disabled="employeesStore.loading" class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50">
            {{ employeesStore.loading ? 'Menghapus...' : 'Hapus' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useEmployeesStore } from '../stores/employees'
import { useDepartmentsStore } from '../stores/departments'
import { usePositionsStore } from '../stores/positions'

const authStore = useAuthStore()
const employeesStore = useEmployeesStore()
const departmentsStore = useDepartmentsStore()
const positionsStore = usePositionsStore()

const search = ref('')
const filterDepartment = ref('')
const showModal = ref(false)
const showDeleteModal = ref(false)
const isEdit = ref(false)
const selectedEmployee = ref(null)
const message = ref(null)

const formData = ref({
  employee_code: '',
  name: '',
  email: '',
  phone: '',
  address: '',
  date_of_birth: '',
  hire_date: '',
  department_id: '',
  position_id: '',
  status: 'active',
  create_user_account: false,
  password: ''
})

const employees = computed(() => employeesStore.employees)
const departments = computed(() => departmentsStore.departments)
const positions = computed(() => positionsStore.positions)

onMounted(() => {
  fetchEmployees()
  departmentsStore.fetchDepartments()
  positionsStore.fetchPositions()
})

let searchTimeout = null
const handleSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    fetchEmployees()
  }, 300)
}

const fetchEmployees = () => {
  const params = {}
  if (search.value) params.search = search.value
  if (filterDepartment.value) params.department_id = filterDepartment.value
  employeesStore.fetchEmployees(params)
}

const openAddModal = () => {
  isEdit.value = false
  formData.value = {
    employee_code: '',
    name: '',
    email: '',
    phone: '',
    address: '',
    date_of_birth: '',
    hire_date: '',
    department_id: '',
    position_id: '',
    status: 'active',
    create_user_account: false,
    password: ''
  }
  showModal.value = true
}

const editEmployee = (emp) => {
  isEdit.value = true
  selectedEmployee.value = emp
  formData.value = {
    employee_code: emp.employee_code,
    name: emp.name,
    email: emp.email,
    phone: emp.phone || '',
    address: emp.address || '',
    date_of_birth: emp.date_of_birth ? emp.date_of_birth.split('T')[0] : '',
    hire_date: emp.hire_date ? emp.hire_date.split('T')[0] : '',
    department_id: emp.department_id || '',
    position_id: emp.position_id || '',
    status: emp.status
  }
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  selectedEmployee.value = null
}

const handleSubmit = async () => {
  let result
  if (isEdit.value) {
    result = await employeesStore.updateEmployee(selectedEmployee.value.id, formData.value)
  } else {
    result = await employeesStore.createEmployee(formData.value)
  }

  if (result.success) {
    closeModal()
    showMessage(result.message, 'success')
  } else {
    showMessage(result.message, 'error')
  }
}

const confirmDelete = (emp) => {
  selectedEmployee.value = emp
  showDeleteModal.value = true
}

const handleDelete = async () => {
  const result = await employeesStore.deleteEmployee(selectedEmployee.value.id)
  showDeleteModal.value = false
  showMessage(result.message, result.success ? 'success' : 'error')
}

const showMessage = (text, type) => {
  message.value = { text, type }
  setTimeout(() => { message.value = null }, 3000)
}

const exportCSV = () => {
  const params = new URLSearchParams()
  if (filterDepartment.value) params.append('department_id', filterDepartment.value)
  const url = `http://localhost:3001/api/employees/export/csv?${params.toString()}`
  window.open(url, '_blank')
}
</script>
