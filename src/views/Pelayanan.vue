<script setup>
import CrudSection from '../components/CrudSection.vue'

// Halaman Data Pelayanan: konfigurasi dan konten bisa dikembangkan sendiri.
const columns = ["Kode Layanan", "Nama Pelayanan", "Hari Operasional", "Status"]
const initialRows = [["LY-001", "Pelayanan Umum", "Senin–Sabtu", "Aktif"], ["LY-002", "Kesehatan Ibu dan Anak", "Senin–Jumat", "Aktif"]]
</script>

<template>
  <CrudSection
    section="pelayanan"
    title="Data Pelayanan"
    description="Kelola jenis pelayanan dan jadwal Puskesmas."
    :columns="columns"
    :initial-rows="initialRows"
  />
</template>
