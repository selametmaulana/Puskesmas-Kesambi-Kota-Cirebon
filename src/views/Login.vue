<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Info,
  Pill,
  Sparkles,
  MessageCircleHeart
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
      email: email.value.trim(),
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
      exception.message ||
      'Login gagal. Silakan coba kembali.'
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div class="login-card">

    <div class="login-badge">
      <ShieldCheck :size="16" />
      <span>Akses Super Admin</span>
    </div>

    <div class="login-heading">
      <h1>
        Selamat datang
        <span>kembali</span>
      </h1>

      <p>
        Masuk untuk mengelola data pasien, jadwal pengambilan obat,
        dan pengingat WhatsApp Puskesmas Kesambi.
      </p>
    </div>

    <div class="login-highlight">
      <div class="highlight-icon">
        <Pill :size="22" />
      </div>

      <div class="highlight-text">
        <strong>Sistem Pengingat Pengambilan Obat</strong>
        <small>Terintegrasi dengan dashboard dan monitoring pasien</small>
      </div>
    </div>

    <div
      v-if="error"
      class="login-alert"
      role="alert"
    >
      <Info :size="18" />
      <span>{{ error }}</span>
    </div>

    <form class="login-form" @submit.prevent="submitLogin">

      <div class="form-group">
        <label for="login-email">Alamat Email</label>

        <div class="input-shell">
          <Mail :size="18" />

          <input
            id="login-email"
            v-model.trim="email"
            type="email"
            placeholder="Masukkan email admin"
            autocomplete="username"
            required
            autofocus
          />
        </div>
      </div>

      <div class="form-group">
        <label for="login-password">Kata Sandi</label>

        <div class="input-shell">
          <LockKeyhole :size="18" />

          <input
            id="login-password"
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            placeholder="Masukkan kata sandi"
            autocomplete="current-password"
            required
          />

          <button
            type="button"
            class="toggle-password"
            :aria-label="showPassword ? 'Sembunyikan password' : 'Tampilkan password'"
            @click="showPassword = !showPassword"
          >
            <EyeOff v-if="showPassword" :size="18" />
            <Eye v-else :size="18" />
          </button>
        </div>
      </div>

      <button
        type="submit"
        class="login-button"
        :disabled="busy"
      >
        <span>
          {{ busy ? 'Memeriksa akun...' : 'Masuk ke Dashboard' }}
        </span>
        <ArrowRight :size="18" />
      </button>
    </form>

    <div class="login-chips">
      <span><Sparkles :size="14" /> Data pasien terkelola</span>
      <span><MessageCircleHeart :size="14" /> Pengingat lebih cepat</span>
    </div>

    <div class="login-footer-note">
      <ShieldCheck :size="15" />
      <span>
        Gunakan akun administrator yang telah terdaftar. Privasi data pasien harus dijaga.
      </span>
    </div>

  </div>
</template>

<style scoped>
.login-card {
  width: 100%;
  max-width: 500px;
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(18px);
  border: 1px solid rgba(19, 117, 86, 0.10);
  box-shadow: 0 20px 60px rgba(10, 73, 58, 0.10);
  border-radius: 28px;
  padding: 34px;
}

.login-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #eef9f3;
  color: #0b7c5d;
  border: 1px solid #d7eee4;
  padding: 10px 14px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  margin-bottom: 22px;
}

.login-heading h1 {
  margin: 0;
  color: #163e34;
  font-size: clamp(32px, 4vw, 48px);
  line-height: 1.1;
  letter-spacing: -1px;
  font-weight: 800;
}

.login-heading h1 span {
  color: #099268;
}

.login-heading p {
  margin: 14px 0 0;
  color: #68827a;
  line-height: 1.8;
  font-size: 14px;
}

.login-highlight {
  display: flex;
  align-items: center;
  gap: 14px;
  margin: 24px 0;
  padding: 16px;
  border-radius: 18px;
  background: linear-gradient(135deg, #eff9f4, #f6fffb);
  border: 1px solid #daf0e6;
}

.highlight-icon {
  width: 48px;
  height: 48px;
  flex-shrink: 0;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #d8f2e5;
  color: #099268;
}

.highlight-text strong {
  display: block;
  color: #19463b;
  font-size: 14px;
  margin-bottom: 4px;
}

.highlight-text small {
  color: #738f85;
  font-size: 12px;
  line-height: 1.6;
}

.login-alert {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  background: #fff2f2;
  color: #c34040;
  padding: 14px 16px;
  border-radius: 14px;
  border: 1px solid #ffd9d9;
  margin-bottom: 20px;
  font-size: 13px;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.form-group label {
  display: inline-block;
  margin-bottom: 9px;
  color: #21473d;
  font-weight: 700;
  font-size: 14px;
}

.input-shell {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #ffffff;
  border: 1.6px solid #d4e6df;
  border-radius: 16px;
  padding: 0 14px;
  transition: .25s ease;
}

.input-shell:focus-within {
  border-color: #11a376;
  box-shadow: 0 0 0 4px rgba(17, 163, 118, 0.10);
}

.input-shell :deep(svg) {
  color: #14906a;
  flex-shrink: 0;
}

.input-shell input {
  width: 100%;
  border: none;
  outline: none;
  background: transparent;
  padding: 17px 0;
  font-size: 14px;
  color: #173d33;
}

.input-shell input::placeholder {
  color: #9ab0a8;
}

.toggle-password {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  cursor: pointer;
  color: #7a9188;
}

.login-button {
  margin-top: 8px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  border: none;
  border-radius: 18px;
  padding: 17px 20px;
  background: linear-gradient(135deg, #0da06f, #087f65);
  color: white;
  font-weight: 700;
  font-size: 15px;
  cursor: pointer;
  transition: .25s ease;
  box-shadow: 0 14px 30px rgba(8, 127, 101, 0.22);
}

.login-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 18px 34px rgba(8, 127, 101, 0.28);
}

.login-button:disabled {
  opacity: .7;
  cursor: wait;
  transform: none;
}

.login-chips {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 22px;
}

.login-chips span {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 10px 12px;
  border-radius: 999px;
  background: #f4fbf8;
  border: 1px solid #dcefe7;
  color: #50786e;
  font-size: 12px;
  font-weight: 600;
}

.login-footer-note {
  display: flex;
  align-items: flex-start;
  gap: 9px;
  margin-top: 24px;
  padding-top: 18px;
  border-top: 1px solid #e5efea;
  color: #70877f;
  font-size: 12px;
  line-height: 1.7;
}

@media (max-width: 640px) {
  .login-card {
    padding: 24px 20px;
    border-radius: 22px;
  }

  .login-heading h1 {
    font-size: 32px;
  }
}
</style>