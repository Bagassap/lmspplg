-- Pengumpulan tugas otomatis diterima (tanpa review guru).
UPDATE "tugas_submisi" SET "status" = 'DITERIMA', "pesanRevisi" = NULL WHERE "status" <> 'DITERIMA';
