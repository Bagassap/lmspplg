-- CreateEnum
CREATE TYPE "StatusPendaftaranMagang" AS ENUM ('MENUNGGU', 'DITERIMA', 'DITOLAK');

-- AlterTable
ALTER TABLE "tempat_magang" ADD COLUMN "rt" TEXT,
ADD COLUMN "rw" TEXT;

-- CreateTable
CREATE TABLE "pendaftaran_magang" (
    "id" TEXT NOT NULL,
    "siswaId" TEXT NOT NULL,
    "noWa" TEXT NOT NULL,
    "dukuh" TEXT NOT NULL,
    "rt" TEXT NOT NULL,
    "rw" TEXT NOT NULL,
    "desa" TEXT NOT NULL,
    "kecamatan" TEXT NOT NULL,
    "kabupaten" TEXT NOT NULL,
    "status" "StatusPendaftaranMagang" NOT NULL DEFAULT 'MENUNGGU',
    "alasanTolak" TEXT,
    "diverifikasiAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pendaftaran_magang_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pendaftaran_magang_siswaId_key" ON "pendaftaran_magang"("siswaId");

-- CreateIndex
CREATE INDEX "pendaftaran_magang_status_idx" ON "pendaftaran_magang"("status");

-- AddForeignKey
ALTER TABLE "pendaftaran_magang" ADD CONSTRAINT "pendaftaran_magang_siswaId_fkey" FOREIGN KEY ("siswaId") REFERENCES "siswa"("id") ON DELETE CASCADE ON UPDATE CASCADE;
