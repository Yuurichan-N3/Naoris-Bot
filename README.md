## 🚀 NAORIS PROTOCOL BOT - Automation

Bot ini mengotomatisasi pemantauan perangkat dan penghasilan di Naoris Protocol. Dengan fitur otomatisasi heartbeat dan monitoring saldo wallet, bot ini membantu meningkatkan efisiensi dan kestabilan sistem.


---

## 📌 Fitur Utama

✅ Automated Heartbeat – Mengirim sinyal otomatis ke server Naoris Protocol.

✅ Proxy Support – Bisa berjalan dengan atau tanpa proxy.

✅ Auto Logging – Menyimpan aktivitas ke terminal & file log.

✅ Wallet Monitoring – Melacak saldo dan aktivitas akun secara real-time.

✅ Keep-Alive – Menjaga koneksi tetap aktif untuk menghindari logout otomatis.


---

## 🚀 Cara Menggunakan

1️⃣ Clone Repository & Install Dependencies

Jalankan perintah berikut untuk mengunduh dan menyiapkan bot:

```
git clone https://github.com/yuurichan-N3/Naoris-Bot.git
cd Naoris-Bot
```

Install semua dependensi yang diperlukan:

```
npm install
```

---

2️⃣ Konfigurasi Akun

Buat file accounts.json di dalam folder bot, lalu isi dengan format berikut:

```
[
  {
    "walletAddress": "0x123456789abcd",
    "token": "eyGdkabd",
    "DeviceHash": "123456"
  }
]
```

(Opsional) Jika menggunakan proxy, buat file proxy.txt dan isi dengan daftar proxy satu per baris.


---

3️⃣ Menjalankan Bot

Jalankan perintah berikut untuk memulai bot:

```
node bot.js
```

---

## 📝 Fitur Tambahan

✅ Cek IP Publik – Memastikan apakah proxy berfungsi dengan benar.

✅ Siklus Otomatis – Bot akan terus berjalan setiap beberapa menit untuk menjaga akun tetap aktif.

✅ Progress Bar – Menampilkan waktu tunggu antara setiap siklus heartbeat.


---

## ⚠ Catatan

⚡ Pastikan token Naoris Protocol valid agar bot dapat berjalan.
⚡ Jika menggunakan proxy, pastikan proxy tersebut aktif dan bekerja dengan baik.
⚡ Gunakan screen atau tmux di Linux jika ingin menjalankan bot dalam waktu lama.


---

## 📜 Lisensi  

Script ini didistribusikan untuk keperluan pembelajaran dan pengujian. Penggunaan di luar tanggung jawab pengembang.  

Untuk update terbaru, bergabunglah di grup **Telegram**: [Klik di sini](https://t.me/sentineldiscus).


---

## 💡 Disclaimer
Penggunaan bot ini sepenuhnya tanggung jawab pengguna. Kami tidak bertanggung jawab atas penyalahgunaan skrip ini.
