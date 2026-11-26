<script setup>
import { computed, onMounted, ref } from 'vue'
import {
  Users, Search, Plus, Pencil, Trash2, RefreshCw,
  X, Info, AlertCircle, CheckCircle2, Download, CalendarDays,
  MessageCircle, Clock3, Send, Ban
} from 'lucide-vue-next'
import {
  listPasien, createPasien, updatePasien, deletePasien
} from '../services/pasienService'
import { listPengingat, tambahPengingat, batalkanPengingat, konfirmasiKirimManual, catatBukaChatWA, ubahStatusPengambilan } from '../services/pengingatService'
import '../assets/pasien.css'

const layananOptions = ['Umum', 'KIA', 'Imunisasi', 'Gigi', 'Gizi', 'CKG', 'Lainnya']
const genderOptions = ['Laki-laki', 'Perempuan', 'Tidak dicantumkan']

const emptyForm = () => ({
  kode_pasien: '',
  nama_lengkap: '',
  tanggal_lahir: '',
  jenis_kelamin: '',
  jenis_pelayanan: '',
  tanggal_pelayanan: '',
  status: 'Aktif',
  no_wa: '',
  wa_opt_in: false,
  wa_opt_in_sumber: ''
})

const rows = ref([])
const loading = ref(false)
const saving = ref(false)
const deletingId = ref(null)
const search = ref('')
const pageError = ref('')
const formError = ref('')
const success = ref('')
const modal = ref(false)
const editingId = ref(null)
const form = ref(emptyForm())
const reminders = ref([])
const loadingReminders = ref(false)
const reminderModal = ref(false)
const reminderSaving = ref(false)
const reminderForm = ref({ pasienId: '', tanggalWIB: '', catatan: '' })
const reminderError = ref('')
const busyReminderId = ref(null)
const confirmReminder = ref(null)
const confirmChecked = ref(false)

// Status obat benar-benar diambil adalah catatan petugas di loket, bukan status WA.
const pickupTarget = ref(null)
const pickupStatus = ref('')
const pickupNote = ref('')
const pickupError = ref('')
const pickupSaving = ref(false)
const pickupTotals = computed(() => ({
  sudah: reminders.value.filter(r => r.status_pengambilan === 'sudah_diambil').length,
  tidak: reminders.value.filter(r => r.status_pengambilan === 'tidak_diambil').length,
  belum: reminders.value.filter(r => !r.status_pengambilan || r.status_pengambilan === 'belum_diambil').length
}))

function pickupLabel(status) {
  if (status === 'sudah_diambil') return 'Sudah Diambil'
  if (status === 'tidak_diambil') return 'Tidak Diambil'
  return 'Belum Diambil'
}

function openPickup(reminder, nextStatus) {
  pickupError.value = ''
  if (reminder.status === 'dibatalkan') {
    pageError.value = 'Jadwal yang dibatalkan tidak dapat diberi status pengambilan.'
    return
  }
  if (nextStatus === 'tidak_diambil' && new Date(reminder.jadwal_ambil).getTime() > Date.now()) {
    pageError.value = 'Belum bisa menandai Tidak Diambil sebelum waktu jadwal berakhir.'
    return
  }
  if (reminder.status_pengambilan === nextStatus) return
  pickupTarget.value = reminder
  pickupStatus.value = nextStatus
  pickupNote.value = ''
}

async function savePickup() {
  if (!pickupTarget.value || pickupSaving.value) return
  pickupError.value = ''
  const note = pickupNote.value.trim()
  const isCorrection = !['belum_diambil', null, undefined].includes(pickupTarget.value.status_pengambilan)
  if ((pickupStatus.value === 'tidak_diambil' || isCorrection) && note.length < 5) {
    pickupError.value = 'Isi alasan/keterangan minimal 5 karakter untuk Tidak Diambil atau koreksi status.'
    return
  }
  pickupSaving.value = true
  try {
    await ubahStatusPengambilan(pickupTarget.value.id, pickupStatus.value, note)
    success.value = 'Status pengambilan obat berhasil disimpan di Supabase sebagai catatan petugas.'
    pickupTarget.value = null
    pickupStatus.value = ''
    pickupNote.value = ''
    await refreshReminders()
  } catch (e) {
    pickupError.value = readableError(e)
  } finally {
    pickupSaving.value = false
  }
}

const pasienById = computed(() => new Map(rows.value.map(row => [row.id, row])))
const visibleReminders = computed(() => reminders.value.filter(r => {
  const p = pasienById.value.get(r.pasien_id)
  const q = search.value.trim().toLowerCase()
  return !q || [p?.kode_pasien, p?.nama_lengkap, r.status, pickupLabel(r.status_pengambilan)].some(x => String(x ?? '').toLowerCase().includes(q))
}))

function normalizeWa(input) {
  const x = String(input || '').replace(/[^0-9]/g, '')
  if (!x) return null
  if (x.startsWith('0')) return '62' + x.slice(1)
  if (x.startsWith('8')) return '62' + x
  return x
}

function dateTimeWIB(iso) {
  return new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta', day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false
  }).format(new Date(iso)) + ' WIB'
}

function nowInputWIB() {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone:'Asia/Jakarta', year:'numeric',month:'2-digit',day:'2-digit',
    hour:'2-digit',minute:'2-digit',hourCycle:'h23'
  }).format(new Date()).replace(' ', 'T')
}

async function refreshReminders() {
  loadingReminders.value = true
  try {
    reminders.value = await listPengingat()
  } catch (e) {
    pageError.value = 'Gagal memuat pengingat: ' + readableError(e)
  } finally {
    loadingReminders.value = false
  }
}

function scheduleFor(row) {
  if (!row.no_wa || !row.wa_opt_in || row.status !== 'Aktif') {
    pageError.value = 'Pasien harus aktif, memiliki nomor WA, dan telah memberi persetujuan khusus pengingat.'
    return
  }
  reminderForm.value = { pasienId: row.id, tanggalWIB: '', catatan: '' }
  reminderError.value = ''
  reminderModal.value = true
}

async function saveReminder() {
  if (reminderSaving.value) return
  reminderError.value = ''
  const { pasienId, tanggalWIB, catatan } = reminderForm.value
  const patient = pasienById.value.get(pasienId)
  if (!patient?.wa_opt_in || !patient?.no_wa) {
    reminderError.value = 'Persetujuan WA belum ada.'
    return
  }
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(tanggalWIB)) {
    reminderError.value = 'Isi tanggal dan jam pengambilan (WIB).'
    return
  }
  const date = new Date(tanggalWIB + ':00+07:00')
  if (Number.isNaN(date.getTime()) || date.getTime() < Date.now() + 60_000) {
    reminderError.value = 'Jadwal harus minimal 1 menit dari sekarang.'
    return
  }
  reminderSaving.value = true
  try {
    await tambahPengingat({ pasienId, jadwalISO: date.toISOString(), catatan: catatan.trim().slice(0, 250) })
    reminderModal.value = false
    success.value = 'Jadwal tersimpan di Supabase. Pesan belum terkirim; gunakan tombol WA atau aktifkan integrasi API.'
    await refreshReminders()
  } catch (e) {
    reminderError.value = readableError(e)
  } finally {
    reminderSaving.value = false
  }
}

// Menghasilkan URL click-to-chat saja; tidak bisa mengirim otomatis.
function whatsappUrl(reminder) {
  const pasien = pasienById.value.get(reminder.pasien_id)
  const nomor = String(pasien?.no_wa || '').replace(/\D/g, '')
  if (reminder.status !== 'terjadwal' || !pasien?.wa_opt_in || pasien?.status !== 'Aktif' || !/^62[0-9]{8,13}$/.test(nomor)) {
    return null
  }
  const pesan = `Halo, ini pengingat dari Puskesmas Kesambi. Jadwal pengambilan Anda: ${dateTimeWIB(reminder.jadwal_ambil)}. Silakan hubungi petugas bila perlu bantuan. Jika tidak ingin menerima pengingat WA berikutnya, beri tahu petugas.`
  return `https://wa.me/${nomor}?text=${encodeURIComponent(pesan)}`
}

// Tidak melakukan preventDefault: browser langsung membuka WhatsApp pada klik.
// Catatan Supabase hanya menyatakan tombol chat diklik oleh admin.
async function recordChatClick(reminder) {
  pageError.value = ''
  success.value = ''
  if (!whatsappUrl(reminder)) {
    pageError.value = 'Pasien tidak aktif, belum menyetujui WA, atau nomor belum sesuai format.'
    return
  }
  if (busyReminderId.value) return
  busyReminderId.value = reminder.id
  try {
    await catatBukaChatWA(reminder.id)
    success.value = 'Klik Buka WhatsApp tercatat di Supabase. Petugas tetap harus menekan Kirim pada WhatsApp; pesan belum dikonfirmasi terkirim.'
    await refreshReminders()
  } catch (error) {
    pageError.value = 'Tautan WA dapat terbuka, tetapi catatan klik gagal disimpan: ' + readableError(error)
  } finally {
    busyReminderId.value = null
  }
}

function showManualConfirm(reminder) {
  if (reminder.status !== 'terjadwal' || !reminder.manual_chat_opened_at || !whatsappUrl(reminder)) return
  confirmReminder.value = reminder
  confirmChecked.value = false
}

async function confirmManual() {
  const reminder = confirmReminder.value
  if (!reminder || !confirmChecked.value || busyReminderId.value) return
  busyReminderId.value = reminder.id
  pageError.value = ''
  try {
    await konfirmasiKirimManual(reminder.id)
    success.value = 'Konfirmasi petugas dicatat di Supabase. Ini bukan bukti otomatis pesan telah diterima pasien.'
    confirmReminder.value = null
    confirmChecked.value = false
    await refreshReminders()
  } catch (error) {
    pageError.value = readableError(error)
  } finally {
    busyReminderId.value = null
  }
}

async function cancelReminder(reminder) {
  if (!window.confirm('Batalkan jadwal pengingat ini?')) return
  busyReminderId.value = reminder.id
  try {
    await batalkanPengingat(reminder.id)
    success.value = 'Jadwal pengingat dibatalkan.'
    await refreshReminders()
  } catch (e) {
    pageError.value = readableError(e)
  } finally { busyReminderId.value = null }
}


const filtered = computed(() => {
  const term = search.value.trim().toLocaleLowerCase('id-ID')
  if (!term) return rows.value
  return rows.value.filter(row =>
    [row.kode_pasien, row.nama_lengkap, row.no_wa, row.jenis_pelayanan, row.status]
      .some(value => String(value ?? '').toLocaleLowerCase('id-ID').includes(term))
  )
})

const now = new Date()
const todayISO = [
  now.getFullYear(),
  String(now.getMonth() + 1).padStart(2, '0'),
  String(now.getDate()).padStart(2, '0')
].join('-') // input date lokal YYYY-MM-DD

function dateLabel(value) {
  if (!value) return '—'
  const date = new Date(`${value}T00:00:00`)
  return Number.isNaN(date.getTime())
    ? '—'
    : new Intl.DateTimeFormat('id-ID', {
        day: '2-digit', month: 'short', year: 'numeric'
      }).format(date)
}

function readableError(error) {
  if (error?.code === '23505') return 'Kode pasien sudah digunakan. Pilih kode yang berbeda.'
  if (error?.code === '23514') return 'Ada nilai yang tidak sesuai aturan database. Periksa formulir.'
  if (error?.code === '42501' || error?.code === 'PGRST301') {
    return 'Akses database ditolak. Pastikan akun Super Admin aktif dan aturan RLS sudah terpasang.'
  }
  return error?.message || 'Terjadi kesalahan saat menghubungi Supabase.'
}

async function refresh() {
  loading.value = true
  pageError.value = ''
  try {
    rows.value = await listPasien()
    await refreshReminders()
  } catch (error) {
    rows.value = []
    pageError.value = readableError(error)
  } finally {
    loading.value = false
  }
}

function add() {
  editingId.value = null
  form.value = emptyForm()
  formError.value = ''
  modal.value = true
}

function edit(row) {
  editingId.value = row.id
  form.value = {
    kode_pasien: row.kode_pasien,
    nama_lengkap: row.nama_lengkap,
    tanggal_lahir: row.tanggal_lahir,
    jenis_kelamin: row.jenis_kelamin,
    jenis_pelayanan: row.jenis_pelayanan ?? '',
    tanggal_pelayanan: row.tanggal_pelayanan ?? '',
    status: row.status,
    no_wa: row.no_wa || '',
    wa_opt_in: Boolean(row.wa_opt_in),
    wa_opt_in_sumber: row.wa_opt_in_sumber || ''
  }
  formError.value = ''
  modal.value = true
}

function closeModal() {
  if (saving.value) return
  modal.value = false
}

async function save() {
  if (saving.value) return
  formError.value = ''

  const payload = {
    kode_pasien: form.value.kode_pasien.trim().toUpperCase(),
    nama_lengkap: form.value.nama_lengkap.trim(),
    tanggal_lahir: form.value.tanggal_lahir,
    jenis_kelamin: form.value.jenis_kelamin,
    jenis_pelayanan: form.value.jenis_pelayanan || null,
    tanggal_pelayanan: form.value.tanggal_pelayanan || null,
    status: form.value.status,
    no_wa: normalizeWa(form.value.no_wa),
    wa_opt_in: Boolean(form.value.wa_opt_in),
    wa_opt_in_sumber: form.value.wa_opt_in ? form.value.wa_opt_in_sumber : null
  }

  if (!/^[A-Z0-9][A-Z0-9-]{1,29}$/.test(payload.kode_pasien)) {
    formError.value = 'Kode pasien harus 2–30 karakter (huruf kapital, angka, atau tanda -).'
    return
  }
  if (payload.nama_lengkap.length < 2 || payload.nama_lengkap.length > 120) {
    formError.value = 'Nama lengkap harus terdiri dari 2–120 karakter.'
    return
  }
  if (!payload.tanggal_lahir || payload.tanggal_lahir > todayISO || !genderOptions.includes(payload.jenis_kelamin)) {
    formError.value = 'Periksa tanggal lahir dan jenis kelamin.'
    return
  }
  if (payload.tanggal_pelayanan && payload.tanggal_pelayanan < payload.tanggal_lahir) {
    formError.value = 'Tanggal pelayanan tidak boleh sebelum tanggal lahir.'
    return
  }
  if (payload.jenis_pelayanan && !layananOptions.includes(payload.jenis_pelayanan)) {
    formError.value = 'Jenis pelayanan tidak valid.'
    return
  }

  if (payload.no_wa && !/^62[0-9]{8,13}$/.test(payload.no_wa)) {
    formError.value = 'Nomor WA Indonesia harus valid, contoh 081234567890 (akan disimpan sebagai 6281234567890).'
    return
  }
  if (payload.wa_opt_in && (!payload.no_wa || !['Tertulis','Lisan terdokumentasi'].includes(payload.wa_opt_in_sumber))) {
    formError.value = 'Untuk persetujuan WhatsApp, isi nomor dan sumber persetujuan yang benar-benar sudah diperoleh.'
    return
  }

  saving.value = true
  try {
    if (editingId.value) await updatePasien(editingId.value, payload)
    else await createPasien(payload)
    const action = editingId.value ? 'diperbarui' : 'ditambahkan'
    modal.value = false
    success.value = `Data pasien berhasil ${action}.`
    await refresh()
  } catch (error) {
    formError.value = readableError(error)
  } finally {
    saving.value = false
  }
}

async function remove(row) {
  if (deletingId.value) return
  if (!window.confirm(`Hapus data ${row.kode_pasien} (${row.nama_lengkap}) dari database? Tindakan ini tidak dapat dibatalkan.`)) return

  deletingId.value = row.id
  pageError.value = ''
  try {
    await deletePasien(row.id)
    success.value = `Data ${row.kode_pasien} dihapus.`
    await refresh()
  } catch (error) {
    pageError.value = readableError(error)
  } finally {
    deletingId.value = null
  }
}

function exportCsv() {
  if (!filtered.value.length) return
  if (!window.confirm('Ekspor data akan membuat salinan data pribadi di perangkat ini. Lanjutkan hanya jika berwenang dan perangkat aman.')) return
  const header = ['Kode Pasien','Nama Lengkap','Tanggal Lahir','Jenis Kelamin','Jenis Pelayanan','Tanggal Pelayanan','Status']
  const data = filtered.value.map(row => [
    row.kode_pasien, row.nama_lengkap, row.tanggal_lahir, row.jenis_kelamin,
    row.jenis_pelayanan || '', row.tanggal_pelayanan || '', row.status
  ])
  const cell = value => {
    let safe = String(value ?? '')
    if (/^\s*[=+@\-]/.test(safe)) safe = "'" + safe
    return `"${safe.replaceAll('"', '""')}"`
  }
  const csv = '\ufeff' + [header, ...data].map(row => row.map(cell).join(',')).join('\r\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'data-pasien-kesambi.csv'
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

onMounted(refresh)
</script>

<template>
  <div class="patient-page">
    <div class="patient-disclaimer"><Info :size="18" />
      Data tersimpan di database.
    </div>

    <div class="page-heading">
      <div>
        <span class="patient-eyebrow"><Users :size="15" /> MANAJEMEN PASIEN</span>
        <h1>Data Pasien</h1>
        <p>Kelola kontak pasien dan jadwalkan pengingat pengambilan obat melalui WhatsApp.</p>
      </div>
      <div class="heading-actions">
        <button type="button" class="secondary-button" :disabled="loading" @click="refresh">
          <RefreshCw :size="16" :class="{ 'patient-spin': loading }"/> Muat Ulang
        </button>
        <button type="button" class="secondary-button" :disabled="!filtered.length" @click="exportCsv">
          <Download :size="16" /> Ekspor CSV
        </button>
        <button type="button" class="primary-button" @click="add">
          <Plus :size="18" /> Tambah Pasien
        </button>
      </div>
    </div>

    <div v-if="pageError" class="patient-alert patient-alert-error" role="alert">
      <AlertCircle :size="18"/> {{ pageError }}
    </div>
    <div v-if="success" class="patient-alert patient-alert-success" role="status">
      <CheckCircle2 :size="18"/> {{ success }}
      <button type="button" aria-label="Tutup pemberitahuan" @click="success=''">×</button>
    </div>

    <div class="patient-summary">
      <div><span>Total data dimuat</span><strong>{{ rows.length }}</strong></div>
      <div><span>Status aktif</span><strong>{{ rows.filter(r => r.status === 'Aktif').length }}</strong></div>
      <div><span>Ditampilkan</span><strong>{{ filtered.length }}</strong></div>
    </div>

    <section class="panel table-panel patient-table">
      <div class="table-toolbar patient-toolbar">
        <div class="search-box"><Search :size="18"/>
          <input v-model="search" type="search" aria-label="Cari pasien" placeholder="Cari kode, nama, nomor WA..." />
        </div>
        <span class="record-count">{{ filtered.length }} data ditemukan · maksimal 500 data terbaru</span>
      </div>
      <div class="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Kode Pasien</th>
              <th>Nama Lengkap</th>
              <th>Tanggal Lahir</th>
              <th>Jenis Kelamin</th>
              <th>Nomor WA</th>
              <th>Persetujuan WA</th>
              <th>Pelayanan Terakhir</th>
              <th>Tanggal Pelayanan</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading"><td colspan="10" class="empty">Memuat data pasien dari Supabase...</td></tr>
            <tr v-else-if="!filtered.length"><td colspan="10" class="empty">
              {{ rows.length ? 'Tidak ada pasien yang cocok dengan pencarian.' : 'Belum ada data pasien di database.' }}
            </td></tr>
            <tr v-for="row in (loading ? [] : filtered)" :key="row.id">
              <td><span class="patient-code">{{ row.kode_pasien }}</span></td>
              <td><strong>{{ row.nama_lengkap }}</strong></td>
              <td>{{ dateLabel(row.tanggal_lahir) }}</td>
              <td>{{ row.jenis_kelamin }}</td>
              <td>{{ row.no_wa || '—' }}</td>
              <td>{{ row.wa_opt_in ? 'Setuju' : 'Belum' }}</td>
              <td>{{ row.jenis_pelayanan || '—' }}</td>
              <td>{{ dateLabel(row.tanggal_pelayanan) }}</td>
              <td><span class="status" :class="{ 'patient-status-inactive': row.status !== 'Aktif' }">{{ row.status }}</span></td>
              <td>
                <div class="actions patient-actions">
                  <button type="button" :disabled="!row.wa_opt_in || !row.no_wa" title="Buat jadwal pengambilan obat" :aria-label="`Buat pengingat untuk ${row.kode_pasien}`" @click="scheduleFor(row)"><Clock3 :size="17"/></button>
                  <button type="button" :title="`Edit ${row.kode_pasien}`" :aria-label="`Edit ${row.kode_pasien}`" @click="edit(row)"><Pencil :size="17"/></button>
                  <button type="button" :disabled="deletingId===row.id" :title="`Hapus ${row.kode_pasien}`" :aria-label="`Hapus ${row.kode_pasien}`" @click="remove(row)"><Trash2 :size="17"/></button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <div v-if="modal" class="modal-backdrop" @click.self="closeModal">
      <form class="modal patient-modal" @submit.prevent="save">
        <div class="modal-head">
          <div><h3>{{ editingId ? 'Edit Data Pasien' : 'Tambah Data Pasien' }}</h3><p>Lengkapi informasi administrasi berikut.</p></div>
          <button type="button" class="icon-button" aria-label="Tutup formulir" :disabled="saving" @click="closeModal"><X :size="19"/></button>
        </div>
        <div v-if="formError" class="patient-alert patient-alert-error" role="alert"><AlertCircle :size="16"/>{{ formError }}</div>
        <div class="patient-form-grid">
          <label>Kode Pasien *
            <input v-model="form.kode_pasien" type="text" maxlength="30" placeholder="PS-003" autocomplete="off" required />
          </label>
          <label>Nama Lengkap *
            <input v-model="form.nama_lengkap" type="text" maxlength="120" placeholder="Nama pasien uji" autocomplete="off" required />
          </label>
          <label>Tanggal Lahir *
            <input v-model="form.tanggal_lahir" type="date" :max="todayISO" required />
          </label>
          <label>Jenis Kelamin *
            <select v-model="form.jenis_kelamin" required>
              <option value="" disabled>Pilih jenis kelamin</option>
              <option v-for="option in genderOptions" :key="option">{{ option }}</option>
            </select>
          </label>
          <label>Jenis Pelayanan
            <select v-model="form.jenis_pelayanan">
              <option value="">Belum ditentukan</option>
              <option v-for="option in layananOptions" :key="option">{{ option }}</option>
            </select>
          </label>
          <label><span><CalendarDays :size="14"/> Tanggal Pelayanan</span>
            <input v-model="form.tanggal_pelayanan" type="date" />
          </label>
          <label>Nomor WhatsApp pasien
            <input v-model="form.no_wa" type="tel" maxlength="18" placeholder="081234567890" autocomplete="off" />
          </label>
          <label>Sumber persetujuan pengingat WhatsApp
            <select v-model="form.wa_opt_in_sumber" :disabled="!form.wa_opt_in">
              <option value="">Pilih sumber persetujuan</option>
              <option>Tertulis</option>
              <option>Lisan terdokumentasi</option>
            </select>
          </label>
          <label class="wa-optin-check">
            <input v-model="form.wa_opt_in" type="checkbox" />
            <span>Pasien sudah secara khusus menyetujui pesan pengingat jadwal melalui WA Puskesmas Kesambi.</span>
          </label>
          <label>Status Administrasi *
            <select v-model="form.status" required>
              <option>Aktif</option>
              <option>Nonaktif</option>
            </select>
          </label>
        </div>
        <p class="patient-form-note">Nomor WA disimpan berformat 62… Jangan centang persetujuan tanpa izin nyata dari pasien. Isi pesan pengingat dibuat netral tanpa nama obat, diagnosis, atau rekam medis.</p>
        <div class="modal-actions">
          <button type="button" class="secondary-button" :disabled="saving" @click="closeModal">Batal</button>
          <button type="submit" class="primary-button" :disabled="saving">{{ saving ? 'Menyimpan...' : 'Simpan Data' }}</button>
        </div>
      </form>
    </div>

    <section class="panel table-panel patient-table reminder-panel">
      <div class="reminder-panel-head">
        <div><h3><Clock3 :size="20" /> Jadwal Pengingat Pengambilan Obat</h3>
          <p>Pengiriman manual: buka WhatsApp, tekan Kirim di aplikasi WhatsApp, lalu konfirmasi di dashboard. Semua tindakan petugas dicatat di Supabase.</p>
        </div>
        <span class="record-count">{{ visibleReminders.length }} pengingat</span>
      </div>
      <div class="pickup-summary" aria-label="Ringkasan status pengambilan obat">
        <span class="pickup-summary-success"><CheckCircle2 :size="16"/> Sudah Diambil <b>{{ pickupTotals.sudah }}</b></span>
        <span class="pickup-summary-missed"><AlertCircle :size="16"/> Tidak Diambil <b>{{ pickupTotals.tidak }}</b></span>
        <span class="pickup-summary-pending"><Clock3 :size="16"/> Belum Diambil <b>{{ pickupTotals.belum }}</b></span>
      </div>
      <div class="table-scroll"><table>
        <thead><tr><th>Pasien</th><th>Nomor WA</th><th>Jadwal (WIB)</th><th>Status pengiriman WA</th><th>Status Pengambilan Obat</th><th>Aksi</th></tr></thead>
        <tbody>
          <tr v-if="loadingReminders"><td colspan="6" class="empty">Memuat jadwal...</td></tr>
          <tr v-else-if="!visibleReminders.length"><td colspan="6" class="empty">Belum ada jadwal pengingat.</td></tr>
          <tr v-for="r in (loadingReminders ? [] : visibleReminders)" :key="r.id">
            <td><strong>{{ pasienById.get(r.pasien_id)?.nama_lengkap || 'Pasien tidak dimuat' }}</strong>
              <small class="reminder-small">{{ pasienById.get(r.pasien_id)?.kode_pasien || '—' }}</small></td>
            <td>{{ pasienById.get(r.pasien_id)?.no_wa || '—' }}</td>
            <td>{{ dateTimeWIB(r.jadwal_ambil) }}</td>
            <td>
              <span class="reminder-status" :class="'reminder-'+r.status">
                {{ r.status === 'dikirim_manual' ? 'Dikonfirmasi petugas' : r.status.replaceAll('_', ' ') }}
              </span>
              <small v-if="r.manual_chat_opened_at" class="reminder-small">Tautan WA diklik: {{ dateTimeWIB(r.manual_chat_opened_at) }}</small>
              <small v-if="r.manual_sent_at" class="reminder-small">Konfirmasi: {{ dateTimeWIB(r.manual_sent_at) }}</small>
            </td>
            <td>
              <span class="pickup-badge" :class="'pickup-' + (r.status_pengambilan || 'belum_diambil')">
                <CheckCircle2 v-if="r.status_pengambilan === 'sudah_diambil'" :size="14"/>
                <AlertCircle v-else-if="r.status_pengambilan === 'tidak_diambil'" :size="14"/>
                <Clock3 v-else :size="14"/>
                {{ pickupLabel(r.status_pengambilan) }}
              </span>
              <small v-if="r.pengambilan_dicatat_at" class="reminder-small">Dicatat: {{ dateTimeWIB(r.pengambilan_dicatat_at) }}</small>
              <small v-if="r.catatan_pengambilan" class="reminder-small pickup-note">Catatan: {{ r.catatan_pengambilan }}</small>
            </td>
            <td>
              <div class="actions reminder-actions">
                <a v-if="whatsappUrl(r)" :href="whatsappUrl(r)" target="_blank" rel="noopener noreferrer"
                  class="wa-manual-link" title="Buka WhatsApp: petugas harus menekan Kirim"
                  @click="recordChatClick(r)"><MessageCircle :size="17" /> Buka WA</a>
                <button v-if="r.status === 'terjadwal' && r.manual_chat_opened_at" type="button"
                  class="manual-confirm-btn" title="Konfirmasi petugas sudah menekan Kirim di WhatsApp"
                  :disabled="busyReminderId===r.id" @click="showManualConfirm(r)"><Send :size="17" /> Konfirmasi</button>
                <button v-if="r.status !== 'dibatalkan'" type="button"
                  class="pickup-action pickup-action-success" title="Petugas mengonfirmasi pasien sudah mengambil obat"
                  :disabled="pickupSaving || r.status_pengambilan === 'sudah_diambil'"
                  @click="openPickup(r, 'sudah_diambil')"><CheckCircle2 :size="15"/> Sudah Ambil</button>
                <button v-if="r.status !== 'dibatalkan'" type="button"
                  class="pickup-action pickup-action-missed" title="Petugas mengonfirmasi pasien tidak mengambil obat setelah jadwal berlalu"
                  :disabled="pickupSaving || r.status_pengambilan === 'tidak_diambil' || new Date(r.jadwal_ambil).getTime() > Date.now()"
                  @click="openPickup(r, 'tidak_diambil')"><AlertCircle :size="15"/> Tidak Ambil</button>
                <button v-if="r.status === 'terjadwal' && (r.status_pengambilan || 'belum_diambil') === 'belum_diambil'" type="button" title="Batalkan jadwal"
                  :disabled="busyReminderId===r.id" @click="cancelReminder(r)"><Ban :size="17" /></button>
              </div>
            </td>
          </tr>
        </tbody>
      </table></div>
      <p class="patient-form-note reminder-footnote">Status <b>pengiriman WhatsApp</b> dan <b>pengambilan obat</b> adalah dua hal berbeda. Klik <b>Sudah Ambil</b> hanya setelah petugas memverifikasi pengambilan obat; klik <b>Tidak Ambil</b> setelah jadwal berlalu dan petugas memastikan obat belum diambil. Kedua status ini dicatat manual, bukan terdeteksi otomatis.</p>
    </section>

    <div v-if="reminderModal" class="modal-backdrop" @click.self="!reminderSaving && (reminderModal=false)">
      <form class="modal patient-modal reminder-modal" @submit.prevent="saveReminder">
        <div class="modal-head"><div><h3>Jadwalkan Pengingat Obat</h3><p>{{ pasienById.get(reminderForm.pasienId)?.nama_lengkap }}</p></div>
          <button type="button" class="icon-button" aria-label="Tutup" :disabled="reminderSaving" @click="reminderModal=false"><X :size="19"/></button></div>
        <div v-if="reminderError" class="patient-alert patient-alert-error" role="alert"><AlertCircle :size="16"/> {{ reminderError }}</div>
        <label>Tanggal dan jam pengambilan (WIB) *
          <input v-model="reminderForm.tanggalWIB" type="datetime-local" :min="nowInputWIB()" required />
        </label>
        <label>Catatan internal petugas (tidak ikut dikirim)
          <input v-model="reminderForm.catatan" type="text" maxlength="250" placeholder="Contoh: konfirmasi di loket obat" />
        </label>
        <p class="patient-form-note">Pengingat hanya tersimpan saat tombol Simpan Jadwal ditekan. Klik Buka WA kemudian tekan Kirim di WhatsApp Web; setelah itu konfirmasi manual melalui dashboard.</p>
        <div class="modal-actions"><button type="button" class="secondary-button" @click="reminderModal=false">Batal</button>
          <button type="submit" class="primary-button" :disabled="reminderSaving">{{ reminderSaving ? 'Menyimpan...' : 'Simpan Jadwal' }}</button></div>
      </form>
    </div>
    <div v-if="pickupTarget" class="modal-backdrop" @click.self="!pickupSaving && (pickupTarget=null)">
      <form class="modal reminder-modal" @submit.prevent="savePickup">
        <div class="modal-head">
          <div>
            <h3>Konfirmasi Status Pengambilan</h3>
            <p>Perubahan tersimpan sebagai catatan petugas di Supabase.</p>
          </div>
          <button type="button" class="icon-button" aria-label="Tutup" :disabled="pickupSaving" @click="pickupTarget=null"><X :size="19"/></button>
        </div>
        <div v-if="pickupError" class="patient-alert patient-alert-error" role="alert"><AlertCircle :size="17"/> {{ pickupError }}</div>
        <p class="patient-form-note">
          Pasien: <b>{{ pasienById.get(pickupTarget.pasien_id)?.nama_lengkap || 'Tidak ditemukan' }}</b><br>
          Jadwal: {{ dateTimeWIB(pickupTarget.jadwal_ambil) }}<br>
          Status sebelumnya: {{ pickupLabel(pickupTarget.status_pengambilan) }}<br>
          Status baru: <b>{{ pickupLabel(pickupStatus) }}</b>
        </p>
        <label>Keterangan petugas {{ pickupStatus === 'tidak_diambil' || !['belum_diambil', null, undefined].includes(pickupTarget.status_pengambilan) ? '*' : '(opsional)' }}
          <textarea v-model="pickupNote" rows="3" maxlength="300"
            placeholder="Contoh: Tidak datang sampai jadwal berakhir / Sudah diambil di loket"
            :required="pickupStatus === 'tidak_diambil' || !['belum_diambil', null, undefined].includes(pickupTarget.status_pengambilan)" />
        </label>
        <div class="modal-actions">
          <button type="button" class="secondary-button" :disabled="pickupSaving" @click="pickupTarget=null">Batal</button>
          <button type="submit" class="primary-button" :disabled="pickupSaving">
            {{ pickupSaving ? 'Menyimpan...' : 'Simpan Status Pengambilan' }}
          </button>
        </div>
      </form>
    </div>
    <div v-if="confirmReminder" class="modal-backdrop" @click.self="confirmReminder=null">
    <form class="modal reminder-modal" @submit.prevent="confirmManual">
      <div class="modal-head">
        <div><h3>Konfirmasi Pengiriman Manual</h3><p>Pastikan pesan benar-benar sudah kamu kirim di WhatsApp.</p></div>
        <button type="button" class="icon-button" aria-label="Tutup" :disabled="!!busyReminderId" @click="confirmReminder=null"><X :size="19"/></button>
      </div>
      <p class="patient-form-note">Pasien: {{ pasienById.get(confirmReminder.pasien_id)?.kode_pasien || '—' }} · Jadwal {{ dateTimeWIB(confirmReminder.jadwal_ambil) }}</p>
      <label class="wa-optin-check manual-confirm-checkbox">
        <input v-model="confirmChecked" type="checkbox" required />
        <span>Saya sudah menekan <b>Kirim</b> di WhatsApp dan melihat pesan muncul dalam riwayat percakapan pengirim.</span>
      </label>
      <div class="modal-actions">
        <button type="button" class="secondary-button" :disabled="!!busyReminderId" @click="confirmReminder=null">Batal</button>
        <button type="submit" class="primary-button" :disabled="!confirmChecked || !!busyReminderId">
          {{ busyReminderId ? 'Menyimpan...' : 'Simpan Konfirmasi ke Supabase' }}
        </button>
      </div>
    </form>
  </div>
</div>
</template>