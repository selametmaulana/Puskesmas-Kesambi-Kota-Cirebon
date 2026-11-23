
<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  ArrowRight, Eye, EyeOff,
  LockKeyhole, Mail, ShieldCheck, Info
} from 'lucide-vue-next'

import { loginSuperAdmin } from '../store/auth'

const router = useRouter()
const route = useRoute()

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const busy = ref(false)
const error = ref('')

async function submitLogin() {
  if (busy.value) return

  error.value = ''
  busy.value = true

  try {
    await loginSuperAdmin({
      email: email.value,
      password: password.value
    })

    const target =
      typeof route.query.redirect === 'string' &&
      /^\/(?!\/)/.test(route.query.redirect)
        ? route.query.redirect
        : '/'

    await router.replace(target)

  } catch (exception) {
    error.value =
      exception.message || 'Login gagal. Silakan coba lagi.'
  } finally {
    busy.value = false
  }
}
</script>


<template>
  <div class="auth-form-card">
    <span class="auth-form-kicker"><ShieldCheck :size="16"/> AKSES SUPER ADMIN</span>
    <h1>Selamat datang <span>kembali.</span></h1>
    <p class="auth-subtitle">Masuk menggunakan akun Super Admin untuk mengelola Dashboard Puskesmas Kesambi.</p>

    <div v-if="created" class="auth-notice auth-success" role="status"><CheckCircle2 :size="19"/><span>Akun berhasil dibuat. Silakan masuk dengan email dan kata sandi yang didaftarkan.</span></div>
    <div v-if="!accountExists" class="auth-notice auth-info" role="status"><Info :size="19"/><span>Belum ada akun Super Admin demo. <router-link to="/register">Buat akun pertama</router-link> untuk mulai.</span></div>
    <div v-if="error" class="auth-notice auth-error" role="alert"><Info :size="19"/><span>{{ error }}</span></div>

    <form class="auth-form" @submit.prevent="submitLogin">
      <div class="auth-field"><label for="login-email">Alamat Email</label><div class="auth-input-shell"><Mail :size="19"/><input id="login-email" v-model.trim="email" type="email" name="email" placeholder="admin@contoh.id" autocomplete="username" required autofocus/></div></div>
      <div class="auth-field"><div class="auth-field-heading"><label for="login-password">Kata Sandi</label></div><div class="auth-input-shell"><LockKeyhole :size="19"/><input id="login-password" v-model="password" :type="showPassword ? 'text' : 'password'" name="password" placeholder="Masukkan kata sandi" autocomplete="current-password" required/><button type="button" class="auth-show-toggle" :aria-label="showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'" @click="showPassword = !showPassword"><EyeOff v-if="showPassword" :size="19"/><Eye v-else :size="19"/></button></div></div>
      <button type="submit" class="auth-submit" :disabled="busy"><span>{{busy ? 'Memeriksa akun...' : 'Masuk ke Dashboard'}}</span><ArrowRight :size="19"/></button>
    </form>

    <div v-if="!accountExists" class="auth-switch">Belum punya akun? <router-link to="/register">Daftar sebagai Super Admin</router-link></div>
    <div v-else class="auth-switch auth-switch-muted"><ShieldCheck :size="15"/> Pendaftaran Super Admin ditutup setelah akun pertama dibuat.</div>
    <div class="auth-security"><LockKeyhole :size="15"/><span>Ini adalah simulasi antarmuka. Belum aman digunakan untuk data pasien atau operasional nyata.</span></div>
  </div>
</template>
