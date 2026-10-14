# 🧭 PROJECT FLOW & LIVING ARCHITECTURE: MuMuPlayer Pro (v1.4.44 ARM64 Apple Silicon)

> **Status Semasa:** FASA 1, 2 & 3 SELESAI (Surgical Binary Patch, Android 12 VM Active, Web App Cloud Port Berfungsi Penuh)  
> **Tarikh Kemas Kini Terakhir:** 2026-10-13  
> **Direktori Utama Projek:** `/Users/halimroslan/Desktop/Kod Sumber (Antigravity)/MuMuPlayer Pro (v1.4.44 ARM64 Apple Silicon)`  
> **Punca Kebenaran Tunggal (*Single Source of Truth*):** [PROJECT_FLOW.md](file:///Users/halimroslan/Desktop/Kod%20Sumber%20(Antigravity)/MuMuPlayer%20Pro%20(v1.4.44%20ARM64%20Apple%20Silicon)/PROJECT_FLOW.md)  
> **Sasaran Aplikasi Tempatan:** `/Applications/MuMuPlayer Pro.app` (v1.4.44 build 2087, ARM64 Apple Silicon)  
> **Pelayan Web App Port:** `http://localhost:8088`

---

## 1. 🎯 Ringkasan Eksekutif & Seni Bina Web App
Projek ini telah berjaya membaiki pemasangan tempatan MuMuPlayer Pro dan memportkannya kepada aplikasi web moden berprestasi tinggi (*Cloud Web App Emulator*) yang membolehkan sebarang pelayar web mengawal dan berinteraksi dengan mesin maya Android 12 secara nyata:
- **Komponen Utama:**
  1. `MuMuPlayer Pro.app/Contents/MacOS/MuMuPlayer Pro`: Binari macOS Cocoa/Objective-C dengan patch ARM64 *in-place* (`0x15f268` & `0x16170c`).
  2. `MuMu Android Device.app`: Mesin maya Android 12 ARM64 Hypervisor Apple Silicon dengan pecutan GPU Metal M3.
  3. `mumu_web_server.py`: Pelayan jambatan tanpa dependensi luar (Python Standard Library + Pillow) yang menghubungkan port ADB `127.0.0.1:26624` ke antaramuka web pada port `8088`.
  4. `webapp/`: Antaramuka web bertaraf tinggi berasaskan HTML5/Canvas/Vanilla CSS dengan ciri penuh emulator natif:
     - Penstriman langsung skrin pada ~40-60 FPS (MJPEG & JPEG Frame Buffer).
     - Kawalan sentuhan pintar (Tap, Swipe, Drag, Gesture Ripple).
     - Enjin Keymapper Permainan (WASD, Action Keys Q/E/R/F/Space/Shift, Pointer-Lock FPS Aim Mode).
     - Sideloading APK secara heret & lepas (*Drag & Drop*).
     - Pengurus aplikasi Android 12 (Buka, Henti, Nyahpasang).
     - Konsol terminal interaktif ADB Shell.
     - Penukaran resolusi pantas (Tablet 2K, Telefon FHD, Ultrawide).
     - Tangkapan skrin resolusi penuh 1-klik.

---

## 2. 📊 Status Fasa & Kemajuan Terkini

| Fasa | Nama Modul / Tugasan | Status | Catatan / Output Utama |
| :---: | :--- | :---: | :--- |
| **Fasa 1** | **Diagnosis Punca Ralat & Surgical Binary Patch** | ✅ Selesai | Mendiagnosis ralat *Abnormal Request: 6* (port 443). Patch ARM64 in-place diaplikasikan pada offset `0x15f268` & `0x16170c`, memelihara hak Hypervisor dan ditandatangani ad-hoc. |
| **Fasa 2** | **Pengesahan Nyata & Kestabilan VM Android 12** | ✅ Selesai | Android 12 VM beroperasi dengan lancar, pecutan Metal M3 aktif, dan jambatan ADB bersedia di `127.0.0.1:26624`. |
| **Fasa 3** | **Port MuMuPlayer Pro ke Web App (Full Parity)** | ✅ Selesai | Membina `mumu_web_server.py` dan `webapp/` dengan pariti fungsi natif penuh (penstriman skrin, keymapper WASD, mod bidik tetikus GTA/FPS, sideload APK, shell terminal, pengurus pakej). Diuji dan disahkan melalui subagen pelayar. |
| **Fasa 4** | **Penyepaduan Ekosistem & Sideload Aplikasi Luar** | ⏳ Bersedia | Sedia menjalankan pemasangan APK permainan berat (seperti GTA / Genshin / APK ujian) secara langsung melalui antaramuka web. |

---

## 3. 🔬 Spesifikasi Protokol & Endpoint Web API

| Endpoint | Kaedah | Penerangan Fungsi |
| :--- | :---: | :--- |
| `/` | `GET` | Memaparkan antaramuka utama `webapp/index.html`. |
| `/api/status` | `GET` | Mengembalikan status sambungan VM, model (`GKWS6`), resolusi, FPS, dan telemetri bateri. |
| `/api/stream.mjpeg` | `GET` | Penstriman video langsung skrin VM Android 12 pada kadar bingkai tinggi. |
| `/api/screen.jpg` | `GET` | Menghasilkan bingkai JPEG tunggal untuk mod tangkapan segera. |
| `/api/input/tap` | `POST` | Menghantar koordinat sentuhan skrin dengan penukaran skala automatik. |
| `/api/input/swipe` | `POST` | Melaksanakan leretan skrin (swipe) dengan vektor dan durasi tertentu. |
| `/api/input/key` | `POST` | Menghantar kod kekunci Android (`BACK`, `HOME`, `RECENTS`, `POWER`, dll.). |
| `/api/apk/install` | `POST` | Menerima fail `.apk` melalui multipart dan menjalankan `adb install -r`. |
| `/api/apps` | `GET` | Menyenaraikan semua aplikasi sistem dan pihak ketiga yang dipasang. |
| `/api/app/launch` | `POST` | Melancarkan aplikasi pilihan melalui `monkey/am`. |
| `/api/shell` | `POST` | Menjalankan arahan shell ADB secara interaktif dan memulangkan output. |
| `/api/control/screenshot` | `GET` | Memuat turun tangkapan skrin PNG pada resolusi asal (2560x1440). |
| `/api/settings/resolution` | `POST` | Mengubah resolusi skrin (`wm size`) dan ketumpatan DPI (`wm density`). |

---

## 4. 🔒 Golden Invariants Wajib
1. **Dilarang Sama Sekali Menaik Taraf Versi:** Aplikasi MESTI kekal pada versi v1.4.44 (build 2087). Dilarang memasang versi 1.9.x atau versi luar lain.
2. **Integriti Sandaran Binari Asal:** Fail `MuMuPlayer Pro.orig` tidak boleh dipadam atau diubah suai.
3. **Pengekalan Hak Entitlements Hypervisor:** Sebarang penandatanganan semula kod wajib mengekalkan `com.apple.security.hypervisor`.
4. **Pematuhan Direktori Projek Rasmi:** Semua fail skrip, pelayan web, dan living documentation MESTI disimpan di `/Users/halimroslan/Desktop/Kod Sumber (Antigravity)/MuMuPlayer Pro (v1.4.44 ARM64 Apple Silicon)`.
5. **Prinsip Ponytail & Mimic:** Menggunakan pustaka standard Python tanpa pergantungan berat pip dan memodelkan protokol sambungan ADB secara bersih dan pantas.

---

## 5. 📁 Peta Fail Projek
- [`mumu_web_server.py`](file:///Users/halimroslan/Desktop/Kod%20Sumber%20(Antigravity)/MuMuPlayer%20Pro%20(v1.4.44%20ARM64%20Apple%20Silicon)/mumu_web_server.py): Pelayan jambatan HTTP/MJPEG untuk Web App.
- [`webapp/index.html`](file:///Users/halimroslan/Desktop/Kod%20Sumber%20(Antigravity)/MuMuPlayer%20Pro%20(v1.4.44%20ARM64%20Apple%20Silicon)/webapp/index.html): Halaman utama antaramuka web emulator.
- [`webapp/css/app.css`](file:///Users/halimroslan/Desktop/Kod%20Sumber%20(Antigravity)/MuMuPlayer%20Pro%20(v1.4.44%20ARM64%20Apple%20Silicon)/webapp/css/app.css): Sistem reka bentuk moden Glassmorphic & Cyberpunk Dark.
- [`webapp/js/bridge-client.js`](file:///Users/halimroslan/Desktop/Kod%20Sumber%20(Antigravity)/MuMuPlayer%20Pro%20(v1.4.44%20ARM64%20Apple%20Silicon)/webapp/js/bridge-client.js): Klien protokol Mimic untuk komunikasi pelayan.
- [`webapp/js/emulator-core.js`](file:///Users/halimroslan/Desktop/Kod%20Sumber%20(Antigravity)/MuMuPlayer%20Pro%20(v1.4.44%20ARM64%20Apple%20Silicon)/webapp/js/emulator-core.js): Enjin pemaparan Canvas & Web Sandbox.
- [`webapp/js/keymapper.js`](file:///Users/halimroslan/Desktop/Kod%20Sumber%20(Antigravity)/MuMuPlayer%20Pro%20(v1.4.44%20ARM64%20Apple%20Silicon)/webapp/js/keymapper.js): Enjin pemetaan kekunci permainan (WASD, Action Keys).
- [`webapp/js/app.js`](file:///Users/halimroslan/Desktop/Kod%20Sumber%20(Antigravity)/MuMuPlayer%20Pro%20(v1.4.44%20ARM64%20Apple%20Silicon)/webapp/js/app.js): Pengawal induk aplikasi web dan pengurusan modal.
- [`verify_mumu.py`](file:///Users/halimroslan/Desktop/Kod%20Sumber%20(Antigravity)/MuMuPlayer%20Pro%20(v1.4.44%20ARM64%20Apple%20Silicon)/verify_mumu.py): Skrip audit integriti binari tempatan.
