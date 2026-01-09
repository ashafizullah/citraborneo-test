import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue')
  },
  {
    path: '/',
    component: () => import('../layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'Dashboard',
        component: () => import('../views/Dashboard.vue')
      },
      {
        path: 'employees',
        name: 'Employees',
        component: () => import('../views/Employees.vue'),
        meta: { requiresAdmin: true }
      },
      {
        path: 'departments',
        name: 'Departments',
        component: () => import('../views/Departments.vue'),
        meta: { requiresAdmin: true }
      },
      {
        path: 'positions',
        name: 'Positions',
        component: () => import('../views/Positions.vue'),
        meta: { requiresAdmin: true }
      },
      {
        path: 'attendances',
        name: 'Attendances',
        component: () => import('../views/Attendances.vue')
      },
      {
        path: 'leaves',
        name: 'Leaves',
        component: () => import('../views/Leaves.vue')
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login')
  } else if (to.path === '/login' && authStore.isAuthenticated) {
    next('/')
  } else if (to.meta.requiresAdmin && !authStore.isAdmin) {
    // Redirect non-admin users trying to access admin-only pages
    next('/')
  } else {
    next()
  }
})

export default router
