<template>
  <div class="min-h-screen flex flex-col bg-gray-100">
    <!-- Login Form Container (Centered) -->
    <div class="flex-1 flex items-center justify-center px-4">
      <div class="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
      <h1 class="text-2xl font-bold text-center text-gray-800 mb-2">Sistem HR</h1>
      <h2 class="text-lg text-center text-gray-600 mb-6">Login</h2>

      <form @submit.prevent="handleLogin">
        <div class="mb-4">
          <label class="block text-gray-700 text-sm font-medium mb-2" for="email">
            Email
          </label>
          <input
            id="email"
            v-model="email"
            type="email"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Masukkan email"
            required
          />
        </div>

        <div class="mb-6">
          <label class="block text-gray-700 text-sm font-medium mb-2" for="password">
            Password
          </label>
          <input
            id="password"
            v-model="password"
            type="password"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Masukkan password"
            required
          />
        </div>

        <div v-if="error" class="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
          {{ error }}
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ loading ? 'Memproses...' : 'Login' }}
        </button>
      </form>

      <div class="mt-6 text-center text-sm text-gray-500 space-y-2">
        <p class="text-xs text-gray-400">Klik untuk isi otomatis:</p>
        <button
          type="button"
          @click="fillDemo('admin@hr.com', 'admin123')"
          class="block w-full px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded text-gray-600 transition-colors"
        >
          Admin: admin@hr.com / admin123
        </button>
        <button
          type="button"
          @click="fillDemo('test.employee@company.com', 'password123')"
          class="block w-full px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded text-gray-600 transition-colors"
        >
          Karyawan: test.employee@company.com / password123
        </button>
      </div>
      </div>
    </div>

    <!-- Footer (Sticky Bottom) -->
    <footer class="py-4 text-center text-sm text-gray-500">
      <p>&copy; {{ new Date().getFullYear() }} Adam Suchi Hafizullah. All rights reserved.</p>
    </footer>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

const fillDemo = (demoEmail, demoPassword) => {
  email.value = demoEmail
  password.value = demoPassword
}

const handleLogin = async () => {
  loading.value = true
  error.value = ''

  const result = await authStore.login(email.value, password.value)

  if (result.success) {
    router.push('/')
  } else {
    error.value = result.message
  }

  loading.value = false
}
</script>
