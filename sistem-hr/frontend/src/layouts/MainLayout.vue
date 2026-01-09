<template>
  <div class="min-h-screen bg-gray-100">
    <!-- Mobile Header -->
    <div class="lg:hidden bg-gray-800 text-white px-4 py-3 flex items-center justify-between fixed top-0 left-0 right-0 z-50">
      <h1 class="text-lg font-bold">Sistem HR</h1>
      <button @click="sidebarOpen = !sidebarOpen" class="p-2 rounded hover:bg-gray-700">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path v-if="!sidebarOpen" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
          <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>
    </div>

    <!-- Overlay -->
    <div
      v-if="sidebarOpen"
      @click="sidebarOpen = false"
      class="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
    ></div>

    <!-- Sidebar -->
    <aside
      :class="[
        'w-64 bg-gray-800 text-white fixed h-full z-50 transition-transform duration-300',
        'lg:translate-x-0',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      ]"
    >
      <div class="p-4 border-b border-gray-700 hidden lg:block">
        <h1 class="text-xl font-bold">Sistem HR</h1>
      </div>
      <div class="p-4 border-b border-gray-700 lg:hidden mt-14">
        <h1 class="text-xl font-bold">Menu</h1>
      </div>

      <nav class="mt-4">
        <!-- Dashboard - All users -->
        <router-link
          to="/"
          @click="sidebarOpen = false"
          class="flex items-center px-4 py-3 hover:bg-gray-700 transition-colors"
          :class="{ 'bg-gray-700': $route.path === '/' }"
        >
          <span class="mr-3">📊</span>
          Dashboard
        </router-link>

        <!-- Admin Only Menus -->
        <template v-if="authStore.isAdmin">
          <router-link
            to="/employees"
            @click="sidebarOpen = false"
            class="flex items-center px-4 py-3 hover:bg-gray-700 transition-colors"
            :class="{ 'bg-gray-700': $route.path === '/employees' }"
          >
            <span class="mr-3">👥</span>
            Karyawan
          </router-link>

          <router-link
            to="/departments"
            @click="sidebarOpen = false"
            class="flex items-center px-4 py-3 hover:bg-gray-700 transition-colors"
            :class="{ 'bg-gray-700': $route.path === '/departments' }"
          >
            <span class="mr-3">🏢</span>
            Departemen
          </router-link>

          <router-link
            to="/positions"
            @click="sidebarOpen = false"
            class="flex items-center px-4 py-3 hover:bg-gray-700 transition-colors"
            :class="{ 'bg-gray-700': $route.path === '/positions' }"
          >
            <span class="mr-3">💼</span>
            Jabatan
          </router-link>
        </template>

        <!-- Absensi - All users -->
        <router-link
          to="/attendances"
          @click="sidebarOpen = false"
          class="flex items-center px-4 py-3 hover:bg-gray-700 transition-colors"
          :class="{ 'bg-gray-700': $route.path === '/attendances' }"
        >
          <span class="mr-3">📋</span>
          Absensi
        </router-link>

        <!-- Cuti - All users -->
        <router-link
          to="/leaves"
          @click="sidebarOpen = false"
          class="flex items-center px-4 py-3 hover:bg-gray-700 transition-colors"
          :class="{ 'bg-gray-700': $route.path === '/leaves' }"
        >
          <span class="mr-3">🏖️</span>
          Cuti
        </router-link>
      </nav>
    </aside>

    <!-- Main Content -->
    <div class="lg:ml-64 min-h-screen flex flex-col pt-14 lg:pt-0">
      <!-- Header -->
      <header class="bg-white shadow-sm h-16 flex items-center justify-between px-4 lg:px-6">
        <h2 class="text-base lg:text-lg font-semibold text-gray-800 truncate">{{ pageTitle }}</h2>
        <div class="flex items-center gap-2 lg:gap-4">
          <span class="text-gray-600 text-sm hidden sm:block">{{ authStore.user?.name }}</span>
          <span class="text-xs lg:text-sm px-2 py-1 rounded hidden sm:block" :class="roleClass">
            {{ authStore.user?.role === 'admin' ? 'Admin' : 'Karyawan' }}
          </span>
          <button
            @click="handleLogout"
            class="bg-red-500 text-white px-3 lg:px-4 py-2 rounded hover:bg-red-600 text-xs lg:text-sm"
          >
            Logout
          </button>
        </div>
      </header>

      <!-- Page Content -->
      <main class="p-4 lg:p-6 flex-1">
        <router-view />
      </main>

      <!-- Footer (Sticky Bottom) -->
      <footer class="bg-white border-t border-gray-200 py-4 px-4 lg:px-6 text-center text-xs lg:text-sm text-gray-500">
        <p>&copy; {{ new Date().getFullYear() }} Adam Suchi Hafizullah. All rights reserved.</p>
      </footer>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const sidebarOpen = ref(false)

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

const handleLogout = async () => {
  await authStore.logout()
  router.push('/login')
}
</script>
