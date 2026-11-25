import { createRouter, createWebHistory } from 'vue-router'
import MainLayout from '../layouts/MainLayout.vue'
import AuthLayout from '../layouts/AuthLayout.vue'
import Dashboard from '../views/Dashboard.vue'
import Login from '../views/Login.vue'

// Setiap menu sekarang menggunakan file view sendiri.
import Pasien from '../views/Pasien.vue'
import Pelayanan from '../views/Pelayanan.vue'
import Pegawai from '../views/Pegawai.vue'
import Artikel from '../views/Artikel.vue'
import Kegiatan from '../views/Kegiatan.vue'
import Jadwal from '../views/Jadwal.vue'
import Laporan from '../views/Laporan.vue'
import Pengaturan from '../views/Pengaturan.vue'

// Memakai autentikasi Supabase yang sudah dibuat sebelumnya.
import { getCurrentSuperAdmin } from '../store/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: MainLayout,
      meta: { requiresAuth: true },
      children: [
        { path: '', name: 'dashboard', component: Dashboard, meta: { title: 'Dashboard' } },
        { path: 'pasien', name: 'pasien', component: Pasien, meta: { title: 'Data Pasien' } },
        { path: 'pelayanan', name: 'pelayanan', component: Pelayanan, meta: { title: 'Data Pelayanan' } },
        { path: 'pegawai', name: 'pegawai', component: Pegawai, meta: { title: 'Data Pegawai' } },
        { path: 'artikel', name: 'artikel', component: Artikel, meta: { title: 'Artikel Kesehatan' } },
        { path: 'kegiatan', name: 'kegiatan', component: Kegiatan, meta: { title: 'Berita & Kegiatan' } },
        { path: 'jadwal', name: 'jadwal', component: Jadwal, meta: { title: 'Jadwal Pelayanan' } },
        { path: 'laporan', name: 'laporan', component: Laporan, meta: { title: 'Laporan' } },
        { path: 'pengaturan', name: 'pengaturan', component: Pengaturan, meta: { title: 'Pengaturan' } }
      ]
    },
    {
      path: '/login',
      component: AuthLayout,
      meta: { guestOnly: true },
      children: [{ path: '', name: 'login', component: Login }]
    },
    { path: '/auth', redirect: '/login' },
    { path: '/register', redirect: '/login' },
    { path: '/:pathMatch(.*)*', redirect: '/' }
  ]
})

router.beforeEach(async (to) => {
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  const guestOnly = to.matched.some(record => record.meta.guestOnly)
  if (!requiresAuth && !guestOnly) return true

  let admin = null
  try {
    admin = await getCurrentSuperAdmin()
  } catch (error) {
    console.error('Gagal memeriksa sesi Super Admin:', error)
  }
  if (requiresAuth && !admin) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  if (guestOnly && admin) return { name: 'dashboard' }
  return true
})

export default router