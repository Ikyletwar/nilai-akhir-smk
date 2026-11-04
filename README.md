# Kalkulator Nilai Akhir SMK

Single-page web app untuk menghitung nilai akhir mata pelajaran SMK secara berbobot — tanpa framework, tanpa build step, tanpa dependency.

## Fitur

- Tabel mata pelajaran: **nama, Tugas, UTS, UAS, Praktik** + bobot masing-masing (default 20/25/35/20).
- Validasi total bobot per baris = **100%** (baris invalid ditandai merah, nilai akhir tidak dihitung).
- Nilai akhir (0–100) + **predikat**: A ≥ 86 · B ≥ 71 · C ≥ 56 · D ≥ 41 · E < 41.
- **KKM default 75**, bisa diubah. Status per baris: Lulus / Remedial.
- **Rata-rata** seluruh mata pelajaran di footer tabel.
- Tambah/hapus baris, hitung otomatis saat mengetik (on-input).
- **Export CSV** via Blob (delimiter `;`, UTF-8 BOM agar rapi di Excel).
- **Persist** otomatis ke `localStorage` (data tidak hilang saat reload).
- **Reset** ke contoh awal.
- UI Bahasa Indonesia, **mobile-first**: di layar <860px tabel berubah jadi kartu per mapel, aksi utama (Tambah/CSV/Reset) nempel di action bar bawah, target sentuh >=48px, input 16px (anti zoom iOS). Bobot disembunyikan by default (tombol "Atur bobot"). Ringkasan besar: rata-rata + predikat + status di hero atas. **Dark mode** toggle.

## Pakai

Buka `index.html` langsung di browser, atau serve statis:

```bash
python3 -m http.server 8080
# buka http://localhost:8080
```

## Struktur

```
index.html   # markup
style.css    # styling + tema terang/gelap (CSS variables)
app.js       # logika: hitung, render, persist, export CSV
```

## Logika perhitungan

```
nilaiAkhir = Σ(nilai_i × bobot_i) / Σ(bobot_i yang terisi)
```

Total bobot wajib 100%. Jika ada komponen nilai kosong, perhitungan dinormalisasi dari bobot yang terisi.

## Lisensi

MIT — lihat [LICENSE](LICENSE).
