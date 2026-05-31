# Jadwal Pembersihan Kamar Bersama

Aplikasi web responsif untuk mengatur jadwal pembersihan kamar estafet (30 hari) antara Kakak dan Adik.

## Fitur

- Login terpisah (Kakak & Adik) dengan kata sandi
- Timer countdown 30 hari sejak konfirmasi
- Denda otomatis Rp 5.000/hari jika terlambat
- Bukti foto real-time (kamera) + konfirmasi saudara
- Riwayat aktivitas & dana kas kebersihan
- Kakak dapat menghapus riwayat log

## Menjalankan

```bash
cd jadwal-pembersihan-kamar
npm install
npm run dev
```

Buka URL yang ditampilkan (biasanya `http://localhost:5173`).

## Alur Penggunaan

1. **Pengaturan awal** — Atur kata sandi Kakak (min. 8 karakter, huruf besar/kecil, angka) dan Adik (min. 4 karakter).
2. **Login** — Pilih akun dan masuk.
3. **Pemegang giliran** — Tekan tombol selesai → ambil foto kamera → kirim ke saudara.
4. **Saudara** — Review foto → konfirmasi → giliran berpindah, timer 30 hari direset, foto dihapus.
5. **Riwayat & Kas** — Lihat log dan total denda terkumpul.

## Catatan

- Data disimpan di `localStorage` (demo lokal).
- Sesi login di `sessionStorage` (hilang saat tab ditutup).
- Foto hanya dari kamera perangkat (`getUserMedia`), bukan galeri.
- Untuk pengujian kamera di desktop, izinkan akses kamera di browser.

## Build Produksi

```bash
npm run build
npm run preview
```
