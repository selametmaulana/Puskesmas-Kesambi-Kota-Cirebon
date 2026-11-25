<script setup>
import CrudSection from '../components/CrudSection.vue'

// Halaman Jadwal Pelayanan: konfigurasi dan konten bisa dikembangkan sendiri.
const columns = ["Kode Jadwal", "Nama Pelayanan", "Hari / Jam", "Status"]
const initialRows = [["JD-001", "Pelayanan Umum", "Senin–Sabtu", "Aktif"]]
</script>

<template>
  <CrudSection
    section="jadwal"
    title="Jadwal Pelayanan"
    description="Kelola jadwal operasional dan pelayanan."
    :columns="columns"
    :initial-rows="initialRows"
  />
</template>
