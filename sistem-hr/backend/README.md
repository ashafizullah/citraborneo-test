# Sistem HR - Backend

Backend API untuk Sistem HR (Human Resource) menggunakan Node.js, Express, PostgreSQL, dan JWT Authentication.

## Tech Stack

- Node.js
- Express.js
- PostgreSQL
- JWT (JSON Web Token)
- Bcrypt
- Jest & Supertest (Testing)

## Instalasi

```bash
# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit .env sesuai konfigurasi database Anda
```

## Konfigurasi Environment

Buat file `.env` dengan isi:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=sistem_hr_db
DB_USER=your_username
DB_PASSWORD=your_password
PORT=3001
JWT_SECRET=your_jwt_secret_key
```

## Database

```bash
# Jalankan migration
npm run migrate

# Jalankan seeder (opsional)
npm run seed

# Reset database (migrate + seed)
npm run db:reset
```

## Menjalankan Server

```bash
# Development mode
npm run dev

# Production mode
npm start
```

Server akan berjalan di `http://localhost:3001`

## Default Login Credentials

Setelah menjalankan seeder:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@hr.com | admin123 |
| Employee | test.employee@company.com | password123 |

## Rate Limiting

API ini menerapkan rate limiting untuk keamanan:

| Endpoint | Limit | Window |
|----------|-------|--------|
| General API (`/api/*`) | 100 requests | 15 menit |
| Auth endpoints (`/api/auth/login`, `/api/auth/refresh`) | 10 requests | 15 menit |

Jika limit tercapai, API akan mengembalikan:
```json
{
  "success": false,
  "message": "Terlalu banyak request, coba lagi dalam 15 menit"
}
```

## API Endpoints

### Authentication

| Method | Endpoint | Deskripsi | Auth |
|--------|----------|-----------|------|
| POST | `/api/auth/login` | Login user (returns accessToken & refreshToken) | - |
| POST | `/api/auth/refresh` | Refresh access token | - |
| POST | `/api/auth/logout` | Logout & invalidate refresh token | Required |
| GET | `/api/auth/me` | Get current user | Required |
| PUT | `/api/auth/change-password` | Ubah password | Required |

#### Login Response
```json
{
  "success": true,
  "message": "Login berhasil",
  "data": {
    "accessToken": "eyJhbGciOiJI...",
    "refreshToken": "eyJhbGciOiJI...",
    "expiresIn": 900,
    "user": { ... }
  }
}
```

#### Refresh Token
- Access Token berlaku selama 15 menit
- Refresh Token berlaku selama 7 hari
- Gunakan endpoint `/api/auth/refresh` untuk mendapatkan token baru

### Employees

| Method | Endpoint | Deskripsi | Auth |
|--------|----------|-----------|------|
| GET | `/api/employees` | Mendapatkan semua karyawan | Required |
| GET | `/api/employees/:id` | Mendapatkan karyawan by ID | Required |
| GET | `/api/employees/export/csv` | Export data karyawan ke CSV | Admin |
| POST | `/api/employees` | Menambah karyawan baru | Admin |
| PUT | `/api/employees/:id` | Mengupdate karyawan | Admin |
| DELETE | `/api/employees/:id` | Menghapus karyawan | Admin |

### Departments

| Method | Endpoint | Deskripsi | Auth |
|--------|----------|-----------|------|
| GET | `/api/departments` | Mendapatkan semua departemen | Required |
| GET | `/api/departments/:id` | Mendapatkan departemen by ID | Required |
| POST | `/api/departments` | Menambah departemen baru | Admin |
| PUT | `/api/departments/:id` | Mengupdate departemen | Admin |
| DELETE | `/api/departments/:id` | Menghapus departemen | Admin |

### Positions

| Method | Endpoint | Deskripsi | Auth |
|--------|----------|-----------|------|
| GET | `/api/positions` | Mendapatkan semua jabatan | Required |
| GET | `/api/positions/:id` | Mendapatkan jabatan by ID | Required |
| POST | `/api/positions` | Menambah jabatan baru | Admin |
| PUT | `/api/positions/:id` | Mengupdate jabatan | Admin |
| DELETE | `/api/positions/:id` | Menghapus jabatan | Admin |

### Attendances

| Method | Endpoint | Deskripsi | Auth |
|--------|----------|-----------|------|
| GET | `/api/attendances` | Mendapatkan semua absensi | Required |
| GET | `/api/attendances/today/status` | Status absensi hari ini | Required |
| GET | `/api/attendances/export/csv` | Export data absensi ke CSV | Admin |
| POST | `/api/attendances/check-in` | Check-in | Required |
| POST | `/api/attendances/check-out` | Check-out | Required |
| POST | `/api/attendances` | Tambah absensi manual | Admin |
| PUT | `/api/attendances/:id` | Update absensi | Admin |
| DELETE | `/api/attendances/:id` | Hapus absensi | Admin |

### Leaves

| Method | Endpoint | Deskripsi | Auth |
|--------|----------|-----------|------|
| GET | `/api/leaves` | Mendapatkan semua cuti | Required |
| GET | `/api/leaves/:id` | Mendapatkan cuti by ID | Required |
| GET | `/api/leaves/export/csv` | Export data cuti ke CSV | Admin |
| POST | `/api/leaves` | Mengajukan cuti | Required |
| PUT | `/api/leaves/:id` | Update pengajuan cuti | Required |
| PUT | `/api/leaves/:id/approve` | Approve/Reject cuti | Admin |
| DELETE | `/api/leaves/:id` | Hapus pengajuan cuti | Required |

### Dashboard

| Method | Endpoint | Deskripsi | Auth |
|--------|----------|-----------|------|
| GET | `/api/dashboard/stats` | Statistik dashboard | Required |

### Health Check

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/health` | Cek status server |

## Testing

Project ini menggunakan Jest dan Supertest untuk integration testing dengan database PostgreSQL asli.

### Menjalankan Test

```bash
# Jalankan semua test dengan coverage
npm test

# Jalankan test dalam watch mode
npm run test:watch
```

### Hasil Test

```
Test Suites: 7 passed, 7 total
Tests:       82 passed, 82 total
Coverage:    77%
```

### Test Suites

| Test Suite | Tests | Deskripsi |
|------------|-------|-----------|
| auth.test.js | 12 | Login, me, change-password |
| employees.test.js | 13 | CRUD employees + authorization |
| departments.test.js | 13 | CRUD departments + authorization |
| positions.test.js | 11 | CRUD positions + authorization |
| attendances.test.js | 15 | Check-in/out, CRUD absensi |
| leaves.test.js | 16 | Pengajuan & approval cuti |
| dashboard.test.js | 2 | Statistik dashboard |

## Struktur Folder

```
backend/
├── __tests__/
│   ├── setup.js              # Test setup & seed data
│   ├── helpers.js            # JWT token generators
│   ├── auth.test.js          # Auth tests
│   ├── employees.test.js     # Employees tests
│   ├── departments.test.js   # Departments tests
│   ├── positions.test.js     # Positions tests
│   ├── attendances.test.js   # Attendances tests
│   ├── leaves.test.js        # Leaves tests
│   └── dashboard.test.js     # Dashboard tests
├── db/
│   └── index.js              # Database connection & schema
├── middleware/
│   └── auth.js               # JWT authentication middleware
├── routes/
│   ├── auth.js               # Auth routes
│   ├── employees.js          # Employees routes
│   ├── departments.js        # Departments routes
│   ├── positions.js          # Positions routes
│   ├── attendances.js        # Attendances routes
│   ├── leaves.js             # Leaves routes
│   └── dashboard.js          # Dashboard routes
├── app.js                    # Express app configuration
├── index.js                  # Server entry point
├── migrate.js                # Database migration script
├── seed.js                   # Database seeder script
├── .env                      # Environment variables
├── .env.test                 # Test environment variables
└── package.json
```

## Database Schema

### Tables

- **departments** - Data departemen
- **positions** - Data jabatan (FK: department_id)
- **employees** - Data karyawan (FK: department_id, position_id)
- **users** - Data user untuk login (FK: employee_id)
- **attendances** - Data absensi (FK: employee_id)
- **leaves** - Data cuti (FK: employee_id, approved_by)

## Scripts

| Script | Deskripsi |
|--------|-----------|
| `npm start` | Jalankan server (production) |
| `npm run dev` | Jalankan server (development dengan nodemon) |
| `npm test` | Jalankan test dengan coverage |
| `npm run test:watch` | Jalankan test dalam watch mode |
| `npm run migrate` | Jalankan database migration |
| `npm run seed` | Jalankan database seeder |
| `npm run db:reset` | Reset database (migrate + seed) |
