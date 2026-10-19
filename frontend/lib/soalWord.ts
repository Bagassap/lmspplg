import type { TugasTipe } from "@/components/tugas/types";

export type SoalWord = {
  pertanyaan: string;
  pilihanA: string;
  pilihanB: string;
  pilihanC: string;
  pilihanD: string;
  jawabanBenar: string;
};

const MARK = "=== MULAI SOAL ===";

function kosong(): SoalWord {
  return { pertanyaan: "", pilihanA: "", pilihanB: "", pilihanC: "", pilihanD: "", jawabanBenar: "" };
}

/**
 * Baca teks hasil ekstraksi Word menjadi daftar soal.
 * Format: "1. Pertanyaan", pilihan "A. ... D.", lalu "Jawaban: B" (pilihan ganda)
 * atau "Kunci: ..." (essay). Teks sebelum penanda "=== MULAI SOAL ===" dilewati.
 */
export function parseSoalText(raw: string, tipe: TugasTipe | string): SoalWord[] {
  let text = raw.replace(/\r/g, "");
  const m = text.indexOf(MARK);
  if (m >= 0) text = text.slice(m + MARK.length);
  const isPG = tipe === "PILIHAN_GANDA";

  const out: SoalWord[] = [];
  let cur: SoalWord | null = null;
  let field: keyof SoalWord = "pertanyaan";

  const append = (f: keyof SoalWord, v: string) => {
    if (!cur) return;
    cur[f] = cur[f] ? `${cur[f]}\n${v}` : v;
  };

  for (const line of text.split("\n")) {
    const t = line.trim();
    if (!t) continue;

    const q = t.match(/^(?:soal\s*)?(\d+)\s*[.)\]:]\s*(.*)$/i);
    if (q) {
      if (cur) out.push(cur);
      cur = kosong();
      cur.pertanyaan = q[2].trim();
      field = "pertanyaan";
      continue;
    }
    if (!cur) continue;

    const ans = t.match(/^(?:jawaban(?:\s*benar)?|kunci(?:\s*jawaban)?|kj)\s*[:=\-]\s*(.*)$/i);
    if (ans) {
      if (isPG) {
        const huruf = ans[1].trim().charAt(0).toUpperCase();
        cur.jawabanBenar = "ABCD".includes(huruf) && huruf ? huruf : "";
        field = "jawabanBenar";
      } else {
        cur.jawabanBenar = ans[1].trim();
        field = "jawabanBenar";
      }
      continue;
    }

    if (isPG) {
      const opt = t.match(/^\(?([A-Da-d])[.)]\s*(.*)$/);
      if (opt) {
        field = `pilihan${opt[1].toUpperCase()}` as keyof SoalWord;
        cur[field] = opt[2].trim();
        continue;
      }
    }

    if (isPG && field === "jawabanBenar") continue;
    append(field, t);
  }
  if (cur) out.push(cur);
  return out.filter((s) => s.pertanyaan.trim());
}

/** Baca file .docx di browser dan jadikan daftar soal. */
export async function parseSoalDocx(file: File, tipe: TugasTipe | string): Promise<SoalWord[]> {
  const mammoth = await import("mammoth");
  const arrayBuffer = await file.arrayBuffer();
  const { value } = await mammoth.extractRawText({ arrayBuffer });
  return parseSoalText(value, tipe);
}

/** Unduh templat Word untuk menulis soal + jawaban. */
export async function downloadTemplateSoal(tipe: TugasTipe | string): Promise<void> {
  const { Document, Packer, Paragraph, TextRun, HeadingLevel } = await import("docx");
  const isPG = tipe === "PILIHAN_GANDA";
  const p = (text: string, opts: { bold?: boolean; size?: number; color?: string; after?: number } = {}) =>
    new Paragraph({
      spacing: { after: opts.after ?? 120 },
      children: [new TextRun({ text, bold: opts.bold, size: opts.size ?? 24, color: opts.color })],
    });

  const petunjuk = isPG
    ? [
        "Tulis tiap soal dengan nomor lalu titik, contoh: 1. Pertanyaan.",
        "Tulis pilihan jawaban satu baris satu: A. ..., B. ..., C. ..., D. ...",
        "Tulis jawaban benar pada baris sendiri: Jawaban: B",
        "Beri satu baris kosong antar soal. Jumlah soal bebas.",
      ]
    : [
        "Tulis tiap soal dengan nomor lalu titik, contoh: 1. Pertanyaan.",
        "Tulis kunci jawaban pada baris sendiri: Kunci: jawaban ideal atau poin penting.",
        "Beri satu baris kosong antar soal. Jumlah soal bebas.",
      ];

  const contoh: ReturnType<typeof p>[] = isPG
    ? [
        p("1. Apa kepanjangan dari HTML?", { bold: true }),
        p("A. HyperText Markup Language"),
        p("B. HighText Machine Language"),
        p("C. Hyperlink and Text Markup Language"),
        p("D. Home Tool Markup Language"),
        p("Jawaban: A", { after: 240 }),
        p("2. Tag untuk membuat paragraf adalah?", { bold: true }),
        p("A. <div>"),
        p("B. <p>"),
        p("C. <span>"),
        p("D. <br>"),
        p("Jawaban: B", { after: 240 }),
      ]
    : [
        p("1. Jelaskan perbedaan HTML dan CSS!", { bold: true }),
        p("Kunci: HTML untuk struktur halaman, CSS untuk tampilan (warna, tata letak).", { after: 240 }),
        p("2. Sebutkan dua kegunaan JavaScript pada web!", { bold: true }),
        p("Kunci: Membuat interaksi dan memanipulasi elemen halaman.", { after: 240 }),
      ];

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: `Templat Soal ${isPG ? "Pilihan Ganda" : "Essay"} - LMS PPLG`, bold: true })] }),
          p("PETUNJUK", { bold: true, color: "3E03B3" }),
          ...petunjuk.map((t) => p(`• ${t}`)),
          p("Hapus soal contoh di bawah, lalu tulis soal Anda. Simpan sebagai .docx dan impor lewat tombol Impor dari Word.", { color: "666666", after: 240 }),
          p(MARK, { bold: true, color: "3E03B3", after: 200 }),
          ...contoh,
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `templat-soal-${isPG ? "pilihan-ganda" : "essay"}.docx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
