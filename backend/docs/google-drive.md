# Penyimpanan Asset UKK ke Google Drive admin

Saat siswa **mengunggah file** di menu UKK (ZIP/RAR/PDF dst.), server menyalinnya ke Google Drive milik admin:

```
<folder induk "Asset UKK">/
  XII PG 1/
    Nama Siswa - Judul Task.zip
  XII RPL 1/
    ...
```

Folder kelas dibuat otomatis bila belum ada. Admin/guru dapat menyalin link file dan link folder kelas dari modal
**Rekap Pengumpulan**. Kalau siswa mengirim *link Google Drive* sendiri, tidak ada yang diunggah.
Bila Drive belum dikonfigurasi atau gagal, pengumpulan tetap tersimpan di server (tidak digagalkan).

## Konfigurasi sekali saja (akun Google admin)

1. Buka https://console.cloud.google.com → buat project → **APIs & Services → Library → Google Drive API → Enable**.
2. **OAuth consent screen**: tipe External, isi nama aplikasi, tambahkan email admin sebagai *Test user*
   (atau Publish app supaya refresh token tidak kedaluwarsa 7 hari).
3. **Credentials → Create credentials → OAuth client ID**, tipe *Web application*, tambahkan
   *Authorized redirect URI*: `https://developers.google.com/oauthplayground`. Catat **Client ID** dan **Client secret**.
4. Buka https://developers.google.com/oauthplayground → klik ikon gerigi → centang
   **Use your own OAuth credentials** → isi Client ID & secret → di langkah 1 pilih scope
   `https://www.googleapis.com/auth/drive.file` → **Authorize APIs** (login dengan akun Google admin) →
   **Exchange authorization code for tokens** → salin **Refresh token**.
5. Isi `backend/.env`:

```
GOOGLE_CLIENT_ID="...apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="..."
GOOGLE_REFRESH_TOKEN="1//0g..."
# opsional: ID folder induk yang sudah ada (bagian akhir URL folder Drive). Kosong = dibuat otomatis "Asset UKK" di My Drive.
GOOGLE_DRIVE_ROOT_FOLDER_ID=""
```

6. Restart backend. Scope `drive.file` hanya mengakses file/folder yang dibuat aplikasi ini, jadi folder induk
   buatan sendiri tidak bisa dipakai kecuali dibuat lewat aplikasi — biarkan `GOOGLE_DRIVE_ROOT_FOLDER_ID` kosong
   agar folder "Asset UKK" dibuat otomatis.
