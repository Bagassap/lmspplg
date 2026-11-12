CREATE TABLE "penilaian_ukk" (
    "id" TEXT NOT NULL,
    "submisiId" TEXT NOT NULL,
    "skor" JSONB NOT NULL,
    "rataRata" DOUBLE PRECISION,
    "pesanRevisi" TEXT,
    "revisiSelesai" BOOLEAN NOT NULL DEFAULT false,
    "dinilaiOleh" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "penilaian_ukk_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "penilaian_ukk_submisiId_key" ON "penilaian_ukk"("submisiId");

ALTER TABLE "penilaian_ukk" ADD CONSTRAINT "penilaian_ukk_submisiId_fkey" FOREIGN KEY ("submisiId") REFERENCES "submisi_project_ukk"("id") ON DELETE CASCADE ON UPDATE CASCADE;
