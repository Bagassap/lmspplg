-- CreateTable
CREATE TABLE "pengaturan_sistem" (
    "id" TEXT NOT NULL,
    "magangAktif" BOOLEAN NOT NULL DEFAULT false,
    "ukkAktif" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pengaturan_sistem_pkey" PRIMARY KEY ("id")
);

-- Seed baris singleton (dua-duanya nonaktif secara default)
INSERT INTO "pengaturan_sistem" ("id", "magangAktif", "ukkAktif", "updatedAt")
VALUES ('singleton', false, false, now());
