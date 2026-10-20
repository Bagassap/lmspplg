-- AlterEnum
ALTER TYPE "StatusPenempatan" ADD VALUE 'MENUNGGU';

-- AlterTable
ALTER TABLE "tempat_magang" ALTER COLUMN "alamat" DROP NOT NULL,
ADD COLUMN "dukuh" TEXT,
ADD COLUMN "desa" TEXT,
ADD COLUMN "kecamatan" TEXT,
ADD COLUMN "kabupaten" TEXT,
ADD COLUMN "namaPimpinan" TEXT,
ADD COLUMN "noWaUsaha" TEXT,
ADD COLUMN "dibuatSiswa" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "penempatan_magang" ALTER COLUMN "guruPembimbingId" DROP NOT NULL,
ADD COLUMN "kelompokId" TEXT;
