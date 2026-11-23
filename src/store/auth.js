/**
 * DEVELOPMENT UI DEMO ONLY.
 * Accounts live in browser localStorage and sessions in sessionStorage.
 * Client-side authentication is NOT secure for real Puskesmas records.
 * Replace this module with a server-side identity provider before deployment.
 */
const ACCOUNT_KEY = 'kesambi_demo_superadmin_v1'
const SESSION_KEY = 'kesambi_demo_superadmin_session_v1'

function fromStorage(storage, key) {
  try {
    const value = storage.getItem(key)
    return value ? JSON.parse(value) : null
  } catch {
    return null
  }
}

function toHex(bytes) {
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('')
}

async function derivePasswordHash(password, saltHex) {
  const bytes = new Uint8Array(saltHex.match(/.{2}/g).map(value => parseInt(value, 16)))
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']
  )
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: bytes, iterations: 150000, hash: 'SHA-256' },
    key,
    256
  )
  return toHex(new Uint8Array(bits))
}

export function getRegisteredAdmin() {
  const saved = fromStorage(localStorage, ACCOUNT_KEY)
  return saved && saved.email && saved.salt && saved.passwordHash ? saved : null
}

export function hasRegisteredSuperAdmin() {
  return Boolean(getRegisteredAdmin())
}

export function getSession() {
  const session = fromStorage(sessionStorage, SESSION_KEY)
  const account = getRegisteredAdmin()
  if (session?.role !== 'super_admin' || !account || session.email !== account.email) return null
  return { name: account.name, email: account.email, role: 'super_admin' }
}

export function isAuthenticated() {
  return Boolean(getSession())
}

export async function registerSuperAdmin({ name, email, password }) {
  if (hasRegisteredSuperAdmin()) throw new Error('Akun Super Admin sudah dibuat di browser ini.')
  const cleanName = name.trim()
  const cleanEmail = email.trim().toLowerCase()
  if (cleanName.length < 3) throw new Error('Nama lengkap minimal 3 karakter.')
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) throw new Error('Format email tidak valid.')
  if (password.length < 10 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password)) {
    throw new Error('Kata sandi minimal 10 karakter serta mengandung huruf besar, huruf kecil, dan angka.')
  }
  if (!globalThis.crypto?.subtle) throw new Error('Gunakan localhost atau HTTPS agar fitur demo dapat berjalan.')
  const salt = toHex(crypto.getRandomValues(new Uint8Array(16)))
  const passwordHash = await derivePasswordHash(password, salt)
  localStorage.setItem(ACCOUNT_KEY, JSON.stringify({
    name: cleanName,
    email: cleanEmail,
    salt,
    passwordHash,
    role: 'super_admin',
    createdAt: new Date().toISOString()
  }))
  return { name: cleanName, email: cleanEmail }
}

export async function loginSuperAdmin({ email, password }) {
  const admin = getRegisteredAdmin()
  if (!admin) throw new Error('Belum ada akun. Buat Super Admin terlebih dahulu.')
  const matchedEmail = email.trim().toLowerCase() === admin.email
  const hash = await derivePasswordHash(password, admin.salt)
  if (!matchedEmail || hash !== admin.passwordHash) {
    throw new Error('Email atau kata sandi salah. Silakan periksa kembali.')
  }
  sessionStorage.setItem(SESSION_KEY, JSON.stringify({
    email: admin.email,
    role: 'super_admin',
    loggedInAt: new Date().toISOString()
  }))
  return getSession()
}

export function logoutSuperAdmin() {
  sessionStorage.removeItem(SESSION_KEY)
}

// Used only if you want to reset this browser's demo account during development:
// localStorage.removeItem('kesambi_demo_superadmin_v1')
