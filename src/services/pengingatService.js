import { supabase } from './supabase'

export async function listPengingat() {
  const { data, error } = await supabase.from('pengingat_obat')
    .select('id,pasien_id,jadwal_ambil,catatan_internal,status,attempts,created_at,manual_chat_opened_at,manual_chat_opened_by,manual_sent_at,manual_confirmed_by,status_pengambilan,pengambilan_dicatat_at,pengambilan_dicatat_oleh,catatan_pengambilan')
    .order('jadwal_ambil', { ascending: false }).limit(300)
  if (error) throw error
  return data ?? []
}

export async function tambahPengingat({ pasienId, jadwalISO, catatan }) {
  const { error } = await supabase.from('pengingat_obat').insert({
    pasien_id: pasienId,
    jadwal_ambil: jadwalISO,
    catatan_internal: catatan || null
  })
  if (error) throw error
}

export async function batalkanPengingat(id) {
  const { data, error } = await supabase.rpc('batalkan_pengingat_obat', { reminder_id: id })
  if (error) throw error
  if (!data) throw new Error('Jadwal tidak bisa dibatalkan karena statusnya sudah berubah.')
}

export async function konfirmasiKirimManual(id) {
  const { data, error } = await supabase.rpc('konfirmasi_kirim_manual', { reminder_id: id })
  if (error) throw error
  if (!data) throw new Error('Tidak bisa ditandai. Periksa status jadwal dan persetujuan WA.')
}

// Catatan audit bahwa tombol tautan WhatsApp diklik.
// Ini BUKAN bukti bahwa pesan berhasil terkirim.
export async function catatBukaChatWA(id) {
  const { data, error } = await supabase.rpc('catat_buka_chat_wa', { reminder_id: id })
  if (error) throw error
  if (!data) throw new Error('Tidak dapat mencatat percobaan membuka chat. Periksa persetujuan pasien dan status pengingat.')
}

// Status obat diambil dicatat petugas; tidak berkaitan dengan status WhatsApp.
export async function ubahStatusPengambilan(id, status, catatan) {
  const { data, error } = await supabase.rpc('ubah_status_pengambilan', {
    reminder_id: id, status_baru: status, catatan_baru: catatan || null
  })
  if (error) throw error
  if (!data) throw new Error('Status tidak berubah; mungkin sudah diperbarui petugas lain. Muat ulang data.')
}