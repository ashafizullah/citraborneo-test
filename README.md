# Citraborneo Test Project

Project ini terdiri dari 2 sistem aplikasi web yang dibangun menggunakan Vue.js (Frontend) dan Node.js/Express (Backend) dengan database PostgreSQL.

## Projects

### 1. Sistem Manajemen Gudang
Aplikasi manajemen inventory/gudang dengan fitur:
- Login via external API
- CRUD barang/items
- Sync data dari API eksternal
- Dashboard inventory

### 2. Sistem HR (Human Resource)
Aplikasi manajemen SDM dengan fitur:
- Autentikasi (Admin & Karyawan)
- Manajemen Karyawan
- Manajemen Departemen & Jabatan
- Absensi (Check-in/Check-out)
- Pengajuan & Persetujuan Cuti
- Dashboard statistik

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Vue.js 3, Vite, Pinia, Vue Router, Tailwind CSS |
| Backend | Node.js, Express.js |
| Database | PostgreSQL |
| Authentication | JWT (JSON Web Token) |
| Testing | Jest, Supertest |

## Project Structure

```
citraborneo-test/
├── sistem-hr/
│   ├── frontend/          # Vue.js frontend
│   └── backend/           # Express.js API
├── sistem-manajemen-gudang/
│   ├── frontend/          # Vue.js frontend
│   └── backend/           # Express.js API
├── DEPLOY.md              # Deployment guide
└── README.md              # This file
```

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+

### Backend Setup

```bash
# Sistem HR
cd sistem-hr/backend
npm install
cp .env.example .env  # Edit dengan konfigurasi database Anda
npm run migrate
npm run seed
npm run dev

# Sistem Manajemen Gudang
cd sistem-manajemen-gudang/backend
npm install
cp .env.example .env  # Edit dengan konfigurasi database Anda
npm run migrate
npm run seed
npm run dev
```

### Frontend Setup

```bash
# Sistem HR
cd sistem-hr/frontend
npm install
npm run dev

# Sistem Manajemen Gudang
cd sistem-manajemen-gudang/frontend
npm install
npm run dev
```

## Testing

```bash
# Sistem HR Backend (82 tests)
cd sistem-hr/backend
npm test

# Sistem Manajemen Gudang Backend (18 tests)
cd sistem-manajemen-gudang/backend
npm test
```

## Deployment

Lihat [DEPLOY.md](./DEPLOY.md) untuk panduan lengkap deployment di Ubuntu Server dengan Nginx, PostgreSQL, dan SSL Certificate.

## Default Credentials

### Sistem HR
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@hr.com | admin123 |
| Employee | test.employee@company.com | password123 |

### Sistem Manajemen Gudang
Login menggunakan external API: `https://auth.srs-ssms.com/api/dev/login`

---

## Author

**Adam Suchi Hafizullah**

- Email: adamsuchihafizullah@gmail.com
- WhatsApp: 082179392018
- LinkedIn: [@ashafizullah](https://linkedin.com/in/ashafizullah)

---

*Created for Citraborneo Technical Test*
