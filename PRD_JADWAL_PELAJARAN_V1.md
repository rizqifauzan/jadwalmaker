# PRD - Sistem Penyusunan Jadwal Pelajaran V1

## 1. Informasi Dokumen
- Nama Produk: Sistem Penyusunan Jadwal Pelajaran
- Versi PRD: 1.0
- Tanggal: 2026-03-01
- Status: Final untuk implementasi V1
- Platform: Web (Next.js, deploy di Vercel)

## 2. Ringkasan Produk
Aplikasi web untuk menyusun jadwal pelajaran secara manual dengan validasi konflik otomatis. Tujuan utama adalah menggantikan proses manual yang rawan bentrok, khususnya konflik guru mengajar di dua kelas pada waktu yang sama.

## 3. Latar Belakang Masalah
- Penyusunan jadwal saat ini manual dan memakan waktu.
- Konflik sering tidak terdeteksi sejak awal.
- Preferensi guru sering muncul dalam bentuk catatan bebas dan sulit dilacak.

## 4. Tujuan Produk
1. Mempercepat proses penyusunan jadwal.
2. Mencegah konflik jadwal utama (guru dan kelas).
3. Memberikan pengalaman penyusunan jadwal yang jelas (weekly view).
4. Menyediakan draft meskipun masih ada error agar pekerjaan tidak hilang.

## 5. Non-Goals V1
- Auto-generator jadwal.
- Sinkronisasi lintas device secara otomatis.
- Sistem autentikasi/login.
- Optimisasi preferensi guru sebagai constraint formal.

## 6. Keputusan Produk yang Sudah Terkunci
- Penyusunan jadwal dilakukan manual.
- Tanpa login/register, pengguna langsung memakai aplikasi saat membuka web.
- Data disimpan di `localStorage`.
- Framework frontend: `Next.js`.
- Theme UI: gaya Google Calendar (weekly calendar-first UI).
- Relasi guru-mapel tidak disimpan di tabel guru.
- Preferensi guru dicatat di field catatan (free text), belum menjadi rule formal.

## 7. Persona
- Operator jadwal sekolah.
- Kebutuhan utama: input data master, susun jadwal cepat, cek konflik, cetak hasil.

## 8. User Flow Utama
1. Pengguna membuka aplikasi web.
2. Pengguna membuat daftar guru.
3. Pengguna membuat jam pelajaran (`id`, `nama`, `jam_mulai`, `jam_selesai`).
4. Pengguna mengatur hari belajar (`Senin-Minggu`, configurable) dan slot libur (hari + jam tertentu).
5. Pengguna membuat kelas.
6. Pengguna mengisi penugasan per kelas: mapel, guru, jumlah jam per minggu.
7. Pengguna menyusun jadwal manual di weekly calendar.
8. Sistem menampilkan konflik/warning realtime.
9. Pengguna menyimpan sebagai draft/final.
10. Pengguna melihat output per kelas/per guru dan print PDF.

## 9. Kebutuhan Fungsional

### 9.1 Manajemen Guru
- Tambah, ubah, hapus guru.
- Field:
  - `id` (auto)
  - `nama` (wajib)
  - `max_jam_per_minggu` (opsional, integer positif)
  - `catatan` (opsional, teks bebas)

### 9.2 Manajemen Jam Pelajaran
- Tambah, ubah, hapus jam pelajaran.
- Field:
  - `id`
  - `nama`
  - `jam_mulai`
  - `jam_selesai`
- Validasi:
  - `jam_mulai < jam_selesai`
  - Tidak boleh duplikat `id`

### 9.3 Manajemen Hari Belajar dan Slot Libur
- Konfigurasi hari aktif dari Senin sampai Minggu.
- Menandai slot libur di kombinasi hari + jam pelajaran.
- Slot libur tidak boleh dipakai saat penyusunan jadwal.

### 9.4 Manajemen Kelas
- Tambah, ubah, hapus kelas.
- Field minimum:
  - `id`
  - `nama_kelas` (wajib)

### 9.5 Penugasan Guru-Mapel per Kelas
- Tambah, ubah, hapus penugasan pada tiap kelas.
- Field minimum:
  - `id`
  - `kelas_id`
  - `mapel_nama`
  - `guru_id`
  - `jumlah_jam_per_minggu`
- Aturan:
  - Satu mapel dalam satu kelas hanya boleh satu guru.
  - `jumlah_jam_per_minggu` wajib > 0.

### 9.6 Penyusunan Jadwal Manual (Weekly Calendar)
- Tampilan mingguan mirip Google Calendar.
- Menyusun slot per kelas secara manual.
- Operasi minimal:
  - Tambah entri slot.
  - Edit entri slot.
  - Hapus entri slot.
- Field entri jadwal minimum:
  - `id`
  - `kelas_id`
  - `hari`
  - `jam_pelajaran_id`
  - `mapel_nama`
  - `guru_id`

### 9.7 Validasi Konflik
- Validasi realtime saat create/update entri.
- Jenis validasi:
  - Konflik guru: guru sama di dua kelas pada hari+jam yang sama.
  - Konflik kelas: kelas sama berisi lebih dari satu mapel pada hari+jam yang sama.
  - Slot libur terisi.
  - Melebihi `max_jam_per_minggu` guru (jika diisi).
  - Ketidaksesuaian jumlah jam mapel per kelas terhadap target mingguan.

### 9.8 Draft dan Status Error
- Jadwal tetap bisa disimpan sebagai `draft` walau ada error.
- Sistem menampilkan daftar error yang belum terselesaikan.
- Status minimal:
  - `draft_ok` (draft tanpa hard error)
  - `draft_error` (draft dengan hard error)
  - `final` (opsional untuk menandai jadwal siap cetak)

### 9.9 Tampilan Output
- View jadwal per kelas.
- View jadwal per guru.
- Print PDF untuk jadwal per kelas/per guru.

### 9.10 Backup/Restore
- Export data JSON.
- Import data JSON.
- Validasi struktur dasar saat import.

## 10. Aturan Bisnis
1. Guru tidak boleh mengajar di dua kelas pada slot waktu yang sama.
2. Kelas tidak boleh memiliki dua pelajaran dalam slot waktu yang sama.
3. Slot libur tidak boleh diisi.
4. Jika `max_jam_per_minggu` terisi, total jam guru tidak boleh melewati batas.
5. Penugasan mapel per kelas menggunakan target jam mingguan.
6. Dalam satu kelas, satu mapel hanya punya satu guru pengampu.
7. Preferensi guru di `catatan` bersifat referensi manual (belum divalidasi otomatis).

## 11. Kebutuhan Non-Fungsional
- Aplikasi responsif untuk desktop dan mobile.
- Tampilan mengikuti visual direction Google Calendar (clean, calendar-centric, fokus grid mingguan).
- Performa target:
  - Navigasi dan aksi CRUD < 300ms pada data ukuran sekolah kecil-menengah.
- Data persistence:
  - Semua data tersimpan di browser via `localStorage`.
- Keamanan minimal v1:
  - Password lokal disimpan dalam bentuk hash (bukan plain text).
- Reliabilitas:
  - Perubahan data tidak hilang saat refresh browser.

## 12. Batasan Teknis V1
- Tanpa backend/database server.
- Data tidak otomatis tersinkron antar device/browser.
- Jika cache/browser dibersihkan, data hilang kecuali sudah export.

## 13. Struktur Data Konseptual (High-Level)
- `teachers`
- `classrooms`
- `subjects_assignment`
- `time_slots`
- `active_days`
- `blocked_slots`
- `schedule_entries`
- `schedule_meta`

## 14. Struktur Penyimpanan LocalStorage (Rekomendasi Key)
- `jadwal_app.teachers`
- `jadwal_app.classrooms`
- `jadwal_app.time_slots`
- `jadwal_app.active_days`
- `jadwal_app.blocked_slots`
- `jadwal_app.assignments`
- `jadwal_app.schedule_entries`
- `jadwal_app.schedule_meta`
- `jadwal_app.version`

## 15. Validasi dan Error Message (Ringkas)
- Konflik guru:
  - "Guru [nama] sudah mengajar di kelas lain pada slot ini."
- Konflik kelas:
  - "Kelas [nama] sudah memiliki jadwal pada slot ini."
- Slot libur:
  - "Slot ini ditandai libur/tidak aktif."
- Max jam guru:
  - "Total jam [nama guru] melebihi batas mingguan ([x] jam)."
- Jam mapel belum terpenuhi:
  - "Alokasi jam mapel [mapel] di kelas [kelas] belum sesuai target mingguan."

## 16. Acceptance Criteria V1
1. Pengguna bisa langsung memakai aplikasi tanpa login/register.
2. Pengguna bisa CRUD guru, kelas, jam pelajaran, dan penugasan mapel-guru per kelas.
3. Pengguna bisa set hari aktif dan slot libur.
4. Pengguna bisa menyusun jadwal manual di weekly view.
5. Sistem mendeteksi konflik guru/kelas/slot libur secara realtime.
6. Sistem mendeteksi pelanggaran `max_jam_per_minggu`.
7. Jadwal tetap bisa disimpan sebagai draft walau ada error.
8. Tersedia tampilan jadwal per kelas dan per guru.
9. Jadwal dapat dicetak ke PDF.
10. Data tetap ada setelah refresh dan bisa di-export/import JSON.

## 17. Risiko dan Mitigasi
- Risiko: data hilang saat browser storage dibersihkan.
  - Mitigasi: wajibkan export backup berkala.
- Risiko: dataset besar membuat UI berat.
  - Mitigasi: gunakan rendering tersegmentasi dan memoization di implementasi.

## 18. Roadmap Setelah V1 (Opsional)
- V1.1: preferensi guru jadi rule terstruktur.
- V1.2: soft suggestion untuk slot kosong.
- V2: backend + auth lintas device + sinkronisasi cloud.
