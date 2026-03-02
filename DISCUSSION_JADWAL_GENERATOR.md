# Diskusi Awal: Sistem Penyusunan Jadwal Pelajaran

## 1) Tujuan Utama
- Mempercepat pembuatan jadwal dibanding cara manual.
- Mengurangi konflik jadwal, terutama kasus guru yang terjadwal di 2 kelas pada jam yang sama.
- Mengakomodasi request guru (contoh: tidak mau hari Senin, tidak mau jam pertama) dengan aturan yang jelas.
- Fokus v1: penyusunan jadwal manual yang terstruktur, bukan auto-generate.

## 2) Masalah yang Ingin Diselesaikan
- Penjadwalan manual memakan waktu dan rawan human error.
- Konflik sering baru ketahuan belakangan.
- Request guru sering bersifat personal dan berubah-ubah.

## 3) Prinsip Solusi
- Sistem harus memisahkan antara:
  - Aturan wajib (hard constraints): tidak boleh dilanggar.
  - Preferensi (soft constraints): sebaiknya diikuti, tapi bisa dioverride dengan konfirmasi.
- Sistem harus transparan: tampilkan alasan jika ada konflik atau pelanggaran preferensi.

## 4) Hard Constraints (Wajib)
- Satu guru tidak boleh mengajar lebih dari 1 kelas di slot waktu yang sama.
- Satu kelas tidak boleh punya lebih dari 1 mapel pada slot waktu yang sama.
- Jam pelajaran per mapel per kelas harus sesuai alokasi mingguan.
- Slot waktu yang ditandai libur/tidak aktif tidak boleh terisi.
- Jika `max_jam_per_minggu` guru diisi, total jam mengajar guru tidak boleh melebihi batas tersebut.

## 5) Soft Constraints (Preferensi)
Contoh request guru:
- "Tidak mau hari Senin"
- "Tidak mau jam pertama"
- "Maksimal 2 jam berturut-turut"
- "Lebih prefer hari tertentu"

Catatan:
- Preferensi ditandai sebagai warning saat user menyusun jadwal.
- User bisa tetap simpan jika perlu, dengan catatan pelanggaran preferensi tercatat.
- Hard constraint tetap tidak boleh disimpan bila melanggar (untuk v1 disarankan blok total).

## 6) Usulan Alur Penggunaan
1. Input data master: kelas, guru, mapel, jumlah jam/minggu, slot waktu.
2. Input aturan wajib dan preferensi guru.
3. User menyusun jadwal per kelas/per hari/per jam secara manual (grid editor).
4. Sistem validasi realtime saat pilih guru/mapel/slot:
   - Blok jika hard constraint dilanggar.
   - Warning jika soft constraint dilanggar.
5. User simpan versi jadwal.
6. User bisa edit manual kapan saja.

## 7) Fitur Inti V1 (Tanpa Generator)
- Grid jadwal mingguan per kelas.
- Form cepat isi slot (kelas, hari, jam, mapel, guru).
- Validasi konflik guru dan kelas secara realtime.
- Validasi `max_jam_per_minggu` guru.
- Panel warning preferensi guru.
- Ringkasan konflik/warning sebelum simpan.
- Export/import JSON.

## 8) Penyimpanan Data
- Data disimpan lokal di browser (localStorage) untuk versi awal.
- Perlu fitur:
  - Export JSON (backup)
  - Import JSON (restore/pindah device)

## 9) Deploy
- Frontend-only deploy ke Vercel (static hosting).
- Karena data di browser, setiap device menyimpan data sendiri.

## 10) Keputusan Produk untuk V1
- Fokus utama: anti konflik guru dan kelas.
- Preferensi guru didukung sebagai warning + override terkontrol.
- Perlu login/register dengan role tunggal `admin`.
- Belum perlu auto-generator jadwal.

## 11) Pertanyaan untuk Kamu Jawab
1. `Login/Register`: tiap akun mewakili 1 sekolah, atau 1 akun bisa punya banyak sekolah?
1 akun 1 sekolah

2. Perlu role user? (`admin` saja dulu, atau ada `operator`/`viewer`)
hanya admin 

3. Di data guru, field wajib apa saja selain `nama` dan `max_jam_per_minggu`?
tidak ada

4. Jam pelajaran: 1 set jam dipakai semua kelas, atau tiap kelas bisa beda set jam?
1 set jam dipakai di semua kelas

5. Rentang hari belajar final apa: `Senin-Sabtu` atau `Senin-Minggu`?
Senin sampai minggu ( ini configurable )

6. Perlu tandai hari/libur khusus? (mis. Jumat lebih pendek, Sabtu nonaktif)
Libur di level Hari jam pelajaran ( jam pelajaran tertentu, di hari tertentu ) 

7. Data kelas cukup `nama kelas` (7A, 7B), atau perlu `tingkat/jurusan` juga?
Cukup string nama kelas

8. Satu mapel dalam satu kelas boleh diampu lebih dari satu guru?
Tidak 

9. Jumlah jam mapel pada step 6 dihitung per minggu, benar?
benar

10. Boleh ada 2-3 jam mapel berturut-turut pada hari yang sama?
Boleh

11. Step 7 (buat jadwal) mau:
   - manual penuh (pilih slot satu per satu), atau
   - semi-manual (sistem kasih saran slot)?
kita mulai dari manual dulu
UI sepert google calendar ( weekly )

12. Jika konflik guru terjadi saat isi slot, mau:
   - langsung diblok (tidak bisa simpan), atau
   - boleh simpan sebagai draft dengan status error?
Boleh save draft dengan status error

13. Preferensi guru (contoh: tidak mau Senin, tidak mau jam 1) disimpan:
   - di profil guru, atau
   - saat proses penyusunan jadwal?
Saat ini tulis di note guru ( di table guru ada table catatan )
  
14. Perlu fitur kunci slot? (mis. upacara Senin jam 1, mapel wajib di slot tertentu)
Tidak

15. Output akhir yang wajib apa saja:
   - tampilan per kelas,
   - tampilan per guru,
   - print PDF

## 12) Catatan Struktur Data Guru
- Field minimum:
  - `id`
  - `nama`
  - `max_jam_per_minggu` (opsional, integer positif)
- Aturan:
  - Nilai kosong/null = tidak dibatasi.
  - Nilai terisi = sistem wajib memastikan total alokasi jam guru <= nilai tersebut.
  - Relasi guru ke mapel tidak disimpan di tabel guru; ditentukan dari data jadwal/penugasan.

## 13) Next Step Diskusi
Setelah kamu jawab pertanyaan di atas, kita bisa kunci:
- model data final,
- format aturan preferensi,
- dan rancangan sistem penyusunan jadwal v1 yang siap diimplementasikan.

## 14) Spesifikasi Final V1 (Terkunci dari Jawaban)
### A. Scope Produk
- Sistem penyusunan jadwal manual (bukan auto-generator).
- UI utama model weekly calendar (mirip Google Calendar) untuk penyusunan slot per kelas.

### B. Akun dan Akses
- Login/Register ada.
- 1 akun = 1 sekolah.
- Role hanya `admin`.

### C. Master Data
- Guru:
  - `id`
  - `nama`
  - `max_jam_per_minggu` (opsional)
  - `catatan` (note guru untuk preferensi/request)
- Jam Pelajaran:
  - `id`
  - `nama`
  - `jam_mulai`
  - `jam_selesai`
- Hari Belajar:
  - Configurable `Senin-Minggu`.
  - Libur/disable bisa di level slot (hari + jam pelajaran tertentu).
- Kelas:
  - `id`
  - `nama_kelas` (string, contoh: 7A)
- Penugasan Guru-Mapel per Kelas:
  - Per kelas, tentukan mapel, guru pengampu, dan `jumlah_jam_per_minggu`.
  - 1 mapel per kelas hanya boleh 1 guru.

### D. Aturan Validasi
- Hard constraints:
  - Guru tidak boleh mengajar di dua kelas pada slot yang sama.
  - Kelas tidak boleh punya dua mapel di slot yang sama.
  - Total jam mapel per kelas harus sesuai `jumlah_jam_per_minggu`.
  - Slot yang ditandai libur tidak boleh diisi.
  - Jika `max_jam_per_minggu` guru terisi, total jam guru tidak boleh melebihi batas.
- Soft constraints:
  - Preferensi guru tidak dijadikan rule terstruktur dulu.
  - Preferensi disimpan di `catatan` guru dan ditinjau manual.

### E. Proses Penyusunan Jadwal
1. Admin login/register.
2. Input data guru.
3. Input jam pelajaran.
4. Setting hari belajar + slot libur.
5. Input kelas.
6. Input penugasan guru-mapel per kelas + jumlah jam per minggu.
7. Susun jadwal secara manual di tampilan weekly.

### F. Perilaku Saat Konflik
- Konflik tidak memblokir penyimpanan draft.
- Jadwal boleh disimpan sebagai draft dengan status error.
- Sistem harus menampilkan daftar error/konflik secara jelas.

### G. Output Wajib
- Tampilan jadwal per kelas.
- Tampilan jadwal per guru.
- Fitur print PDF.

## 15) Keputusan Teknis Final
- Arsitektur v1: `localStorage only` (tanpa backend/database).
- Login/Register v1 bersifat lokal pada browser/device yang sama.
- Untuk pindah/perbarui data antar device, gunakan export/import JSON.
