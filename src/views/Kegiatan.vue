<script setup>
import CrudSection from '../components/CrudSection.vue'

// Halaman Berita & Kegiatan: konfigurasi dan konten bisa dikembangkan sendiri.
const columns = ["Kode Kegiatan", "Nama Kegiatan", "Jenis Kegiatan", "Status"]
const initialRows = [["KG-001", "Edukasi Cuci Tangan", "Penyuluhan", "Rencana"]]
</script>

<template>
  <CrudSection
    section="kegiatan"
    title="Berita & Kegiatan"
    description="Kelola publikasi berita dan kegiatan kesehatan."
    :columns="columns"
    :initial-rows="initialRows"
  />
</template>
