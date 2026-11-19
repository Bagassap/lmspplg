-- AlterTable
ALTER TABLE "pendaftaran_magang" ADD COLUMN "tempatMagangId" TEXT;

-- AddForeignKey
ALTER TABLE "pendaftaran_magang" ADD CONSTRAINT "pendaftaran_magang_tempatMagangId_fkey" FOREIGN KEY ("tempatMagangId") REFERENCES "tempat_magang"("id") ON DELETE SET NULL ON UPDATE CASCADE;
