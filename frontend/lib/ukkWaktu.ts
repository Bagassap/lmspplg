// Waktu task UKK: bisa berlangsung beberapa hari (tanggal – tanggalSelesai), jam selesai berlaku di hari terakhir.
export type TaskWaktu = { tanggal: string; tanggalSelesai?: string | null; jamMulai?: string; jamSelesai?: string };

const ymd = (s: string) => s.slice(0, 10);

export function tanggalAkhir(t: TaskWaktu) {
  return ymd(t.tanggalSelesai || t.tanggal);
}

function jakartaNow() {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date());
  const get = (k: string) => parts.find((p) => p.type === k)?.value ?? "00";
  return { tgl: `${get("year")}-${get("month")}-${get("day")}`, menit: Number(get("hour")) * 60 + Number(get("minute")) };
}

/** Task masih aktif sampai tanggal akhir pukul jam selesai (WIB). */
export function isTaskAktif(t: TaskWaktu) {
  const now = jakartaNow();
  const akhir = tanggalAkhir(t);
  if (akhir > now.tgl) return true;
  if (akhir < now.tgl) return false;
  const [h, m] = (t.jamSelesai ?? "23:59").split(":").map(Number);
  return now.menit < (h || 0) * 60 + (m || 0);
}

const fmt = (s: string, withYear: boolean) =>
  new Date(`${ymd(s)}T00:00:00Z`).toLocaleDateString("id-ID", { day: "numeric", month: "short", ...(withYear ? { year: "numeric" } : {}), timeZone: "UTC" });

/** "20 Okt 2026" atau "20 Okt – 22 Okt 2026". */
export function formatRentang(t: TaskWaktu) {
  const a = ymd(t.tanggal);
  const b = tanggalAkhir(t);
  if (a === b) return fmt(a, true);
  return `${fmt(a, false)} – ${fmt(b, true)}`;
}

/** Semua tanggal (00:00 lokal) dalam rentang task, untuk kalender. */
export function daftarTanggal(t: TaskWaktu): Date[] {
  const [y1, m1, d1] = ymd(t.tanggal).split("-").map(Number);
  const [y2, m2, d2] = tanggalAkhir(t).split("-").map(Number);
  const out: Date[] = [];
  const cur = new Date(y1, m1 - 1, d1);
  const end = new Date(y2, m2 - 1, d2);
  for (let i = 0; cur <= end && i < 62; i++) { out.push(new Date(cur)); cur.setDate(cur.getDate() + 1); }
  return out;
}
