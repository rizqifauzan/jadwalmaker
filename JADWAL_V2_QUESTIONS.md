# Pertanyaan Klarifikasi - Jadwal V2

1. Route `Jadwal V2`:
- `/jadwal-v2` (halaman baru), benar?
Benar

2. `Jadwal` lama tetap utuh tanpa perubahan, benar?
Benar

3. Panel kiri:
- Tab kelas = semua kelas dari master kelas, benar? Benar
- Saat pilih tab kelas, tampil list card berdasarkan `penugasan` kelas itu, benar? Benar

4. Indicator `1x/2x/3x`:
- Itu artinya sisa jam yang belum terjadwal per assignment, benar? Benar
- Format tampil: contoh `3x` di pojok kanan atas card? benar

5. Panel kanan kalender:
- Header kolom = kelas (semua kelas sekaligus), benar? Benar
- Row = kombinasi `hari + jam pelajaran` (slot), benar? Benar
- Jadi 1 baris per slot (mis. Senin Jam 1), dan tiap kolom kelas punya cell? Benar

6. Drag-drop:
- User drag card dari kiri lalu drop ke cell kelas tertentu di kanan.
- Kalau card dari kelas A tapi di-drop ke kolom kelas B, ini:
  - boleh (otomatis ikut kelas kolom drop), atau
  - harus ditolak? ditolak dan muncukan error,

7. Rule validasi saat drop:
- tetap pakai semua hard constraints yang sekarang (`conflict guru`, `conflict kelas`, `slot libur`, `max jam guru`)?
- kalau invalid, drop dibatalkan + tampil pesan, benar?
benar

8. Pengurangan indikator:
- Saat 1 slot berhasil di-drop, sisa `x` berkurang 1.
- Jika user hapus slot di kanan, sisa `x` naik lagi 1, benar? Benar

9. Hapus slot di panel kanan:
- pakai ikon delete di dalam cell, benar?
- perlu konfirmasi sebelum hapus atau langsung hapus?
icon delete di cell, dan pelu konfirmasi hapus

10. Jika sisa jam assignment sudah 0:
- card tetap tampil (disabled) atau disembunyikan? disembunyikan

11. Mode edit:
- boleh lebih dari 1 entri mapel yang sama di hari berbeda selama tidak melanggar rule, benar?
Benar

12. Simpan data:
- auto-save ke localStorage setiap drop/hapus (tanpa tombol simpan), setuju? Setuju

13. Sinkronisasi dengan `Jadwal V1`:
- data `schedule_entries` dipakai bersama (V1 dan V2 lihat data yang sama), atau
- `Jadwal V2` punya data terpisah? data sama

14. Di panel kanan perlu filter hari aktif saja?
- tampil semua Senin-Minggu, atau hanya hari yang `active`?
Tidak perlu

15. Di mobile:
- cukup fallback non-drag (tap pilih card lalu tap cell) atau tetap wajib drag-drop?
sementara tidak berlaku di mobile
