
<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import {
  LayoutDashboard,
  Users,
  ClipboardList,
  UserRoundCheck,
  Newspaper,
  CalendarDays,
  FileBarChart2,
  Settings,
  Menu,
  Bell,
  HeartPulse,
  X,
  Activity,
  LogOut,
  ShieldCheck
} from 'lucide-vue-next'

import {
  getCurrentSuperAdmin,
  logoutSuperAdmin
} from '../store/auth'

// Router
const route = useRoute()
const router = useRouter()

// State
const open = ref(false)
const user = ref(null)
const loggingOut = ref(false)

// Ambil data Super Admin dari Supabase
async function loadAdminProfile() {
  try {
    const admin = await getCurrentSuperAdmin()

    if (admin) {
      user.value = {
        id: admin.id,
        name: admin.nama_lengkap,
        email: admin.email,
        role: admin.role,
        status: admin.status
      }
    } else {
      user.value = null
      await router.replace({ name: 'login' })
    }

  } catch (error) {
    console.error('Gagal mengambil profil admin:', error)
    user.value = null
  }
}

// Jalankan saat halaman dashboard dibuka
onMounted(() => {
  loadAdminProfile()
})

// Inisial nama Super Admin
const initials = computed(() => {
  const name = user.value?.name || 'Super Admin'

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(part => part[0])
    .join('')
    .toUpperCase()
})

// Menu sidebar dashboard
const items = [
  ['/', 'Dashboard', LayoutDashboard],
  ['/pasien', 'Data Pasien', Users],
  // ['/pelayanan', 'Data Pelayanan', ClipboardList],
  // ['/pegawai', 'Data Pegawai', UserRoundCheck],
  // ['/artikel', 'Artikel Kesehatan', Newspaper],
  // ['/kegiatan', 'Berita & Kegiatan', Activity],
  // ['/jadwal', 'Jadwal Pelayanan', CalendarDays],
  // ['/laporan', 'Laporan', FileBarChart2],
  ['/pengaturan', 'Pengaturan', Settings]
]

// Judul halaman
const title = computed(() => {
  return route.meta.title || 'Dashboard'
})

// Logout menggunakan Supabase
async function signOut() {
  if (loggingOut.value) return

  loggingOut.value = true

  try {
    await logoutSuperAdmin()

    user.value = null

    await router.replace({
      name: 'login'
    })

  } catch (error) {
    console.error('Gagal logout:', error)
    alert('Gagal keluar dari akun. Silakan coba lagi.')
  } finally {
    loggingOut.value = false
  }
}
</script>


<template>
  <div class="app-shell">
    <aside class="sidebar" :class="{show:open}">
      <div class="brand">
        <div class="brand-icon"><HeartPulse :size="31"/></div>
        <div><strong>PUSKESMAS<br>KESAMBI</strong><small>Kota Cirebon</small></div>
        <button class="close-mobile" aria-label="Tutup menu" @click="open=false"><X/></button>
      </div>
      <p class="side-label">MENU UTAMA</p>
      <nav>
        <router-link v-for="[path,label,Icon] in items" :key="path" :to="path" @click="open=false">
          <component :is="Icon" :size="19"/><span>{{ label }}</span>
        </router-link>
      </nav>
      <div class="sidebar-bottom">
        <div class="avatar">{{ initials }}</div>
        <div class="sidebar-account-details"><b>{{ user?.name || 'Super Admin' }}</b><small><ShieldCheck :size="12"/> Super Admin</small></div>
        <button class="sidebar-logout" type="button" title="Keluar" aria-label="Keluar dari akun" @click="signOut"><LogOut :size="17"/></button>
      </div>
    </aside>
    <div v-if="open" class="overlay" @click="open=false"></div>
    <div class="main">
      <header class="topbar">
        <div class="top-left"><button class="icon-button" aria-label="Buka menu" @click="open=!open"><Menu :size="23"/></button><div><h2>{{ title }}</h2><small>Panel Administrasi Puskesmas Kesambi</small></div></div>
        <div class="top-actions">
          <span class="today">{{ new Intl.DateTimeFormat('id-ID',{day:'numeric',month:'long',year:'numeric'}).format(new Date()) }}</span>
          <button class="icon-button notif" title="Notifikasi demo"><Bell :size="21"/><i></i></button>
          <div class="user-chip"><span class="avatar">{{ initials }}</span><span>{{ user?.name || 'Admin' }}</span></div>
          <button class="icon-button logout-top" title="Keluar" aria-label="Keluar dari akun" @click="signOut"><LogOut :size="19"/></button>
        </div>
      </header>
      <main class="content"><router-view/></main>
    </div>
  </div>
</template>
