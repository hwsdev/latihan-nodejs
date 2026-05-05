# latihan-nodejs

Bot Node.js untuk menjaga GitHub contribution graph tetap aktif dengan pola commit yang natural dan tidak mencurigakan.

## Fitur

- Variasi intensitas commit harian (tidak selalu dark green)
- Skip otomatis hari libur nasional Indonesia
- Commit lebih jarang di akhir pekan, seperti developer asli
- Idempotent — tidak double-commit jika dijalankan dua kali di hari yang sama
- Backfill tanggal lampau sekaligus
- Berjalan 24/7 di VPS via PM2

---

## Pola Commit

| Tier | Commit | Probabilitas |
|------|--------|-------------|
| Rest | 0 | 40% |
| Light | 1 | 30% |
| Medium | 2–3 | 20% |
| Dark | 4–6 | 10% |

Akhir pekan: probabilitas non-zero dibagi dua, sisanya masuk ke rest.
Hari libur: selalu 0 commit.

---

## Struktur Proyek

```
latihan-nodejs/
├── src/
│   ├── index.js       # Entry point, CLI args, backfill loop
│   ├── scheduler.js   # Cron job harian
│   ├── committer.js   # Operasi git + idempotency guard
│   ├── holidays.js    # Libur nasional Indonesia 2024–2026
│   └── pattern.js     # Randomizer intensitas commit
├── ecosystem.config.cjs  # Konfigurasi PM2
├── .env.example
├── package.json
└── .gitignore
```

---

## Setup Lokal (Development)

**1. Clone dan install**

```bash
git clone git@github.com:hwsdev/latihan-nodejs.git
cd latihan-nodejs
npm install
```

**2. Buat repo target di GitHub**

Repo target adalah tempat bot melakukan commit. Buat repo baru di GitHub:
`git@github.com:hwsdev/latihan-nodejs.git`

Clone repo target ke lokal:

```bash
git clone git@github.com:hwsdev/latihan-nodejs.git
cd latihan-nodejs
git commit --allow-empty -m "init"
git push
```

**3. Buat file `.env`**

```bash
cp .env.example .env
```

Isi `.env`:

```env
REPO_PATH=/path/ke/latihan-nodejs
GIT_REMOTE=origin
GIT_BRANCH=main
CRON_SCHEDULE=0 9 * * *
GIT_USER_NAME=hwsdev
GIT_USER_EMAIL=your@email.com
```

**4. Test dry-run**

```bash
npm run dry-run
```

**5. Backfill tanggal lampau (opsional)**

Tambahkan ke `.env`:

```env
BACKFILL_START=2025-01-01
BACKFILL_END=2025-04-30
```

Lalu jalankan:

```bash
npm run backfill
```

---

## Deploy ke VPS (24/7)

### 1. Install Node.js & PM2 di VPS

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs git
sudo npm install -g pm2
```

### 2. Clone bot ke VPS

```bash
git clone git@github.com:hwsdev/latihan-nodejs.git
cd latihan-nodejs
npm install
```

### 3. Clone repo target ke VPS

```bash
git clone git@github.com:hwsdev/latihan-nodejs.git ~/latihan-nodejs
```

Pastikan SSH key VPS sudah ditambahkan ke GitHub agar bisa push tanpa password:

```bash
ssh-keygen -t ed25519 -C "your@email.com"
cat ~/.ssh/id_ed25519.pub   # copy ke GitHub → Settings → SSH Keys
```

### 4. Buat `.env` di VPS

```bash
cp .env.example .env
nano .env
```

```env
REPO_PATH=/root/latihan-nodejs
GIT_REMOTE=origin
GIT_BRANCH=main
CRON_SCHEDULE=0 9 * * *
GIT_USER_NAME=hwsdev
GIT_USER_EMAIL=your@email.com
```

### 5. Jalankan dengan PM2

```bash
npm run pm2:start
```

Aktifkan auto-start setelah reboot:

```bash
pm2 save
pm2 startup
# Ikuti perintah yang muncul di terminal
```

### 6. Perintah PM2 berguna

```bash
npm run pm2:status    # Lihat status bot
npm run pm2:logs      # Live log
npm run pm2:restart   # Restart bot
npm run pm2:stop      # Stop bot
```

---

## Konfigurasi `.env`

| Variabel | Wajib | Default | Keterangan |
|---|---|---|---|
| `REPO_PATH` | Ya | — | Path absolut ke repo target lokal |
| `GIT_REMOTE` | Tidak | `origin` | Nama remote git |
| `GIT_BRANCH` | Tidak | `main` | Branch yang digunakan |
| `CRON_SCHEDULE` | Tidak | `0 9 * * *` | Jadwal cron (default: jam 09.00 UTC) |
| `BACKFILL_START` | Tidak | — | Tanggal awal backfill (`YYYY-MM-DD`) |
| `BACKFILL_END` | Tidak | Hari ini | Tanggal akhir backfill (`YYYY-MM-DD`) |
| `GIT_USER_NAME` | Tidak | Config repo | Override nama author git |
| `GIT_USER_EMAIL` | Tidak | Config repo | Override email author git |

---

## Catatan Penting

- Gunakan **repo khusus** (`latihan-nodejs`) — jangan arahkan ke repo proyek aktif.
- Jangan commit file `.env` ke GitHub — sudah ada di `.gitignore`.
- Cron `0 9 * * *` artinya jam 09.00 UTC. Untuk WIB (UTC+7) ganti ke `0 2 * * *`.
