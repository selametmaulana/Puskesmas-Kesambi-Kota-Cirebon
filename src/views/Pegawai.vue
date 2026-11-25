<script setup>
import CrudSection from '../components/CrudSection.vue'

// Halaman Data Pegawai: konfigurasi dan konten bisa dikembangkan sendiri.
const columns = ["Kode Pegawai", "Nama Pegawai", "Jabatan", "Status"]
const initialRows = [["PG-001", "Contoh Pegawai A", "Perawat", "Aktif"], ["PG-002", "Contoh Pegawai B", "Administrasi", "Aktif"]]
</script>

<template>
  <CrudSection
    section="pegawai"
    title="Data Pegawai"
    description="Kelola daftar pegawai dan jabatan."
    :columns="columns"
    :initial-rows="initialRows"
  />
</template>
