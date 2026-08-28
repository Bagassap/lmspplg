-- CreateTable
CREATE TABLE "_KelasToTugas" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_KelasToTugas_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_KelasToTugas_B_index" ON "_KelasToTugas"("B");

-- AddForeignKey
ALTER TABLE "_KelasToTugas" ADD CONSTRAINT "_KelasToTugas_A_fkey" FOREIGN KEY ("A") REFERENCES "kelas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_KelasToTugas" ADD CONSTRAINT "_KelasToTugas_B_fkey" FOREIGN KEY ("B") REFERENCES "tugas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Preserve existing single-kelas assignments as the first row of the new
-- many-to-many join table, before dropping the old column.
INSERT INTO "_KelasToTugas" ("A", "B")
SELECT "kelasId", "id" FROM "tugas" WHERE "kelasId" IS NOT NULL;

-- DropForeignKey
ALTER TABLE "tugas" DROP CONSTRAINT "tugas_kelasId_fkey";

-- AlterTable
ALTER TABLE "tugas" DROP COLUMN "kelasId";
