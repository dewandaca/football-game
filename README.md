# ⚽ Football AI Games Platform

**Football AI Games** adalah platform web interaktif bertema sepak bola yang ditenagai oleh **AI (Groq API)**. Aplikasi ini menghadirkan dua mode permainan utama yang seru, dramatis, dan sangat cocok dimainkan bersama teman secara lokal maupun 1v1.

---

## 🚀 Fitur & Mode Permainan

### 1. 🎤 Family 100 Sepak Bola (Football Survey Quiz)
Game kuis interaktif berformat Family 100 yang menyajikan pertanyaan-pertanyaan unik seputar dunia sepak bola.
- **AI-Powered Survey Generation**: Pertanyaan dan 5 jawaban teratas dihasilkan secara dinamis menggunakan model **Groq AI** (`openai/gpt-oss-120b`).
- **Interactive Game Board**: Papan skor dengan animasi kartu terbalik (*reveal animation*) saat jawaban benar ditebak.
- **System 3 Strikes**: Peringatan visual dan suara *strike* ketika tebakan salah.
- **Topik Kustom**: Pilihan topik kuis siap pakai atau buat topik sepak bola kustom kamu sendiri.
- **Tombol Reset Game**: Fitur reset instan untuk memulai kuis baru kapan saja.

---

### 2. ⚔️ 1v1 Draft Auction & Simulasi Match OSM (Online Soccer Manager)
Mode duel 1 lawan 1 yang menggabungkan strategi lelang bursa transfer pemain sepak bola asli dengan simulasi pertandingan bergaya **OSM**.

#### 💰 Phase 1: Lelang Bursa Transfer (1v1 Auction Arena)
- **Pilihan Tier Anggaran & Tema Skuad**:
  - ⭐ *Pemain Top Dunia* (Bintang papan atas seperti Mbappe, Haaland, Bellingham).
  - 🔄 *Campuran* (Kombinasi pemain superstar & underrated).
  - 💎 *Underrated & Bakat Nyata* (Pemain profesional asli non-mainstream).
- **Sistem Adu Lelang Real-Time**:
  - Penawaran harga terbuka (*Open Bidding*) yang bisa diisi secara bebas di atas harga tertinggi saat ini.
  - Opsi menyerahkan penawaran (*Pass*) jika harga sudah terlalu mahal.
  - Pengelolaan uang anggaran (*Budget Management*).
  - **Aturan Kebangkrutan**: Pemain yang kehabisan uang sebelum memnuhi skuad 11 pemain otomatis dinyatakan kalah!

#### ⚽ Phase 2: Simulasi Pertandingan Dramatis OSM
- **Rating Skuad Otomatis**: Menghitung rating Serangan (ATT), Lini Tengah (MID), dan Pertahanan (DEF) secara realistis dari 11 pemain hasil lelang.
- **Live Commentary Feed**:
  - Teks komentar jalannya pertandingan yang diperbarui secara real-time.
  - **Auto-Scroll Khusus Container**: Teks komentar otomatis bergulir ke bawah di dalam kotak komentar tanpa menggeser tampilan posisi layar browser utama.
- **Event Random Dinamis (Variatif & Tidak Repetitif)**:
  - 🎥 Wasit Meninjau VAR (Keputusan penalti / gol dianulir).
  - 🨨 / 🟥 Kartu Kuning & Kartu Merah Langsung.
  - ✋ Pelanggaran Handsball & Peluang Tendangan Bebas.
  - 🚩 Offside & Tekel Krusial Pemutus Serangan.
  - 😱 Bola Menghantam Tiang / Mistar Gawang.
  - 🧤 Penyelamatan Akrobatik Kiper.
- **Aturan Tanpa Seri (No Draws)**: Jika skor imbang hingga menit 90', pertandingan berlanjut ke **Babak Adu Penalti (Penalty Shootout)** dengan indikator visual tendangan penalti.
- **Statistik & Man of the Match (MOTM)**: Penguasaan bola, total tembakan, akurasi umpan, dan MOTM terkunci selama pertandingan dan baru dirilis resmi setelah peluit panjang berbunyi!
- **Kontrol Kecepatan Pacing**: Pilih kecepatan simulasi Santai (2.5s), Sedang (1.5s), atau Cepat (0.8s), serta tombol *Langsung Hasil Akhir*.

---

## 🛠️ Teknologi & Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router), [React 19](https://react.dev/)
- **Bahasa**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [TailwindCSS v4](https://tailwindcss.com/), Glassmorphic Dark UI & CSS Custom Animations
- **Animasi & Efek**: [Framer Motion](https://www.framer.com/motion/), [Canvas Confetti](https://www.npmjs.com/package/canvas-confetti)
- **Icons**: [Lucide React](https://lucide.dev/)
- **AI Integrasi**: [Groq SDK](https://groq.com/) (`openai/gpt-oss-120b` & `openai/gpt-oss-20b`)
- **Validasi Schema**: [Zod](https://zod.dev/)

---

## 📦 Instalasi & Pengaturan Lokal

### 1. Prerequisites
Pastikan kamu telah menginstal:
- [Node.js](https://nodejs.org/) v18.0 atau lebih baru.
- npm / yarn / pnpm.

### 2. Clone Repository & Install Dependencies
```bash
git clone <repository-url>
cd football-ai-games
npm install
```

### 3. Konfigurasi Environment Variables
Buat file `.env.local` di direktori utama (root) proyek dan tambahkan API Key dari Groq:

```env
GROQ_API_KEY=your_groq_api_key_here
```

> 💡 *Kamu bisa mendapatkan Groq API Key secara gratis di [console.groq.com](https://console.groq.com/).*

### 4. Jalankan Server Pengembang (Development Server)
```bash
npm run dev
```

Buka browser dan akses [http://localhost:3000](http://localhost:3000).

---

## 📁 Struktur Direktori Utama

```
football-ai-games/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── groq/
│   │   │       ├── generate-survey/   # Endpoint AI kuis Family 100
│   │   │       ├── generate-draft/    # Endpoint AI generasi opsi pemain lelang
│   │   │       └── suggest-topic/     # Endpoint AI saran topik kuis
│   │   ├── game/
│   │   │   ├── family-survey/         # Halaman Game Family 100
│   │   │   └── draft-auction/          # Halaman Game 1v1 Draft & OSM
│   │   ├── layout.tsx
│   │   └── page.tsx                   # Landing Page / Menu Utama
│   ├── components/
│   │   ├── common/                    # Button, Navbar, Header, Footer
│   │   ├── draft/                     # AuctionArena, BudgetSetupModal, OSMMatchSimulation, MiniPitch
│   │   └── family/                    # SurveyBoard, StrikeOverlay, TopicSelector
│   ├── types/                         # Game State & Player Interfaces
│   └── lib/                           # Helper & Groq client initialization
├── .env.local                         # File Kunci API Groq
└── README.md
```

---

## 📝 Lisensi

Aplikasi ini dikembangkan untuk keperluan hiburan, edukasi, dan eksperimen kecerdasan buatan dalam game sepak bola.
