# Dashboard Admin Puskesmas Kesambi — Login & Register Super Admin

Prototipe Vue 3 + Vite dengan halaman Login, Register Super Admin pertama, proteksi rute, dashboard dan halaman CRUD. **Semua data dan autentikasi di proyek ini hanya demo, tidak aman untuk data pasien sungguhan.**

## Menjalankan di Mac

```bash
cd /Applications/XAMPP/xamppfiles/htdocs/puskesmas-kesambi-admin
npm install
npm run dev
```

Buka alamat yang dicetak Vite (umumnya http://localhost:5173). Apache XAMPP tidak perlu dinyalakan untuk aplikasi Vue/Vite.

## Alur demo

1. Saat membuka `/`, Anda diarahkan ke `/login` jika belum masuk.
2. Pilih **Buat akun pertama** atau buka `/register` untuk mendaftarkan satu Super Admin.
3. Isi nama, email dan kata sandi minimal 10 karakter, termasuk huruf besar, huruf kecil, dan angka.
4. Akun demo tersimpan di **localStorage** browser dengan PBKDF2 hash (bukan password asli). Setelah sukses, masuk melalui `/login`.
5. Sesi login demo disimpan di **sessionStorage**; menu dashboard baru dapat dibuka setelah login. Tombol **Keluar** ada pada sidebar dan header.
6. Setelah satu akun demo dibuat, halaman `/register` ditutup pada browser tersebut. Ini **hanya pembatasan UI**, bukan kontrol keamanan yang sah.

### Reset akun demo (opsional)

Di DevTools browser > Console pada domain proyek, jalankan:

```js
localStorage.removeItem('kesambi_demo_superadmin_v1')
sessionStorage.removeItem('kesambi_demo_superadmin_session_v1')
location.href = '/register'
```

Hanya dilakukan untuk reset prototipe; jangan memakai email/password nyata saat mencoba.

## Struktur perubahan

- `src/layouts/AuthLayout.vue`: layout dua kolom untuk login dan register.
- `src/views/Login.vue`: form masuk, validasi, pesan error.
- `src/views/Register.vue`: pendaftaran akun Super Admin pertama, indikator syarat kata sandi.
- `src/store/auth.js`: autentikasi lokal **demo saja**.
- `src/assets/auth.css`: desain responsif halaman autentikasi.
- `src/router/index.js`: `/login`, `/register`, dan guard dashboard.
- `src/layouts/MainLayout.vue`: identitas Super Admin dan tombol logout.

## Keamanan sebelum produksi

**Jangan gunakan sistem ini untuk akun sungguhan ataupun data kesehatan pasien.** Autentikasi di sisi browser dapat dilewati dan tidak menjamin otorisasi. Untuk digunakan secara nyata, perlu backend yang menyimpan hash kata sandi di server (mis. Argon2id/bcrypt), sesi aman dalam cookie HttpOnly/Secure/SameSite, verifikasi izin berbasis peran di setiap endpoint, audit log, HTTPS, rate limiting, CSRF protection bila relevan, dan proses provisioning/invitasi Super Admin oleh personel berwenang. Form register publik *tidak boleh* dapat menciptakan Super Admin produksi.

Data pada dashboard adalah simulasi; CRUD disimpan di localStorage browser dan tidak terhubung ke database Puskesmas.
