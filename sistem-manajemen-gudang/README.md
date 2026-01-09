# Sistem Manajemen Gudang

Aplikasi sederhana untuk manajemen barang gudang dengan fitur login menggunakan API eksternal dan CRUD barang.

## Tech Stack

- **Frontend:** Vue.js 3, Pinia, Vue Router, Axios, Tailwind CSS
- **Backend:** Node.js, Express.js, PostgreSQL

## Fitur

- Login menggunakan API eksternal
- Sinkronisasi data barang dari API eksternal
- CRUD barang (Create, Read, Update, Delete)
- Tampilan responsif

## Instalasi & Menjalankan

### Prasyarat

- Node.js (v18+)
- PostgreSQL
- npm atau yarn

### 1. Setup Database

```bash
# Buat database PostgreSQL
createdb gudang_db
```

### 2. Setup Backend

```bash
cd backend

# Install dependencies
npm install

# Konfigurasi environment (edit file .env jika perlu)
# DB_HOST=localhost
# DB_PORT=5432
# DB_NAME=gudang_db
# DB_USER=postgres
# DB_PASSWORD=postgres
# PORT=3000

# Jalankan server
npm run dev
```

Backend akan berjalan di `http://localhost:3000`

### 3. Setup Frontend

```bash
cd frontend

# Install dependencies
npm install

# Jalankan development server
npm run dev
```

Frontend akan berjalan di `http://localhost:5173`

## Akun Login

Gunakan kredensial berikut untuk login:

- **Email:** programmer@da
- **Password:** Prog123!

## API Endpoints

### Items

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | /api/items | Mengambil semua barang |
| GET | /api/items/:id | Mengambil detail barang |
| POST | /api/items | Menambah barang baru |
| POST | /api/items/sync | Sinkronisasi dari API eksternal |
| PUT | /api/items/:id | Update barang |
| DELETE | /api/items/:id | Hapus barang |

### Request Body (POST/PUT)

```json
{
  "item_name": "Nama Barang",
  "stock": 10,
  "unit": "Pcs"
}
```

## Struktur Folder

```
sistem-manajemen-gudang/
├── frontend/
│   ├── src/
│   │   ├── router/
│   │   ├── stores/
│   │   ├── views/
│   │   └── ...
│   └── ...
├── backend/
│   ├── db/
│   ├── routes/
│   ├── index.js
│   └── ...
└── README.md
```
