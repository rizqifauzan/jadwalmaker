# Pertanyaan Klarifikasi - Penugasan V2

1. Route `Penugasan V2` maunya di mana?
- opsi A: `/penugasan-v2`
- opsi B: tetap `/penugasan` tapi ada tab `V1 | V2`
Pakai Opsi A

2. UI lama tetap utuh berarti tidak diubah sama sekali, hanya tambah halaman baru, benar?
ya

3. Default 5 record kosong:
- berlaku setiap kali user pilih kelas? Ya

4. Tombol `+`:
- menambah 1 baris kosong baru di bawah list, benar?
Benar

5. Dalam 1 baris record:
- `guru` dropdown ambil dari master guru
- `mapel` input text bebas
- `jumlah jam` input number
Semua ini sudah benar?
Benar

6. Validasi saat simpan:
- `guru`, `mapel`, `jumlah jam > 0` wajib? Ya
- baris kosong boleh di-skip (tidak disimpan)? Ya

7. Rule duplikat:
- tetap sama seperti V1: dalam 1 kelas, `mapel` tidak boleh lebih dari 1 guru?
Ya

8. Tombol aksi:
- mau `Simpan Semua` (bulk save) saja? 
- atau per baris tetap bisa simpan?
per baris tetap bisa simpan

9. Saat kelas diganti:
- data draft baris yang belum disimpan di kelas sebelumnya mau tetap tersimpan sementara atau di-reset? munculkan peringatan, kalau setuju reset data yang belum tersimpan

10. Setelah simpan berhasil:
- list langsung reload dari data penugasan existing kelas itu (gabung old + new), benar?
Benar
