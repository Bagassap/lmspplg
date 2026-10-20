-- Hapus sisa kolom mode lockdown / pengerjaan diawasi pada tugas.
ALTER TABLE "tugas" DROP COLUMN IF EXISTS "durasiMenit";
ALTER TABLE "tugas_submisi"
  DROP COLUMN IF EXISTS "jumlahPercobaan",
  DROP COLUMN IF EXISTS "terkunci",
  DROP COLUMN IF EXISTS "dipaksaKeluar",
  DROP COLUMN IF EXISTS "waktuMulai",
  DROP COLUMN IF EXISTS "deadlineWaktu",
  DROP COLUMN IF EXISTS "bonusPercobaan";
