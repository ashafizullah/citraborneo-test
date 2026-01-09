<template>
  <div>
    <!-- Loading -->
    <div v-if="dashboardStore.loading" class="text-center py-8">
      <p class="text-gray-600">Memuat data...</p>
    </div>

    <div v-else-if="stats">
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
                <p class="text-sm text-gray-500">{{ leave.leave_type }}</p>
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
</script>
