<script setup>
import CrudSection from '../components/CrudSection.vue'

// Halaman Pengaturan: konfigurasi dan konten bisa dikembangkan sendiri.
const columns = ["Kode Pengaturan", "Nama Pengaturan", "Kategori", "Status"]
const initialRows = [["ST-001", "Profil Puskesmas", "Umum", "Aktif"]]
</script>

<template>
  <CrudSection
    section="pengaturan"
    title="Pengaturan"
    description="Kelola pengaturan dashboard Puskesmas."
    :columns="columns"
    :initial-rows="initialRows"
  />
</template>
