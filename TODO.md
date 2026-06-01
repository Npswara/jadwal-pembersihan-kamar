## TODO - Disable tombol membersihkan kamar sampai tanggal 1 (selesai)

- [x] Analisis: tentukan kondisi tombol perlu di-disable berdasarkan countdown (fase waiting cycleStartedAt).
- [x] Update Dashboard.jsx: tambahkan flag `canSubmitCleaning` yang hanya true setelah `cycleStartedAt` tiba (tidak dalam fase waiting).
- [x] Update tombol "Saya Sudah Selesai Membersihkan Kamar": gunakan `disabled={!allTasksDone || isWaitingForCycleStart}`.
- [ ] Pastikan kondisi untuk kasus `hasPending` dan `!isHolder` tetap berjalan.
- [ ] (Opsional) Tambahkan teks helper jika tombol disable karena menunggu tanggal 1.
- [x] Jalankan build/lint/test untuk verifikasi.

