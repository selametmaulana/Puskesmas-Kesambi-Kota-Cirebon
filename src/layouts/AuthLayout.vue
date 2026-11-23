<script setup>
import { HeartPulse, ShieldCheck, LayoutDashboard, ClipboardCheck, LockKeyhole, Sparkles } from 'lucide-vue-next'
import '../assets/auth.css'
const year = new Date().getFullYear()
</script>

<template>
  <div class="auth-shell">
    <section class="auth-showcase" aria-label="Informasi Puskesmas Kesambi">
      <div class="auth-showcase-top">
        <div class="auth-brand">
          <span class="auth-brand-logo"><HeartPulse :size="29" :stroke-width="2.15" /></span>
          <div><strong>PUSKESMAS KESAMBI</strong><small>KOTA CIREBON</small></div>
        </div>
        <span class="auth-side-badge"><ShieldCheck :size="14"/> SUPER ADMIN PORTAL</span>
      </div>
      <div class="auth-showcase-middle">
        <div class="auth-side-kicker"><Sparkles :size="16"/> SISTEM ADMINISTRASI TERPADU</div>
        <h2>Satu sistem untuk<br/>pelayanan yang <em>lebih baik.</em></h2>
        <p>Kelola informasi, pantau layanan kesehatan, dan dukung operasional Puskesmas Kesambi melalui satu dashboard.</p>
        <div class="auth-preview" aria-hidden="true">
          <div class="auth-preview-top"><span class="auth-preview-dot"></span><span class="auth-preview-dot"></span><span class="auth-preview-dot"></span><span class="auth-preview-label">ADMIN DASHBOARD</span></div>
          <div class="auth-preview-title"><span class="auth-preview-title-icon"><LayoutDashboard :size="20"/></span><div><b>Dashboard Puskesmas</b><small>Kelola informasi secara terpusat</small></div><span class="auth-preview-live">DEMO</span></div>
          <div class="auth-preview-widgets"><div><ClipboardCheck :size="21"/><span>Manajemen data</span><b>Terorganisir</b></div><div><ShieldCheck :size="21"/><span>Akses admin</span><b>Terpusat</b></div></div>
          <div class="auth-preview-bars"><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/></div>
        </div>
      </div>
      <div class="auth-showcase-footer"><LockKeyhole :size="15"/> Akses khusus administrator Puskesmas Kesambi <span>© {{ year }}</span></div>
    </section>
    <section class="auth-form-area">
      <div class="auth-mobile-brand"><span class="auth-brand-logo"><HeartPulse :size="24"/></span><strong>Puskesmas Kesambi</strong></div>
      <div class="auth-form-wrapper"><router-view/></div>
      <footer class="auth-form-footer"><span>© {{ year }} Puskesmas Kesambi Kota Cirebon</span><span>Prototipe UI • Mode Demo</span></footer>
    </section>
  </div>
</template>
