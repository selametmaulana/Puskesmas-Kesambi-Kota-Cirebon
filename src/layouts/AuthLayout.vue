<script setup>
import {
  HeartPulse,
  ShieldCheck,
  Pill,
  Users,
  CalendarClock,
  MessageCircleMore,
  CheckCircle2,
  Sparkles,
  BellRing,
  Activity
} from 'lucide-vue-next'

const year = new Date().getFullYear()

const features = [
  {
    title: 'Data Pasien',
    description: 'Informasi pasien tersimpan rapi dan mudah dikelola.',
    icon: Users
  },
  {
    title: 'Jadwal Obat',
    description: 'Pantau jadwal pengambilan obat secara terstruktur.',
    icon: CalendarClock
  },
  {
    title: 'Pengingat WhatsApp',
    description: 'Membantu pengiriman pengingat ke pasien lebih cepat.',
    icon: MessageCircleMore
  },
  {
    title: 'Status Pengambilan',
    description: 'Monitoring apakah obat sudah diambil atau belum.',
    icon: CheckCircle2
  }
]
</script>

<template>
  <main class="auth-layout">

    <aside class="brand-side">
      <div class="bg-orb orb-1"></div>
      <div class="bg-orb orb-2"></div>
      <div class="grid-overlay"></div>

      <header class="brand-header">
        <div class="brand-logo-group">
          <div class="brand-logo">
            <HeartPulse :size="32" />
          </div>

          <div class="brand-text">
            <strong>PUSKESMAS KESAMBI</strong>
            <small>KOTA CIREBON</small>
          </div>
        </div>

        <div class="brand-pill">
          <ShieldCheck :size="15" />
          <span>SUPER ADMIN PORTAL</span>
        </div>
      </header>

      <section class="brand-copy">
        <span class="mini-kicker">
          <Pill :size="16" />
          SISTEM PENGINGAT OBAT
        </span>

        <h1>
          Pengambilan obat tepat waktu,
          <span>pelayanan lebih berkualitas.</span>
        </h1>

        <p>
          Platform administrasi untuk mengelola data pasien,
          jadwal pengambilan obat, dan pengingat WhatsApp
          secara lebih rapi, cepat, dan terintegrasi.
        </p>
      </section>

      <section class="preview-panel">
        <div class="preview-top">
          <div class="window-dots">
            <i></i>
            <i></i>
            <i></i>
          </div>

          <small>MEDICINE REMINDER DASHBOARD</small>
        </div>

        <div class="preview-main-card">
          <div class="preview-title">
            <div class="preview-icon">
              <BellRing :size="20" />
            </div>

            <div>
              <strong>Pengingat Pengambilan Obat</strong>
              <span>Dashboard monitoring pasien terintegrasi</span>
            </div>
          </div>

          <div class="preview-stats">
            <div class="stat-box">
              <small>Total Pasien</small>
              <strong>128</strong>
            </div>
            <div class="stat-box">
              <small>Jadwal Hari Ini</small>
              <strong>24</strong>
            </div>
            <div class="stat-box">
              <small>Pesan Terkirim</small>
              <strong>20</strong>
            </div>
          </div>

          <div class="feature-grid">
            <div
              v-for="feature in features"
              :key="feature.title"
              class="feature-item"
            >
              <div class="feature-icon">
                <component :is="feature.icon" :size="18" />
              </div>

              <div>
                <strong>{{ feature.title }}</strong>
                <small>{{ feature.description }}</small>
              </div>
            </div>
          </div>

          <div class="preview-footer">
            <Activity :size="16" />
            <span>Monitoring jadwal dan pengambilan obat pasien.</span>
          </div>
        </div>
      </section>

      <footer class="brand-footer">
        <span>© {{ year }} Puskesmas Kesambi Kota Cirebon</span>

        <span class="footer-chip">
          <Sparkles :size="14" />
          Portal Administrator
        </span>
      </footer>
    </aside>

    <section class="form-side">
      <div class="form-glow glow-1"></div>
      <div class="form-glow glow-2"></div>

      <router-view />
    </section>
  </main>
</template>

<style scoped>
.auth-layout,
.auth-layout * {
  box-sizing: border-box;
}

.auth-layout {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 52% 48%;
  background: #ffffff;
}

/* LEFT SIDE */

.brand-side {
  position: relative;
  overflow: hidden;
  padding: 38px clamp(26px, 4vw, 58px);
  background:
    radial-gradient(circle at top left, rgba(61, 202, 146, 0.22), transparent 30%),
    linear-gradient(145deg, #0a5f4a 0%, #074838 48%, #052f2a 100%);
  color: #ffffff;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 30px;
}

.bg-orb {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
}

.orb-1 {
  width: 520px;
  height: 520px;
  background: rgba(255,255,255,0.05);
  right: -190px;
  top: 80px;
}

.orb-2 {
  width: 760px;
  height: 760px;
  background: rgba(255,255,255,0.03);
  right: -330px;
  top: -50px;
}

.grid-overlay {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px);
  background-size: 28px 28px;
  mask-image: linear-gradient(to bottom, rgba(0,0,0,.45), transparent 85%);
  pointer-events: none;
}

.brand-header,
.brand-copy,
.preview-panel,
.brand-footer {
  position: relative;
  z-index: 1;
}

.brand-header {
  display: flex;
  justify-content: space-between;
  gap: 18px;
  align-items: center;
  flex-wrap: wrap;
}

.brand-logo-group {
  display: flex;
  align-items: center;
  gap: 14px;
}

.brand-logo {
  width: 58px;
  height: 58px;
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #edfff6;
  color: #08956c;
  box-shadow: 0 10px 30px rgba(0,0,0,.10);
}

.brand-text strong {
  display: block;
  font-size: 17px;
  font-weight: 800;
}

.brand-text small {
  display: block;
  margin-top: 4px;
  font-size: 11px;
  letter-spacing: 2px;
  color: #bce7d8;
}

.brand-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-radius: 999px;
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.15);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: .7px;
}

.brand-copy {
  margin-top: 6px;
}

.mini-kicker {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #9ee8ce;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 1.2px;
}

.brand-copy h1 {
  margin: 18px 0 16px;
  font-size: clamp(34px, 4vw, 56px);
  line-height: 1.08;
  font-weight: 800;
  letter-spacing: -1.5px;
}

.brand-copy h1 span {
  color: #8ee4c6;
}

.brand-copy p {
  max-width: 680px;
  margin: 0;
  color: #c7e6dd;
  font-size: 15px;
  line-height: 1.85;
}

.preview-panel {
  max-width: 700px;
}

.preview-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
  color: #d9f3ea;
}

.preview-top small {
  font-size: 10px;
  letter-spacing: 1.2px;
  font-weight: 700;
}

.window-dots {
  display: flex;
  gap: 6px;
}

.window-dots i {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: #f6a698;
}

.window-dots i:nth-child(2) {
  background: #f4d479;
}

.window-dots i:nth-child(3) {
  background: #8bdbb6;
}

.preview-main-card {
  background: rgba(255,255,255,0.92);
  color: #173f34;
  border-radius: 26px;
  padding: 22px;
  border: 1px solid rgba(255,255,255,.55);
  box-shadow: 0 20px 50px rgba(0,0,0,.16);
}

.preview-title {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 18px;
}

.preview-icon {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #dff5ea;
  color: #0b8f68;
}

.preview-title strong {
  display: block;
  font-size: 15px;
  font-weight: 800;
}

.preview-title span {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  color: #7a948a;
}

.preview-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}

.stat-box {
  background: #f7fcf9;
  border: 1px solid #e2f0ea;
  border-radius: 16px;
  padding: 14px;
}

.stat-box small {
  display: block;
  color: #7d968d;
  font-size: 11px;
  margin-bottom: 8px;
}

.stat-box strong {
  font-size: 24px;
  color: #0b8c66;
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.feature-item {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  background: #ffffff;
  border: 1px solid #e4efea;
  border-radius: 16px;
  padding: 14px;
}

.feature-icon {
  width: 38px;
  height: 38px;
  flex-shrink: 0;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #e9f8f1;
  color: #0d956d;
}

.feature-item strong {
  display: block;
  font-size: 13px;
  color: #173f34;
  margin-bottom: 4px;
}

.feature-item small {
  display: block;
  color: #80978f;
  font-size: 11px;
  line-height: 1.55;
}

.preview-footer {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 16px;
  color: #0b8f68;
  font-size: 12px;
  font-weight: 600;
}

.brand-footer {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
  position: relative;
  z-index: 1;
  color: #b5d9cc;
  font-size: 11px;
}

.footer-chip {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 8px 12px;
  border-radius: 999px;
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.15);
}

/* RIGHT SIDE */

.form-side {
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px clamp(24px, 6vw, 80px);
  background:
    radial-gradient(circle at top right, rgba(17, 163, 118, 0.08), transparent 28%),
    linear-gradient(180deg, #fbfefd 0%, #f6fbf8 100%);
}

.form-glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(50px);
  opacity: .45;
  pointer-events: none;
}

.glow-1 {
  width: 240px;
  height: 240px;
  background: #bdeed8;
  top: 70px;
  right: 60px;
}

.glow-2 {
  width: 200px;
  height: 200px;
  background: #d6fff0;
  bottom: 100px;
  left: 80px;
}

.form-side :deep(.login-card) {
  position: relative;
  z-index: 1;
}

/* RESPONSIVE */

@media (max-width: 1100px) {
  .auth-layout {
    grid-template-columns: 1fr;
  }

  .brand-side {
    padding: 28px 24px;
  }

  .form-side {
    padding: 32px 20px 40px;
  }
}

@media (max-width: 768px) {
  .preview-stats,
  .feature-grid {
    grid-template-columns: 1fr;
  }

  .brand-copy h1 {
    font-size: 34px;
  }

  .brand-copy p {
    font-size: 14px;
  }

  .brand-pill {
    display: none;
  }

  .preview-main-card {
    padding: 18px;
  }
}
</style>