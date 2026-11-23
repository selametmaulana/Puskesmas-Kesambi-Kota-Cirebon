<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, UserRound, ShieldCheck, Info, Check } from 'lucide-vue-next'
import { registerSuperAdmin } from '../store/auth'

const router = useRouter()
const name = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)
const showConfirm = ref(false)
const busy = ref(false)
const error = ref('')
const requirements = computed(() => [
  { text: 'Minimal 10 karakter', met: password.value.length >= 10 },
  { text: 'Huruf besar dan kecil', met: /[A-Z]/.test(password.value) && /[a-z]/.test(password.value) },
  { text: 'Mengandung angka', met: /\d/.test(password.value) }
])

async function submitRegister() {
  if (busy.value) return
  error.value = ''
  if (password.value !== confirmPassword.value) {
    error.value = 'Konfirmasi kata sandi belum sama.'
    return
  }
  busy.value = true
  try {
    await registerSuperAdmin({ name: name.value, email: email.value, password: password.value })
    await router.replace({ name: 'login', query: { created: '1', email: email.value.trim().toLowerCase() } })
  } catch (exception) {
    error.value = exception.message || 'Pendaftaran gagal. Silakan coba lagi.'
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div class="auth-form-card">
    <span class="auth-form-kicker"><ShieldCheck :size="16"/> SETUP AKUN PERTAMA</span>
    <h1>Buat akun <span>Super Admin.</span></h1>
    <p class="auth-subtitle">Daftarkan akun administrator utama untuk mengakses dan mengelola dashboard Puskesmas Kesambi.</p>
    <div class="auth-notice auth-info"><Info :size="18"/><span>Mode demo: hanya satu akun Super Admin yang dapat dibuat per browser. Pendaftaran produksi harus dilakukan oleh pengelola sistem yang berwenang.</span></div>
    <div v-if="error" class="auth-notice auth-error" role="alert"><Info :size="19"/><span>{{ error }}</span></div>

    <form class="auth-form auth-register-form" @submit.prevent="submitRegister">
      <div class="auth-field"><label for="register-name">Nama Lengkap</label><div class="auth-input-shell"><UserRound :size="19"/><input id="register-name" v-model.trim="name" type="text" name="name" placeholder="Nama lengkap administrator" minlength="3" maxlength="90" autocomplete="name" required autofocus/></div></div>
      <div class="auth-field"><label for="register-email">Alamat Email</label><div class="auth-input-shell"><Mail :size="19"/><input id="register-email" v-model.trim="email" type="email" name="email" placeholder="admin@contoh.id" autocomplete="email" required/></div></div>
      <div class="auth-field"><label for="register-password">Kata Sandi</label><div class="auth-input-shell"><LockKeyhole :size="19"/><input id="register-password" v-model="password" :type="showPassword ? 'text' : 'password'" name="password" placeholder="Buat kata sandi yang kuat" autocomplete="new-password" minlength="10" required/><button type="button" class="auth-show-toggle" :aria-label="showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'" @click="showPassword = !showPassword"><EyeOff v-if="showPassword" :size="19"/><Eye v-else :size="19"/></button></div>
        <div class="auth-password-requirements"><span v-for="item in requirements" :key="item.text" :class="{met:item.met}"><Check :size="13"/>{{item.text}}</span></div>
      </div>
      <div class="auth-field"><label for="register-confirm">Konfirmasi Kata Sandi</label><div class="auth-input-shell"><LockKeyhole :size="19"/><input id="register-confirm" v-model="confirmPassword" :type="showConfirm ? 'text' : 'password'" name="confirmPassword" placeholder="Ulangi kata sandi" autocomplete="new-password" required/><button type="button" class="auth-show-toggle" :aria-label="showConfirm ? 'Sembunyikan konfirmasi' : 'Tampilkan konfirmasi'" @click="showConfirm = !showConfirm"><EyeOff v-if="showConfirm" :size="19"/><Eye v-else :size="19"/></button></div></div>
      <button type="submit" class="auth-submit" :disabled="busy"><span>{{busy ? 'Membuat akun...' : 'Buat Akun Super Admin'}}</span><ArrowRight :size="19"/></button>
    </form>
    <div class="auth-switch">Sudah punya akun? <router-link to="/login">Masuk di sini</router-link></div>
    <div class="auth-security"><LockKeyhole :size="15"/><span>Data akun demo tersimpan pada browser lokal. Jangan gunakan email atau kata sandi sungguhan.</span></div>
  </div>
</template>
