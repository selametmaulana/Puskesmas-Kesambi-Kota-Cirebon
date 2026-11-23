
import { supabase } from '../services/supabase'

export async function loginSuperAdmin({ email, password }) {
  const { data, error } =
    await supabase.auth.signInWithPassword({
      email: email.trim(),
      password
    })

  if (error) {
    throw new Error('Email atau password tidak valid.')
  }

  const { data: admin, error: adminError } =
    await supabase
      .from('admins')
      .select('id, nama_lengkap, email, role, status')
      .eq('id', data.user.id)
      .single()

  if (
    adminError ||
    !admin ||
    admin.role !== 'super_admin' ||
    admin.status !== 'aktif'
  ) {
    await supabase.auth.signOut()
    throw new Error('Akun tidak memiliki akses Super Admin.')
  }

  return admin
}

export async function getCurrentSuperAdmin() {
  const { data: { user }, error } =
    await supabase.auth.getUser()

  if (error || !user) return null

  const { data: admin, error: adminError } =
    await supabase
      .from('admins')
      .select('id, nama_lengkap, email, role, status')
      .eq('id', user.id)
      .single()

  if (adminError || admin?.role !== 'super_admin'
      || admin?.status !== 'aktif') {
    return null
  }

  return admin
}

export async function logoutSuperAdmin() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}
