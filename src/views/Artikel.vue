<script setup>
import CrudSection from '../components/CrudSection.vue'

// Halaman Artikel Kesehatan: konfigurasi dan konten bisa dikembangkan sendiri.
const columns = ["Kode Artikel", "Judul Artikel", "Kategori", "Status"]
const initialRows = [["AR-001", "Pentingnya Cuci Tangan", "Edukasi", "Draft"], ["AR-002", "Pola Hidup Bersih dan Sehat", "Kesehatan", "Draft"]]
</script>

<template>
  <CrudSection
    section="artikel"
    title="Artikel Kesehatan"
    description="Kelola artikel dan edukasi kesehatan."
    :columns="columns"
    :initial-rows="initialRows"
  />
</template>
