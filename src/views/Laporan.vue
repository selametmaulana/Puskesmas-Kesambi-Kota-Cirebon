<script setup>
import CrudSection from '../components/CrudSection.vue'

// Halaman Laporan: konfigurasi dan konten bisa dikembangkan sendiri.
const columns = ["Kode Laporan", "Nama Laporan", "Periode", "Status"]
const initialRows = [["LP-001", "Rekap Kunjungan", "Bulanan", "Draft"]]
</script>

<template>
  <CrudSection
    section="laporan"
    title="Laporan"
    description="Kelola rekap dan laporan kegiatan."
    :columns="columns"
    :initial-rows="initialRows"
  />
</template>
