# TASK BREAKDOWN V1 - Sistem Penyusunan Jadwal Pelajaran

## 1. Tujuan Dokumen
Dokumen ini memecah PRD menjadi task implementasi yang bisa langsung dikerjakan di Next.js.

## 2. Stack dan Prinsip
- Framework: Next.js (App Router) + TypeScript
- Deploy: Vercel
- Storage: localStorage only
- UI Direction: Google Calendar style (weekly calendar-first)

## 3. Struktur Folder Target
```txt
src/
  app/
    page.tsx
    guru/page.tsx
    jam-pelajaran/page.tsx
    hari-belajar/page.tsx
    kelas/page.tsx
    penugasan/page.tsx
    jadwal/page.tsx
    print/kelas/page.tsx
    print/guru/page.tsx
  components/
    ui/
    calendar/
    forms/
  features/
    teachers/
    timeSlots/
    activeDays/
    classrooms/
    assignments/
    schedules/
  lib/
    storage/
    validation/
    utils/
  types/
    index.ts
```

## 4. Fase Implementasi

## Fase 1 - Project Foundation
### Task
1. Inisialisasi Next.js + TypeScript.
2. Setup layout global dan base styles.
3. Buat design token dasar (warna, spacing, border, typography).
4. Setup navigasi utama antar halaman.

### Deliverable
- Aplikasi jalan lokal.
- Routing dasar semua halaman utama tersedia.

### Done Checklist
- `npm run dev` berjalan tanpa error.
- Semua route utama bisa dibuka.

## Fase 2 - Data Model dan localStorage Engine
### Task
1. Definisikan type/interface semua entitas.
2. Buat helper localStorage per key (`get`, `set`, `remove`, `reset`).
3. Implementasi versioning sederhana untuk data (`jadwal_app.version`).
4. Tambah validator data minimal saat read/write.

### Deliverable
- Modul storage reusable untuk semua fitur.

### Done Checklist
- Data CRUD dasar bisa disimpan dan dibaca ulang setelah refresh.

## Fase 3 - Master Data CRUD
### Task
1. Halaman Guru:
   - CRUD `nama`, `max_jam_per_minggu`, `catatan`.
2. Halaman Jam Pelajaran:
   - CRUD `id`, `nama`, `jam_mulai`, `jam_selesai`.
   - Validasi `jam_mulai < jam_selesai`.
3. Halaman Hari Belajar:
   - Aktif/nonaktif hari Senin-Minggu.
   - Set slot libur berdasarkan hari + jam pelajaran.
4. Halaman Kelas:
   - CRUD `nama_kelas`.
5. Halaman Penugasan:
   - CRUD per kelas: `mapel_nama`, `guru_id`, `jumlah_jam_per_minggu`.
   - Rule: 1 mapel per kelas hanya 1 guru.

### Deliverable
- Semua data master siap dipakai oleh modul jadwal.

### Done Checklist
- CRUD semua master data berjalan.
- Validasi field wajib berjalan.

## Fase 4 - Weekly Calendar dan Entri Jadwal
### Task
1. Implement weekly grid utama di `/jadwal`.
2. Tambah/Edit/Hapus entri jadwal pada slot tertentu.
3. Tambah filter mode tampilan per kelas / per guru.
4. Sinkronkan entri dengan assignment yang sudah dibuat.

### Deliverable
- Halaman jadwal weekly interaktif dan bisa dipakai untuk input penuh.

### Done Checklist
- User bisa menyusun jadwal manual end-to-end.

## Fase 5 - Validation Engine (Realtime)
### Task
1. Validasi konflik guru pada slot sama.
2. Validasi konflik kelas pada slot sama.
3. Validasi slot libur tidak boleh dipakai.
4. Validasi `max_jam_per_minggu` guru.
5. Validasi progres jam mapel per kelas vs target mingguan assignment.
6. Tampilkan panel error/warning yang jelas.

### Deliverable
- Mesin validasi realtime saat user mengubah jadwal.

### Done Checklist
- Error utama muncul dengan pesan yang jelas.
- Draft tetap bisa disimpan meski ada error.

## Fase 6 - Status Jadwal dan Simpan Draft/Final
### Task
1. Tambah status `draft_ok`, `draft_error`, `final`.
2. Hitung status otomatis berdasarkan hasil validasi.
3. Tampilkan ringkasan status di header halaman jadwal.

### Deliverable
- State jadwal terkontrol untuk proses review/cetak.

### Done Checklist
- Status berubah sesuai kondisi validasi.

## Fase 7 - Output dan Portability
### Task
1. Buat view print per kelas.
2. Buat view print per guru.
3. Tambah export JSON.
4. Tambah import JSON + validasi struktur.

### Deliverable
- Data bisa dibackup/restore.
- Jadwal siap dicetak.

### Done Checklist
- File JSON hasil export bisa diimport kembali dengan benar.
- Print layout rapi.

## Fase 8 - QA dan Deploy
### Task
1. Uji manual berdasarkan acceptance criteria PRD.
2. Uji skenario edge case konflik.
3. Perbaiki UX mobile/desktop.
4. Deploy ke Vercel.

### Deliverable
- Versi V1 siap pakai.

### Done Checklist
- Semua acceptance criteria PRD terpenuhi.
- Aplikasi live di Vercel.

## 5. Prioritas Task (Urutan Pengerjaan)
1. Fase 1
2. Fase 2
3. Fase 3
4. Fase 4
5. Fase 5
6. Fase 6
7. Fase 7
8. Fase 8

## 6. Definisi Selesai (Definition of Done)
- Semua fitur inti PRD berjalan.
- Tidak ada blocker pada alur utama penyusunan jadwal.
- Data persisten di localStorage setelah refresh.
- Konflik utama terdeteksi realtime.
- Jadwal bisa dicetak dan data bisa export/import.
- Deploy Vercel sukses.
