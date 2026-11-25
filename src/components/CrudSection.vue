<script setup>
import { computed, ref } from 'vue'
import { Search, Plus, Trash2, Pencil, X, Info } from 'lucide-vue-next'

// Komponen tabel demo yang dipakai bersama oleh halaman terpisah.
// Jika nanti sudah memakai Supabase, ganti fungsi load/persist dengan service API.
const props = defineProps({
  section: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  columns: { type: Array, required: true },
  initialRows: { type: Array, default: () => [] },
  statuses: { type: Array, default: () => ['Aktif', 'Draft', 'Rencana', 'Nonaktif'] }
})

const storageKey = `kesambi-demo-${props.section}`
const cloneInitialRows = () => props.initialRows.map(row => [...row])

function loadRows() {
  try {
    const saved = window.localStorage.getItem(storageKey)
    if (saved === null) return cloneInitialRows()
    const parsed = JSON.parse(saved)
    if (Array.isArray(parsed) && parsed.every(row => Array.isArray(row) && row.length === 4)) {
      return parsed.map(row => row.map(value => String(value ?? '')))
    }
  } catch (error) {
    console.warn('Data demo tidak dapat dibaca:', error)
  }
  return cloneInitialRows()
}

const rows = ref(loadRows())
const search = ref('')
const editing = ref(-1)
const modal = ref(false)
const form = ref(['', '', '', 'Aktif'])
const formError = ref('')
const storageError = ref('')

const filtered = computed(() =>
  rows.value
    .map((row, index) => ({ row, index }))
    .filter(({ row }) => row.join(' ').toLowerCase().includes(search.value.toLowerCase()))
)

function persist() {
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(rows.value))
    storageError.value = ''
  } catch (error) {
    storageError.value = 'Perubahan belum dapat disimpan di browser ini.'
    console.error(error)
  }
}

function startAdd() {
  editing.value = -1
  form.value = ['', '', '', props.statuses[0] || 'Aktif']
  formError.value = ''
  modal.value = true
}

function startEdit(index) {
  editing.value = index
  form.value = [...rows.value[index]]
  formError.value = ''
  modal.value = true
}

function save() {
  const values = form.value.map(value => String(value ?? '').trim())
  if (!values[0] || !values[1]) {
    formError.value = 'Kode dan nama wajib diisi.'
    return
  }
  const duplicate = rows.value.some((row, index) =>
    index !== editing.value && row[0].toLowerCase() === values[0].toLowerCase()
  )
  if (duplicate) {
    formError.value = 'Kode sudah digunakan.'
    return
  }
  if (editing.value < 0) rows.value.push(values)
  else rows.value[editing.value] = values
  persist()
  modal.value = false
}

function remove(index) {
  if (!window.confirm('Hapus data demo ini?')) return
  rows.value.splice(index, 1)
  persist()
}

function exportCsv() {
  // Mencegah nilai yang dimulai dengan rumus dianggap formula ketika CSV dibuka di spreadsheet.
  const escapeCell = (value) => {
    let safe = String(value ?? '')
    if (/^[=+@\-\t\r]/.test(safe.trimStart())) safe = "'" + safe
    return '"' + safe.replaceAll('"', '""') + '"'
  }
  const csvRows = [props.columns, ...rows.value]
  const content = '\ufeff' + csvRows.map(row => row.map(escapeCell).join(',')).join('\r\n')
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${props.section}-demo.csv`
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 0)
}
</script>

<template>
  <div class="demo-banner">
    <Info :size="17" />
    Ini adalah data simulasi yang disimpan di browser, bukan di Supabase. Jangan masukkan data pasien sungguhan.
  </div>
  <div v-if="storageError" class="demo-banner" role="alert">{{ storageError }}</div>

  <div class="page-heading">
    <div>
      <h1>{{ title }}</h1>
      <p>{{ description || `Kelola informasi ${title.toLowerCase()} dengan mudah.` }}</p>
    </div>
    <div class="heading-actions">
      <button type="button" class="secondary-button" @click="exportCsv">Ekspor CSV</button>
      <button type="button" class="primary-button" @click="startAdd">
        <Plus :size="18" /> Tambah Data
      </button>
    </div>
  </div>

  <section class="panel table-panel">
    <div class="table-toolbar">
      <div class="search-box">
        <Search :size="18" />
        <input v-model="search" :placeholder="`Cari ${title.toLowerCase()}...`" />
      </div>
      <span class="record-count">{{ filtered.length }} data ditemukan</span>
    </div>
    <div class="table-scroll">
      <table>
        <thead>
          <tr>
            <th v-for="column in columns" :key="column">{{ column }}</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in filtered" :key="item.index">
            <td>{{ item.row[0] }}</td>
            <td><strong>{{ item.row[1] }}</strong></td>
            <td>{{ item.row[2] }}</td>
            <td><span class="status">{{ item.row[3] }}</span></td>
            <td>
              <div class="actions">
                <button type="button" title="Edit" :aria-label="`Edit ${item.row[1]}`" @click="startEdit(item.index)">
                  <Pencil :size="17" />
                </button>
                <button type="button" title="Hapus" :aria-label="`Hapus ${item.row[1]}`" @click="remove(item.index)">
                  <Trash2 :size="17" />
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="!filtered.length">
            <td colspan="5" class="empty">Belum ada data yang sesuai.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>

  <div v-if="modal" class="modal-backdrop" @click.self="modal = false">
    <form class="modal" @submit.prevent="save">
      <div class="modal-head">
        <h3>{{ editing === -1 ? 'Tambah' : 'Edit' }} {{ title }}</h3>
        <button type="button" class="icon-button" aria-label="Tutup" @click="modal = false">
          <X :size="19" />
        </button>
      </div>
      <label v-for="(column, index) in columns.slice(0, 3)" :key="column">
        {{ column }}
        <input v-model="form[index]" :required="index < 2" :placeholder="`Masukkan ${column.toLowerCase()}`" />
      </label>
      <label>
        {{ columns[3] }}
        <select v-model="form[3]">
          <option v-for="option in statuses" :key="option" :value="option">{{ option }}</option>
        </select>
      </label>
      <p v-if="formError" role="alert" style="color:#b91c1c;font-size:12px">{{ formError }}</p>
      <div class="modal-actions">
        <button type="button" class="secondary-button" @click="modal = false">Batal</button>
        <button type="submit" class="primary-button">Simpan</button>
      </div>
    </form>
  </div>
</template>
