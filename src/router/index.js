
import {
  createRouter,
  createWebHistory
} from 'vue-router'

import MainLayout from '../layouts/MainLayout.vue'
import AuthLayout from '../layouts/AuthLayout.vue'

import Dashboard from '../views/Dashboard.vue'
import DataTablePage from '../views/DataTablePage.vue'
import Login from '../views/Login.vue'

import { getCurrentSuperAdmin } from '../store/auth'

const sections = [
  ['pasien', 'Data Pasien'],
  ['pelayanan', 'Data Pelayanan'],
  ['pegawai', 'Data Pegawai'],
  ['artikel', 'Artikel Kesehatan'],
  ['kegiatan', 'Berita & Kegiatan'],
  ['jadwal', 'Jadwal Pelayanan'],
  ['laporan', 'Laporan'],
  ['pengaturan', 'Pengaturan']
]

const router = createRouter({
  history: createWebHistory(),

  routes: [
    // DASHBOARD ADMIN
    {
      path: '/',
      component: MainLayout,
      meta: { requiresAuth: true },

      children: [
        {
          path: '',
          name: 'dashboard',
          component: Dashboard,
          meta: { title: 'Dashboard' }
        },

        ...sections.map(([path, title]) => ({
          path,
          name: path,
          component: DataTablePage,
          props: { section: path, title },
          meta: { title }
        }))
      ]
    },

    // LOGIN SUPER ADMIN
    {
      path: '/login',
      component: AuthLayout,
      meta: { guestOnly: true },

      children: [
        {
          path: '',
          name: 'login',
          component: Login
        }
      ]
    },

    // REDIRECT AUTH
    {
      path: '/auth',
      redirect: '/login'
    },

    // DISABLE REGISTER PUBLIK
    {
      path: '/register',
      redirect: '/login'
    },

    // HALAMAN TIDAK DITEMUKAN
    {
      path: '/:pathMatch(.*)*',
      redirect: '/'
    }
  ]
})

// SUPABASE AUTHENTICATION GUARD
router.beforeEach(async (to) => {
  const requiresAuth = to.matched.some(
    record => record.meta.requiresAuth
  )

  const guestOnly = to.matched.some(
    record => record.meta.guestOnly
  )

  if (!requiresAuth && !guestOnly) {
    return true
  }

  let admin = null

  try {
    admin = await getCurrentSuperAdmin()
  } catch (error) {
    console.error('Gagal memeriksa sesi admin:', error)
  }

  // Belum login, arahkan ke halaman login
  if (requiresAuth && !admin) {
    return {
      name: 'login',
      query: { redirect: to.fullPath }
    }
  }

  // Sudah login, tidak perlu kembali ke login
  if (guestOnly && admin) {
    return { name: 'dashboard' }
  }

  return true
})

export default router
