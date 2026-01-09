<template>
  <div class="min-h-screen bg-gray-100 flex">
    <!-- Sidebar -->
    <aside class="w-64 bg-gray-800 text-white fixed h-full">
      <div class="p-4 border-b border-gray-700">
        <h1 class="text-xl font-bold">Sistem HR</h1>
      </div>

      <nav class="mt-4">
        <router-link
          to="/"
          class="flex items-center px-4 py-3 hover:bg-gray-700 transition-colors"
          :class="{ 'bg-gray-700': $route.path === '/' }"
        >
          <span class="mr-3">📊</span>
          Dashboard
        </router-link>

        <router-link
          to="/employees"
          class="flex items-center px-4 py-3 hover:bg-gray-700 transition-colors"
          :class="{ 'bg-gray-700': $route.path === '/employees' }"
        >
          <span class="mr-3">👥</span>
          Karyawan
        </router-link>

        <router-link
          to="/departments"
          class="flex items-center px-4 py-3 hover:bg-gray-700 transition-colors"
          :class="{ 'bg-gray-700': $route.path === '/departments' }"
        >
          <span class="mr-3">🏢</span>
          Departemen
        </router-link>

        <router-link
          to="/positions"
          class="flex items-center px-4 py-3 hover:bg-gray-700 transition-colors"
          :class="{ 'bg-gray-700': $route.path === '/positions' }"
        >
          <span class="mr-3">💼</span>
          Jabatan
        </router-link>

        <router-link
          to="/attendances"
          class="flex items-center px-4 py-3 hover:bg-gray-700 transition-colors"
          :class="{ 'bg-gray-700': $route.path === '/attendances' }"
        >
          <span class="mr-3">📋</span>
          Absensi
        </router-link>

        <router-link
          to="/leaves"
          class="flex items-center px-4 py-3 hover:bg-gray-700 transition-colors"
          :class="{ 'bg-gray-700': $route.path === '/leaves' }"
        >
          <span class="mr-3">🏖️</span>
          Cuti
        </router-link>
      </nav>
    </aside>

    <!-- Main Content -->
    <div class="flex-1 ml-64">
      <!-- Header -->
      <header class="bg-white shadow-sm h-16 flex items-center justify-between px-6">
        <h2 class="text-lg font-semibold text-gray-800">{{ pageTitle }}</h2>
        <div class="flex items-center gap-4">
          <span class="text-gray-600">{{ authStore.user?.name }}</span>
          <span class="text-sm px-2 py-1 rounded" :class="roleClass">
            {{ authStore.user?.role === 'admin' ? 'Admin HR' : 'Karyawan' }}
          </span>
          <button
            @click="handleLogout"
            class="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 text-sm"
          >
            Logout
          </button>
        </div>
      </header>

      <!-- Page Content -->
      <main class="p-6 pb-16">
        <router-view />
      </main>

      <!-- Footer -->
      <footer class="bg-white border-t border-gray-200 py-4 px-6 text-center text-sm text-gray-500">
        <p>&copy; {{ new Date().getFullYear() }} Adam Suchi Hafizullah. All rights reserved.</p>
      </footer>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const pageTitle = computed(() => {
  const titles = {
    '/': 'Dashboard',
    '/employees': 'Manajemen Karyawan',
    '/departments': 'Manajemen Departemen',
    '/positions': 'Manajemen Jabatan',
    '/attendances': 'Manajemen Absensi',
    '/leaves': 'Manajemen Cuti'
  }
  return titles[route.path] || 'Sistem HR'
})

const roleClass = computed(() => {
  return authStore.user?.role === 'admin'
    ? 'bg-blue-100 text-blue-800'
    : 'bg-green-100 text-green-800'
})

const handleLogout = () => {
  authStore.logout()
  router.push('/login')
}
</script>
