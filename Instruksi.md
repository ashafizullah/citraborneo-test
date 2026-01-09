Saya sudah membuat folder
sistem-hr (frontend, backend)
sistem-manajemen-gudang (frontend,backend)

gunakan framework vuejs pinia untuk froentend, node js untuk backend, dan posgtree sql untuk database

Deskripsi Tugas (Soal 1): Sistem Managemen Gudang

1.	Buatlah sebuah halaman login dengan ketentuan berikut :
a.	Gunakan API berikut untuk proses login :
Endpoint: POST 	https://auth.srs-ssms.com/api/dev/login
Headers: Content-Type: application/x-www-form-urlencoded
b.	Gunakan email dan password berikut untuk login :
•	Email : programmer@da
•	Password : Prog123!
c.	Jika login berhasil, maka API akan memberikan response dengan status code = 1 beserta data lengkap seperti berikut.
{
  "statusCode": 1,
  "message": "Login berhasil.",
  "data": {
    "email": "programmer@da",
    "name": "I'm Programmer",
    "department": "Digital Architect",
    "position": "Programmer",
    "api_token": "236|oF1FLhZEs3200OgTtwQkX1IdTV3NV7ZaH6unaMlce487Zdf"
  }
}

2.	Buatlah sebuah halaman utama sederhana (setelah berhasil login) dengan ketentuan berikut :
a.	Gunakan API berikut untuk mengambil data barang :
Endpoint: GET 	https://auth.srs-ssms.com/api/dev/list-items

Headers: Authorization: Bearer {api_token}

b.	Gunakan “api_token” yang diperoleh dari hasil response login sebagai Authorization Bearer Token untuk mengakses API ini.
c.	Jika berhasil, maka API akan memberikan response dengan status code = 1 beserta data lengkap seperti berikut.
 {
  "statusCode": 1,
  "message": "List items warehouse successfully leftieved.",
  "data": [
    {
      "id": 15,
      "item_name": "Lem dextone Plastic steel 48g",
      "stock": 13,
      "unit": "Pcs"
    },
    {
      "id": 16,
      "item_name": "Dextone Silicone Red 70g",
      "stock": 10,
      "unit": "Pcs"
    },
    {
      "id": 17,
      "item_name": "Kabel NYMHY 4x1,5",
      "stock": 5,
      "unit": "Roll"
    }
  ]
}
d.	Tampilkan daftar barang dalam bentuk list, dengan informasi berikut:
•	Nama Barang
•	Stok Barang
•	Satuan Barang
e.	Di halaman ini, pengguna juga dapat melakukan operasi berikut :
•	Menambahkan data barang baru (Create)
•	Mengedit data barang yang sudah ada (Update)
•	Menghapus data barang dari daftar (Delete)

Catatan :
•	Pengguna tetap dapat menambah, mengedit dan menghapus data barang yang ada di dalam daftar tersebut, baik sebelum atau sesudah data dari API diambil
Deskripsi Tugas (Soal 2): Sistem HR
Buat sebuah aplikasi Sistem HR sederhana dengan fitur-fitur utama berikut:
•	Login (Admin HR, Karyawan)
•	Manajemen Karyawan: Tambah data karyawan, Lihat daftar karyawan, Edit data karyawan, Hapus data karyawan
•	Data Jabatan & Departemen: Kelola jabatan, Kelola departemen
•	Absensi: Input absensi karyawan, Lihat riwayat absensi
•	Cuti: Pengajuan cuti karyawan, Persetujuan cuti oleh HR
•	Dashboard: Total karyawan, Jumlah karyawan aktif, Rekap absensi / cuti
Detail Teknis & Persyaratan
1. Frontend:
•	Buat UI responsif (mobile + desktop).
•	Sertakan halaman: Login, Dashboard HR, Daftar Karyawan, Form Tambah/Edit Karyawan, Halaman Absensi, Halaman Cuti, Halaman Jabatan/Departemen.
2. Backend:
•	RESTful API untuk operasi CRUD karyawan, jabatan, departemen, absensi, dan cuti.
•	Autentikasi (session atau JWT) untuk Admin HR dan Karyawan.
•	Validasi input di sisi server.
Deliverables (Harus diserahkan)
1.	Link YouTube video demo (publik). Video minimal 5 menit, jelaskan fitur utama, arsitektur singkat, dan cara menjalankan project secara lokal.
2.	Link repository (GitHub/GitLab) dengan kode sumber lengkap. Repository harus public dan menyertakan README yang jelas berisi instruksi instalasi, cara menjalankan, dan contoh penggunaan API/endpoints.
3.	File build / instruksi deployment (opsional).
4.	Dokumentasi singkat API (bisa di README atau file terpisah).
5.	Screenshots halaman utama (opsional tetapi direkomendasikan).
Kriteria Penilaian
•	Kelengkapan fitur dibandingkan dengan spesifikasi (40%)
•	Kualitas kode: struktur, kebersihan, dan penggunaan best practices (20%)
•	UI/UX dan responsif desain (15%)
•	Dokumentasi, instruksi instalasi, dan README (10%)
•	Video demo dan kualitas penjelasan (10%)
•	Penggunaan version control dan keteraturan commit (5%)
Catatan Tambahan (Opsional untuk nilai tambah)
•	Tambahkan fitur pencarian dan filter pada daftar karyawan.
•	Tambahkan eksport CSV untuk daftar karyawan dan rekap absensi/cuti.
•	Implementasikan role-based access control (mis. Admin HR vs Karyawan) dengan hak akses yang jelas.
Sertakan test unit atau integration untuk beberapa endpoint kunci (nilai tambah).
