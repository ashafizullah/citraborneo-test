<template>
  <div>
    <!-- Loading -->
    <div v-if="dashboardStore.loading" class="text-center py-8">
      <p class="text-gray-600">Memuat data...</p>
    </div>

    <!-- Admin Dashboard -->
    <div v-else-if="stats && stats.isAdmin">
      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center">
            <div class="p-3 rounded-full bg-blue-100 text-blue-600">
              <span class="text-2xl">👥</span>
            </div>
            <div class="ml-4">
              <p class="text-sm text-gray-500">Total Karyawan</p>
              <p class="text-2xl font-bold text-gray-800">{{ stats.totalEmployees }}</p>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center">
            <div class="p-3 rounded-full bg-green-100 text-green-600">
              <span class="text-2xl">✓</span>
            </div>
            <div class="ml-4">
              <p class="text-sm text-gray-500">Karyawan Aktif</p>
              <p class="text-2xl font-bold text-gray-800">{{ stats.activeEmployees }}</p>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center">
            <div class="p-3 rounded-full bg-purple-100 text-purple-600">
              <span class="text-2xl">🏢</span>
            </div>
            <div class="ml-4">
              <p class="text-sm text-gray-500">Departemen</p>
              <p class="text-2xl font-bold text-gray-800">{{ stats.totalDepartments }}</p>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center">
            <div class="p-3 rounded-full bg-yellow-100 text-yellow-600">
              <span class="text-2xl">📝</span>
            </div>
            <div class="ml-4">
              <p class="text-sm text-gray-500">Cuti Pending</p>
              <p class="text-2xl font-bold text-gray-800">{{ stats.pendingLeaves }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Attendance Today -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div class="bg-white rounded-lg shadow p-6">
          <h3 class="text-lg font-semibold text-gray-800 mb-4">Absensi Hari Ini</h3>
          <div class="grid grid-cols-3 gap-4 text-center">
            <div class="p-4 bg-green-50 rounded-lg">
              <p class="text-2xl font-bold text-green-600">{{ stats.todayAttendance.present }}</p>
              <p class="text-sm text-gray-500">Hadir</p>
            </div>
            <div class="p-4 bg-red-50 rounded-lg">
              <p class="text-2xl font-bold text-red-600">{{ stats.todayAttendance.absent }}</p>
              <p class="text-sm text-gray-500">Tidak Hadir</p>
            </div>
            <div class="p-4 bg-yellow-50 rounded-lg">
              <p class="text-2xl font-bold text-yellow-600">{{ stats.todayAttendance.late }}</p>
              <p class="text-sm text-gray-500">Terlambat</p>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow p-6">
          <h3 class="text-lg font-semibold text-gray-800 mb-4">Rekap Bulan Ini</h3>
          <div class="grid grid-cols-3 gap-4 text-center">
            <div class="p-4 bg-green-50 rounded-lg">
              <p class="text-2xl font-bold text-green-600">{{ stats.monthlyAttendance.present }}</p>
              <p class="text-sm text-gray-500">Hadir</p>
            </div>
            <div class="p-4 bg-red-50 rounded-lg">
              <p class="text-2xl font-bold text-red-600">{{ stats.monthlyAttendance.absent }}</p>
              <p class="text-sm text-gray-500">Tidak Hadir</p>
            </div>
            <div class="p-4 bg-yellow-50 rounded-lg">
              <p class="text-2xl font-bold text-yellow-600">{{ stats.monthlyAttendance.late }}</p>
              <p class="text-sm text-gray-500">Terlambat</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Employee by Department & Recent Leaves -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="bg-white rounded-lg shadow p-6">
          <h3 class="text-lg font-semibold text-gray-800 mb-4">Karyawan per Departemen</h3>
          <div class="space-y-3">
            <div
              v-for="dept in stats.employeesByDepartment"
              :key="dept.department"
              class="flex justify-between items-center p-3 bg-gray-50 rounded"
            >
              <span class="text-gray-700">{{ dept.department }}</span>
              <span class="font-semibold text-gray-800">{{ dept.count }} orang</span>
            </div>
            <div v-if="stats.employeesByDepartment.length === 0" class="text-center text-gray-500 py-4">
              Belum ada data
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow p-6">
          <h3 class="text-lg font-semibold text-gray-800 mb-4">Pengajuan Cuti Terbaru</h3>
          <div class="space-y-3">
            <div
              v-for="leave in stats.recentLeaves"
              :key="leave.id"
              class="flex justify-between items-center p-3 bg-gray-50 rounded"
            >
              <div>
                <p class="text-gray-700 font-medium">{{ leave.employee_name }}</p>
                <p class="text-sm text-gray-500">{{ leaveTypeText(leave.leave_type) }}</p>
              </div>
              <span
                class="px-2 py-1 rounded text-xs font-medium"
                :class="statusClass(leave.status)"
              >
                {{ statusText(leave.status) }}
              </span>
            </div>
            <div v-if="stats.recentLeaves.length === 0" class="text-center text-gray-500 py-4">
              Belum ada pengajuan cuti
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Employee Dashboard -->
    <div v-else-if="stats && !stats.isAdmin">
      <!-- Employee Info Card -->
      <div v-if="stats.employee" class="bg-white rounded-lg shadow p-6 mb-6">
        <h3 class="text-lg font-semibold text-gray-800 mb-4">Informasi Karyawan</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <p class="text-sm text-gray-500">Nama</p>
            <p class="font-medium text-gray-800">{{ stats.employee.name }}</p>
          </div>
          <div>
            <p class="text-sm text-gray-500">Kode Karyawan</p>
            <p class="font-medium text-gray-800">{{ stats.employee.employee_code }}</p>
          </div>
          <div>
            <p class="text-sm text-gray-500">Departemen</p>
            <p class="font-medium text-gray-800">{{ stats.employee.department_name || '-' }}</p>
          </div>
          <div>
            <p class="text-sm text-gray-500">Jabatan</p>
            <p class="font-medium text-gray-800">{{ stats.employee.position_name || '-' }}</p>
          </div>
        </div>
      </div>

      <!-- Today's Attendance & Quick Actions -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div class="bg-white rounded-lg shadow p-6">
          <h3 class="text-lg font-semibold text-gray-800 mb-4">Absensi Hari Ini</h3>
          <div v-if="stats.todayAttendance" class="space-y-3">
            <div class="flex justify-between items-center p-3 bg-gray-50 rounded">
              <span class="text-gray-600">Check In</span>
              <span class="font-medium text-gray-800">{{ stats.todayAttendance.check_in || '-' }}</span>
            </div>
            <div class="flex justify-between items-center p-3 bg-gray-50 rounded">
              <span class="text-gray-600">Check Out</span>
              <span class="font-medium text-gray-800">{{ stats.todayAttendance.check_out || '-' }}</span>
            </div>
            <div class="flex justify-between items-center p-3 bg-gray-50 rounded">
              <span class="text-gray-600">Status</span>
              <span class="px-2 py-1 rounded text-xs font-medium" :class="attendanceStatusClass(stats.todayAttendance.status)">
                {{ attendanceStatusText(stats.todayAttendance.status) }}
              </span>
            </div>
          </div>
          <div v-else class="text-center text-gray-500 py-4">
            <p>Belum ada absensi hari ini</p>
            <router-link to="/attendances" class="text-blue-600 hover:underline text-sm mt-2 inline-block">
              Klik untuk absen
            </router-link>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow p-6">
          <h3 class="text-lg font-semibold text-gray-800 mb-4">Rekap Absensi Bulan Ini</h3>
          <div class="grid grid-cols-3 gap-4 text-center">
            <div class="p-4 bg-green-50 rounded-lg">
              <p class="text-2xl font-bold text-green-600">{{ stats.monthlyAttendance.present }}</p>
              <p class="text-sm text-gray-500">Hadir</p>
            </div>
            <div class="p-4 bg-red-50 rounded-lg">
              <p class="text-2xl font-bold text-red-600">{{ stats.monthlyAttendance.absent }}</p>
              <p class="text-sm text-gray-500">Tidak Hadir</p>
            </div>
            <div class="p-4 bg-yellow-50 rounded-lg">
              <p class="text-2xl font-bold text-yellow-600">{{ stats.monthlyAttendance.late }}</p>
              <p class="text-sm text-gray-500">Terlambat</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Pending Leaves & Recent Leaves -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-semibold text-gray-800">Cuti Pending</h3>
            <span class="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
              {{ stats.pendingLeaves }} pengajuan
            </span>
          </div>
          <router-link
            to="/leaves"
            class="block w-full text-center bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
          >
            Ajukan Cuti
          </router-link>
        </div>

        <div class="bg-white rounded-lg shadow p-6">
          <h3 class="text-lg font-semibold text-gray-800 mb-4">Riwayat Cuti Terbaru</h3>
          <div class="space-y-3">
            <div
              v-for="leave in stats.recentLeaves"
              :key="leave.id"
              class="flex justify-between items-center p-3 bg-gray-50 rounded"
            >
              <div>
                <p class="text-gray-700 font-medium">{{ leaveTypeText(leave.leave_type) }}</p>
                <p class="text-sm text-gray-500">{{ formatDate(leave.start_date) }} - {{ formatDate(leave.end_date) }}</p>
              </div>
              <span
                class="px-2 py-1 rounded text-xs font-medium"
                :class="statusClass(leave.status)"
              >
                {{ statusText(leave.status) }}
              </span>
            </div>
            <div v-if="stats.recentLeaves.length === 0" class="text-center text-gray-500 py-4">
              Belum ada riwayat cuti
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useDashboardStore } from '../stores/dashboard'

const dashboardStore = useDashboardStore()

const stats = computed(() => dashboardStore.stats)

onMounted(() => {
  dashboardStore.fetchStats()
})

const statusClass = (status) => {
  const classes = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800'
  }
  return classes[status] || 'bg-gray-100 text-gray-800'
}

const statusText = (status) => {
  const texts = {
    pending: 'Menunggu',
    approved: 'Disetujui',
    rejected: 'Ditolak'
  }
  return texts[status] || status
}

const attendanceStatusClass = (status) => {
  const classes = {
    present: 'bg-green-100 text-green-800',
    absent: 'bg-red-100 text-red-800',
    late: 'bg-yellow-100 text-yellow-800'
  }
  return classes[status] || 'bg-gray-100 text-gray-800'
}

const attendanceStatusText = (status) => {
  const texts = {
    present: 'Hadir',
    absent: 'Tidak Hadir',
    late: 'Terlambat'
  }
  return texts[status] || status
}

const leaveTypeText = (type) => {
  const types = {
    annual: 'Cuti Tahunan',
    sick: 'Cuti Sakit',
    maternity: 'Cuti Melahirkan',
    unpaid: 'Cuti Tanpa Gaji',
    other: 'Lainnya'
  }
  return types[type] || type
}

const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
}
</script>
