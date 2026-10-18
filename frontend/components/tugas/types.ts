export type StatusTugas = "TERKIRIM" | "DITERIMA" | "REVISI";
export type TugasTipe = "SUBMIT" | "PRAKTIK" | "PILIHAN_GANDA" | "ESSAY";

export type TugasKelasRef = { id: string; nama: string };

export type TugasSoalItem = {
  id: string;
  urutan: number;
  pertanyaan: string;
  pilihanA: string | null;
  pilihanB: string | null;
  pilihanC: string | null;
  pilihanD: string | null;
  jawabanBenar?: string | null;
};

export type TugasJawabanItem = {
  id: string;
  soalId: string;
  jawabanPilihan: string | null;
  jawabanEssay: string | null;
  soal?: TugasSoalItem;
};

export type TugasSubmisiItem = {
  id: string;
  tugasId: string;
  siswaId: string;
  fileUrl: string | null;
  fileName: string | null;
  submittedHtml: string | null;
  submittedCss: string | null;
  submittedJs: string | null;
  catatan: string | null;
  pesanRevisi: string | null;
  status: StatusTugas;
  nilai: number | null;
  submittedAt: string;
  updatedAt: string;
  tugas?: { id: string; judul: string; tipe?: string; mapel?: string };
  siswa?: { id: string; nama: string | null; user?: { id: string; nama: string } | null };
  jawaban?: TugasJawabanItem[];
};

export type TugasItem = {
  id: string;
  mapel: string;
  kelasList: TugasKelasRef[];
  judul: string;
  deskripsi: string | null;
  deadline: string;
  tipe: string;
  fileUrl: string | null;
  fileName: string | null;
  starterHtml: string | null;
  starterCss: string | null;
  starterJs: string | null;
  createdBy: { id: string; nama: string; role: string };
  createdAt: string;
  updatedAt: string;
  _count?: { submisi: number };
  submisi?: TugasSubmisiItem[];
  soal?: TugasSoalItem[];
};

export function formatTgl(s: string) {
  return new Date(s).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Jakarta" });
}

export function formatTglJam(s: string) {
  const formatted = new Date(s).toLocaleString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" });
  return `${formatted} WIB`;
}

export function isTugasActive(t: { deadline: string }) {
  return new Date(t.deadline).getTime() > Date.now();
}

export function statusInfo(s: StatusTugas) {
  if (s === "DITERIMA") return { bg: "#F1EDFA", color: "#3E03B3", label: "Diterima" };
  if (s === "REVISI") return { bg: "#F2F2F2", color: "#0F172A", label: "Perlu Revisi" };
  return { bg: "#E6F7FF", color: "#0EA5E9", label: "Menunggu Review" };
}

export function tipeLabel(tipe: string) {
  if (tipe === "PRAKTIK") return "Praktik Kode";
  if (tipe === "PILIHAN_GANDA") return "Pilihan Ganda";
  if (tipe === "ESSAY") return "Essay";
  return "Kirim File";
}

export function hitungSkorPilihanGanda(jawaban: TugasJawabanItem[] | undefined) {
  if (!jawaban || jawaban.length === 0) return { benar: 0, total: 0 };
  const total = jawaban.length;
  const benar = jawaban.filter((j) => j.soal?.jawabanBenar && j.jawabanPilihan === j.soal.jawabanBenar).length;
  return { benar, total };
}

export function nilaiPilihanGanda(submisi: { nilai?: number | null; jawaban?: TugasJawabanItem[] }): number | null {
  if (typeof submisi.nilai === "number") return submisi.nilai;
  const { benar, total } = hitungSkorPilihanGanda(submisi.jawaban);
  if (total === 0) return null;
  return Math.round((benar / total) * 100);
}
