-- Data: daftar instansi PKL 2026-2027
CREATE TEMP TABLE "_instansi_2026" ("namaTempat" TEXT NOT NULL, "kuota" INTEGER NOT NULL, "jenisKelamin" TEXT);

INSERT INTO "_instansi_2026" ("namaTempat", "kuota", "jenisKelamin") VALUES
  ('ZIEDA CAKE & BAKERY, LIMPUNG', 4, 'Perempuan'),
  ('ROTATOLI TSHIRT, LIMPUNG', 4, 'Laki-laki'),
  ('NEODY DISTRO & CLOTHING, LIMPUNG', 2, NULL),
  ('ABUNAWAS, BATANG', 4, 'Laki-laki'),
  ('LIAN KHAY, PEKALONGAN', 2, 'Perempuan'),
  ('HAND''S PRINTING, BANYUPUTIH', 2, 'Laki-laki'),
  ('GARUDA PRINTING, BAWANG', 2, NULL),
  ('GNG GRAFIKA, SUKOREJO', 2, 'Laki-laki'),
  ('PERCETAKAN AKURO, SUKOREJO', 2, 'Laki-laki'),
  ('HIDDEN PLAY', 2, NULL),
  ('AHA GRAFIKA, PLELEN', 2, NULL),
  ('AA MULIA, BAWANG', 2, 'Laki-laki'),
  ('AIMAN STUDIO, LIMPUNG', 2, NULL),
  ('BINTANG MULYA ADVERTISING, LIMPUNG', 2, 'Laki-laki'),
  ('BRELIAN FOTO, LIMPUNG', 2, 'Perempuan'),
  ('PERCETAKAN FASTABIQ, LIMPUNG', 2, 'Laki-laki'),
  ('G&C TSHIRT, TERSONO', 2, 'Laki-laki'),
  ('PT KIRANA DESAIN INDONESIA, TERSONO', 3, NULL),
  ('ING SPORT, TERSONO', 2, 'Laki-laki'),
  ('ENKA DIGITAL PRINTING, REBAN', 4, NULL),
  ('DS PRO SPORTWEAR, LIMPUNG', 4, NULL),
  ('POIN OFFSET, LIMPUNG', 2, NULL),
  ('UFO SABLON, LIMPUNG', 2, 'Laki-laki'),
  ('MASIYUNG SABLON, DONOREJO', 2, NULL),
  ('DEYEPE CREATIVE, LIMPUNG', 2, NULL),
  ('SAMUDRA DIGITAL PRINTING, LIMPUNG', 2, NULL),
  ('DO_GANK, LIMPUNG', 6, NULL),
  ('PRATAMA DIGITAL PRINTING, LIMPUNG', 4, NULL),
  ('W. CLOTHING, LIMPUNG', 5, NULL),
  ('JENDRAL SPORT, LIMPUNG', 2, NULL),
  ('SURYAMAS, PEKALONGAN', 6, 'Perempuan'),
  ('OEMAH DESAIN WALES, BLADO', 2, 'Perempuan'),
  ('IRSYAD PUTRA KAROSERI, SUBAH', 2, 'Laki-laki'),
  ('DIPA JAYA GALLERY, CEPIRING', 2, 'Laki-laki'),
  ('CV. DOA ORANG TUA, SUBAH', 4, 'Laki-laki'),
  ('RDESIGN GALERY, BAWANG', 2, NULL),
  ('JAYAPRINT, BANDAR', 2, NULL),
  ('PRINTIME, BATANG', 1, 'Laki-laki');

UPDATE "tempat_magang" t
SET "kuota" = d."kuota", "jenisKelamin" = d."jenisKelamin", "dibuatSiswa" = false, "updatedAt" = CURRENT_TIMESTAMP
FROM "_instansi_2026" d
WHERE lower(trim(t."namaTempat")) = lower(trim(d."namaTempat"));

INSERT INTO "tempat_magang" ("id", "namaTempat", "kuota", "jenisKelamin", "dibuatSiswa", "createdAt", "updatedAt")
SELECT 'ins' || substr(md5(random()::text || d."namaTempat"), 1, 22), d."namaTempat", d."kuota", d."jenisKelamin", false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "_instansi_2026" d
WHERE NOT EXISTS (
  SELECT 1 FROM "tempat_magang" t WHERE lower(trim(t."namaTempat")) = lower(trim(d."namaTempat"))
);

DROP TABLE "_instansi_2026";
