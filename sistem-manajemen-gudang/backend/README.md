# Sistem Manajemen Gudang - Backend

Backend API untuk Sistem Manajemen Gudang menggunakan Node.js, Express, dan PostgreSQL.

## Tech Stack

- Node.js
- Express.js
- PostgreSQL
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
DB_NAME=sistem_manajemen_gudang_db
DB_USER=your_username
DB_PASSWORD=your_password
PORT=3000
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

Server akan berjalan di `http://localhost:3000`

## Rate Limiting

API ini menerapkan rate limiting untuk keamanan:

| Endpoint | Limit | Window |
|----------|-------|--------|
| All API (`/api/*`) | 100 requests | 15 menit |

Jika limit tercapai, API akan mengembalikan:
```json
{
  "success": false,
  "message": "Terlalu banyak request, coba lagi dalam 15 menit"
}
```

## API Endpoints

### Items

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/items` | Mendapatkan semua barang |
| GET | `/api/items/:id` | Mendapatkan barang berdasarkan ID |
| POST | `/api/items` | Menambah barang baru |
| PUT | `/api/items/:id` | Mengupdate barang |
| DELETE | `/api/items/:id` | Menghapus barang |
| POST | `/api/items/sync` | Sync barang dari API eksternal |

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
Test Suites: 1 passed, 1 total
Tests:       18 passed, 18 total
Coverage:    85%
```

### Test Cases

- **GET /api/items** - Mendapatkan semua barang, handle empty array
- **GET /api/items/:id** - Mendapatkan single item, handle 404
- **POST /api/items** - Create item, validasi required fields, handle stock 0
- **POST /api/items/sync** - Sync dari API eksternal, insert/update items
- **PUT /api/items/:id** - Update item, handle 404, validasi fields
- **DELETE /api/items/:id** - Delete item, handle 404
- **Health Check** - Cek status server

## Struktur Folder

```
backend/
├── __tests__/
│   ├── setup.js          # Test setup & teardown
│   └── items.test.js     # Test cases untuk items
├── db/
│   └── index.js          # Database connection & schema
├── routes/
│   └── items.js          # Items routes
├── app.js                # Express app configuration
├── index.js              # Server entry point
├── migrate.js            # Database migration script
├── seed.js               # Database seeder script
├── .env                  # Environment variables
├── .env.test             # Test environment variables
└── package.json
```

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
