import { createRouter, createWebHistory } from 'vue-router'
import MainLayout from '../layouts/MainLayout.vue'
import AuthLayout from '../layouts/AuthLayout.vue'
import Dashboard from '../views/Dashboard.vue'
import DataTablePage from '../views/DataTablePage.vue'
import Login from '../views/Login.vue'
import Register from '../views/Register.vue'
import { isAuthenticated, hasRegisteredSuperAdmin } from '../store/auth'

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
    {
      path: '/',
      component: MainLayout,
      meta: { requiresAuth: true },
      children: [
        { path: '', name: 'dashboard', component: Dashboard, meta: { title: 'Dashboard' } },
        ...sections.map(([path, title]) => ({
          path, name: path, component: DataTablePage,
          props: { section: path, title }, meta: { title }
        }))
      ]
    },
    {
      path: '/auth',
      redirect: '/login',
      component: AuthLayout,
      meta: { guestOnly: true },
      children: [
        { path: '/login', name: 'login', component: Login },
        { path: '/register', name: 'register', component: Register }
      ]
    },
    { path: '/:pathMatch(.*)*', redirect: '/' }
  ]
})

router.beforeEach(to => {
  const loggedIn = isAuthenticated()
  if (to.matched.some(record => record.meta.requiresAuth) && !loggedIn) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  if (to.matched.some(record => record.meta.guestOnly) && loggedIn) {
    return { name: 'dashboard' }
  }
  if (to.name === 'register' && hasRegisteredSuperAdmin()) {
    return { name: 'login' }
  }
})

export default router
