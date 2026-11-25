import { supabase } from './supabase'

const COLUMNS = 'id,kode_pasien,nama_lengkap,tanggal_lahir,jenis_kelamin,jenis_pelayanan,tanggal_pelayanan,status,no_wa,wa_opt_in,wa_opt_in_at,wa_opt_in_sumber,created_at,updated_at'

export async function listPasien() {
  const { data, error } = await supabase
    .from('pasien').select(COLUMNS)
    .order('created_at', { ascending: false }).limit(500)
  if (error) throw error
  return data ?? []
}

export async function createPasien(payload) {
  const { error } = await supabase.from('pasien').insert(payload)
  if (error) throw error
}

export async function updatePasien(id, payload) {
  const { data, error } = await supabase.from('pasien')
    .update(payload).eq('id', id).select('id')
  if (error) throw error
  if (!data?.length) throw new Error('Pasien tidak ditemukan atau akses ditolak.')
}

export async function deletePasien(id) {
  const { data, error } = await supabase.from('pasien')
    .delete().eq('id', id).select('id')
  if (error) throw error
  if (!data?.length) throw new Error('Pasien tidak ditemukan atau memiliki riwayat pengingat. Pertimbangkan menonaktifkannya.')
}