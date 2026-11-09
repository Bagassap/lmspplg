ALTER TABLE "submisi_project_ukk" DROP CONSTRAINT "submisi_project_ukk_soalId_fkey";
ALTER TABLE "submisi_project_ukk" ALTER COLUMN "soalId" DROP NOT NULL;
ALTER TABLE "submisi_project_ukk" ADD CONSTRAINT "submisi_project_ukk_soalId_fkey" FOREIGN KEY ("soalId") REFERENCES "soal_tahapan_ukk"("id") ON DELETE SET NULL ON UPDATE CASCADE;
