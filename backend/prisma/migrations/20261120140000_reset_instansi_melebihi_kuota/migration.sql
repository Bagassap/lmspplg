CREATE TEMP TABLE "_tempat_lebih_kuota" AS
SELECT t."id"
FROM "tempat_magang" t
WHERE t."dibuatSiswa" = false
  AND (
    SELECT COUNT(DISTINCT x."siswaId") FROM (
      SELECT p."siswaId" FROM "pendaftaran_magang" p
      WHERE p."tempatMagangId" = t."id" AND p."status" IN ('MENUNGGU', 'DITERIMA')
      UNION
      SELECT m."siswaId" FROM "penempatan_magang" m
      WHERE m."tempatMagangId" = t."id" AND m."status" IN ('MENUNGGU', 'AKTIF')
    ) x
  ) > t."kuota";

CREATE TEMP TABLE "_penempatan_dihapus" AS
SELECT m."id"
FROM "penempatan_magang" m
WHERE m."status" = 'MENUNGGU'
  AND m."tempatMagangId" IN (SELECT "id" FROM "_tempat_lebih_kuota");

DELETE FROM "izin_magang" WHERE "penempatanId" IN (SELECT "id" FROM "_penempatan_dihapus");
DELETE FROM "absensi_magang" WHERE "penempatanId" IN (SELECT "id" FROM "_penempatan_dihapus");
DELETE FROM "lapor_diri_magang" WHERE "penempatanId" IN (SELECT "id" FROM "_penempatan_dihapus");
DELETE FROM "laporan_akhir_magang" WHERE "penempatanId" IN (SELECT "id" FROM "_penempatan_dihapus");
DELETE FROM "penempatan_magang" WHERE "id" IN (SELECT "id" FROM "_penempatan_dihapus");

DELETE FROM "pendaftaran_magang" p
WHERE p."tempatMagangId" IN (SELECT "id" FROM "_tempat_lebih_kuota")
  AND p."status" IN ('MENUNGGU', 'DITERIMA')
  AND NOT EXISTS (
    SELECT 1 FROM "penempatan_magang" m
    WHERE m."siswaId" = p."siswaId" AND m."status" = 'AKTIF'
  );

DROP TABLE "_penempatan_dihapus";
DROP TABLE "_tempat_lebih_kuota";
