# Sistem HR

Aplikasi Sistem HR (Human Resources) lengkap dengan fitur manajemen karyawan, departemen, jabatan, absensi, dan cuti.

## Tech Stack

- **Frontend:** Vue.js 3, Pinia, Vue Router, Axios, Tailwind CSS
- **Backend:** Node.js, Express.js, PostgreSQL, JWT Authentication, Bcrypt

## Fitur

### Authentication
- Login dengan JWT
- Role-based access control (Admin HR & Karyawan)

### Manajemen Karyawan
- CRUD karyawan lengkap
- Pencarian dan filter karyawan
- Pembuatan akun login otomatis

### Manajemen Departemen & Jabatan
- CRUD departemen
- CRUD jabatan
- Relasi departemen-jabatan

### Absensi
- Check-in / Check-out karyawan
- Riwayat absensi
- Input absensi manual (admin)

### Cuti
- Pengajuan cuti karyawan
- Persetujuan/penolakan cuti oleh HR
- Riwayat cuti

### Dashboard
- Total karyawan
- Karyawan aktif
- Statistik absensi
- Rekap cuti
- Karyawan per departemen

## Instalasi & Menjalankan

### Prasyarat

- Node.js (v18+)
- PostgreSQL
- npm atau yarn

### 1. Setup Database

```bash
# Buat database PostgreSQL
createdb hr_db
```

### 2. Setup Backend

```bash
cd backend

# Install dependencies
npm install

# Konfigurasi environment (edit file .env jika perlu)
# DB_HOST=localhost
# DB_PORT=5432
# DB_NAME=hr_db
# DB_USER=postgres
# DB_PASSWORD=postgres
# PORT=3001
# JWT_SECRET=hr_system_secret_key_2024

# Jalankan server
npm run dev
```

Backend akan berjalan di `http://localhost:3001`

### 3. Setup Frontend

```bash
cd frontend

# Install dependencies
npm install

# Jalankan development server
npm run dev
```

Frontend akan berjalan di `http://localhost:5174`

## Akun Login Default

| Role | Email | Password |
|------|-------|----------|
| Admin HR | admin@hr.com | admin123 |

## API Endpoints

### Authentication

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| POST | /api/auth/login | Login |
| GET | /api/auth/me | Get current user |
| PUT | /api/auth/change-password | Ubah password |

### Employees

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | /api/employees | Daftar karyawan |
| GET | /api/employees/:id | Detail karyawan |
| POST | /api/employees | Tambah karyawan |
| PUT | /api/employees/:id | Update karyawan |
| DELETE | /api/employees/:id | Hapus karyawan |

### Departments

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | /api/departments | Daftar departemen |
| GET | /api/departments/:id | Detail departemen |
| POST | /api/departments | Tambah departemen |
| PUT | /api/departments/:id | Update departemen |
| DELETE | /api/departments/:id | Hapus departemen |

### Positions

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | /api/positions | Daftar jabatan |
| GET | /api/positions/:id | Detail jabatan |
| POST | /api/positions | Tambah jabatan |
| PUT | /api/positions/:id | Update jabatan |
| DELETE | /api/positions/:id | Hapus jabatan |

### Attendances

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | /api/attendances | Daftar absensi |
| GET | /api/attendances/today/status | Status absensi hari ini |
| POST | /api/attendances/check-in | Check-in |
| POST | /api/attendances/check-out | Check-out |
| POST | /api/attendances | Input absensi manual |
| PUT | /api/attendances/:id | Update absensi |
| DELETE | /api/attendances/:id | Hapus absensi |

### Leaves

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | /api/leaves | Daftar cuti |
| GET | /api/leaves/:id | Detail cuti |
| POST | /api/leaves | Ajukan cuti |
| PUT | /api/leaves/:id | Update cuti |
| PUT | /api/leaves/:id/approve | Approve/Reject cuti |
| DELETE | /api/leaves/:id | Hapus cuti |

### Dashboard

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | /api/dashboard/stats | Statistik dashboard |

## Struktur Folder

```
sistem-hr/
├── frontend/
│   ├── src/
│   │   ├── router/
│   │   ├── stores/
│   │   ├── views/
│   │   ├── layouts/
│   │   └── ...
│   └── ...
├── backend/
│   ├── db/
│   ├── routes/
│   ├── middleware/
│   ├── index.js
│   └── ...
└── README.md
```

## Database Schema

### Tables

- **users** - Akun login (admin/employee)
- **employees** - Data karyawan
- **departments** - Data departemen
- **positions** - Data jabatan
- **attendances** - Data absensi
- **leaves** - Data cuti
