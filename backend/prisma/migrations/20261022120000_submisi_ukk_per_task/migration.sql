-- Pengiriman project UKK per task (bukan per berkas soal umum).
ALTER TABLE "submisi_project_ukk" ADD COLUMN "tahapanId" TEXT;

-- Data lama: tempelkan ke task pertama agar tidak hilang dari daftar.
UPDATE "submisi_project_ukk"
SET "tahapanId" = (SELECT "id" FROM "tahapan_ukk" WHERE "hariKe" > 0 ORDER BY "createdAt" ASC LIMIT 1)
WHERE "tahapanId" IS NULL;

DROP INDEX IF EXISTS "submisi_project_ukk_soalId_siswaId_key";
CREATE UNIQUE INDEX "submisi_project_ukk_tahapanId_siswaId_key" ON "submisi_project_ukk"("tahapanId", "siswaId");
CREATE INDEX "submisi_project_ukk_soalId_idx" ON "submisi_project_ukk"("soalId");
ALTER TABLE "submisi_project_ukk" ADD CONSTRAINT "submisi_project_ukk_tahapanId_fkey" FOREIGN KEY ("tahapanId") REFERENCES "tahapan_ukk"("id") ON DELETE CASCADE ON UPDATE CASCADE;
