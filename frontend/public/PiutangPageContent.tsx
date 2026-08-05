"use client";

import { useEffect, useMemo, useState, type ComponentType } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { notify } from "@/store/notifyStore";
import {
  AlertCircle,
  Banknote,
  CalendarCheck2,
  CalendarClock,
  CalendarDays,
  CalendarRange,
  CheckCircle2,
  Clock,
  Coins,
  Download,
  FileText,
  Filter,
  History,
  Landmark,
  Loader2,
  Percent,
  Plus,
  Receipt,
  Repeat,
  Search,
  Sparkles,
  TrendingUp,
  Users,
  Wallet,
  X,
} from "lucide-react";
import Layout from "@/components/Layout";
import { InformasiRekeningCard } from "@/components/transaksi/InformasiRekeningCard";
import { useNasabahLookup } from "@/hooks/useNasabahLookup";
import api from "@/lib/api";
import { getErrorMessage } from "@/lib/error";
import {
  formatCurrency,
  formatDateID,
  formatDateOnlyLongID,
  formatDigitsID,
  getWibDateParts,
  startOfWibDay,
  startOfWibWeek,
  toRomanNumeral,
} from "@/lib/format";
import { downloadPiutangPdf } from "@/lib/exportPdf";
import type {
  JenisPembayaranAngsuran,
  JenisPiutang,
  PiutangAngsuranHistoryItem,
  PiutangRingkasanItem,
} from "@/lib/types";

const TENOR_MAX = 24;
const TENOR_QUICK_OPTIONS = [6, 12, 24];

const JENIS_PIUTANG_OPTIONS: {
  value: JenisPiutang;
  label: string;
  caption: string;
  icon: typeof CalendarClock;
}[] = [
  {
    value: "bulanan",
    label: "Bulanan",
    caption: "Pokok + jasa flat tiap bulan",
    icon: CalendarClock,
  },
  {
    value: "berkala",
    label: "Berkala",
    caption: "Jasa tiap bulan, pokok di akhir",
    icon: Repeat,
  },
];

const JENIS_PIUTANG_LABEL: Record<JenisPiutang, string> = {
  bulanan: "Bulanan",
  berkala: "Berkala",
};

const JENIS_PEMBAYARAN_LABEL: Record<JenisPembayaranAngsuran, string> = {
  pokok_dan_jasa: "Pokok + Jasa Anggota",
  jasa_saja: "Jasa Anggota Saja",
  pelunasan: "Pelunasan (Pokok + Jasa)",
};

// Client-side mirror of PiutangService's calculation, used only to render a
// live preview before submitting - the server independently recomputes and
// locks in the authoritative numbers, this is never sent as-is.
function computePreview(jumlahPinjaman: number, jenisPiutang: JenisPiutang, tenor: number) {
  if (jumlahPinjaman <= 0 || tenor <= 0) return null;
  const persentaseJasa = jenisPiutang === "bulanan" ? 1 : 1.5;
  const nominalJasaFlat = Math.round((jumlahPinjaman * persentaseJasa) / 100);
  const provisiAdm = Math.round((jumlahPinjaman * 0.5) / 100);

  if (jenisPiutang === "bulanan") {
    const pokokPerBulan = Math.round(jumlahPinjaman / tenor);
    return {
      persentaseJasa,
      nominalJasaFlat,
      provisiAdm,
      pokokPerBulan,
      angsuranPerBulan: pokokPerBulan + nominalJasaFlat,
      pelunasanTerakhir: null as number | null,
      totalKeseluruhan: jumlahPinjaman + nominalJasaFlat * tenor,
    };
  }

  return {
    persentaseJasa,
    nominalJasaFlat,
    provisiAdm,
    pokokPerBulan: null as number | null,
    angsuranPerBulan: nominalJasaFlat,
    pelunasanTerakhir: jumlahPinjaman + nominalJasaFlat,
    totalKeseluruhan: jumlahPinjaman + nominalJasaFlat * tenor,
  };
}

const inputClass =
  "w-full rounded-xl border border-border bg-background-hover px-3 py-2.5 text-sm text-text-primary transition-shadow focus:border-primary focus:bg-background-card focus:outline-none focus:ring-2 focus:ring-primary/20";
const labelClass = "mb-1.5 block text-xs font-semibold text-text-secondary";

const listVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.04 } },
};

const rowVariants = {
  hidden: { opacity: 0, y: 6 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25 } },
};

const heroCardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] as const } },
};

// Mirrors Laporan's own period definitions (Harian/Mingguan/Bulanan) so a
// download from either page means the same lookback window - filtered here
// by tanggalPinjam since, unlike Simpanan's per-nasabah cumulative totals,
// each Piutang row is a discrete loan event with its own date.
const DOWNLOAD_OPTIONS = [
  {
    key: "harian" as const,
    label: "Harian",
    caption: "Rekap hari ini",
    icon: CalendarDays,
    gradient: "from-primary to-primary-dark",
  },
  {
    key: "mingguan" as const,
    label: "Mingguan",
    caption: "Rekap minggu ini",
    icon: CalendarRange,
    gradient: "from-gradient-green-from to-gradient-green-to",
  },
  {
    key: "bulanan" as const,
    label: "Bulanan",
    caption: "Rekap bulan ini",
    icon: CalendarCheck2,
    gradient: "from-gradient-orange-from to-gradient-orange-to",
  },
];

const COMPACT_TONE_GRADIENT = {
  blue: "from-primary to-primary-dark",
  green: "from-gradient-green-from to-gradient-green-to",
  orange: "from-gradient-orange-from to-gradient-orange-to",
  cyan: "from-gradient-blue-from to-gradient-blue-to",
} as const;

// A deliberately smaller sibling to GradientStatCard (which is sized for
// full dashboard-style summaries) - Piutang packs 4 of these next to the
// hero ring card in a 2x2 grid, so they stay compact instead of towering
// over it or stretching into an odd wide/short shape.
function CompactStatCard({
  tone,
  label,
  value,
  caption,
  icon: Icon,
  progressPct,
  progressLabel,
}: {
  tone: keyof typeof COMPACT_TONE_GRADIENT;
  label: string;
  value: number | string;
  caption: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  progressPct?: number;
  progressLabel?: string;
}) {
  return (
    <div
      className={`relative flex h-full flex-col justify-center overflow-hidden rounded-2xl bg-linear-to-br ${COMPACT_TONE_GRADIENT[tone]} p-4 text-white shadow-soft`}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-5 -right-5 h-20 w-20 rounded-full bg-white/10 blur-xl"
      />
      <div className="relative flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20">
          <Icon size={17} />
        </span>
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-white/85">{label}</p>
          <p className="truncate text-lg font-bold">{value}</p>
        </div>
      </div>
      <p className="relative mt-2.5 truncate text-[11px] text-white/75">{caption}</p>
      {progressPct !== undefined && (
        <div className="relative mt-2.5">
          <div className="mb-1 flex items-center justify-between text-[10px] text-white/75">
            <span className="truncate">{progressLabel}</span>
            <span className="shrink-0 font-bold text-white">{progressPct}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/20">
            <div
              className="h-full rounded-full bg-white transition-[width] duration-700"
              style={{ width: `${Math.min(100, Math.max(0, progressPct))}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export function PiutangPageContent() {
  const [ringkasan, setRingkasan] = useState<PiutangRingkasanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"semua" | "aktif" | "lunas">("semua");

  const [showAddModal, setShowAddModal] = useState(false);
  const [jenisPiutang, setJenisPiutang] = useState<JenisPiutang>("bulanan");
  const [jumlahPinjaman, setJumlahPinjaman] = useState("");
  const [tenor, setTenor] = useState("12");
  const [keterangan, setKeterangan] = useState("");
  const [adding, setAdding] = useState(false);
  const {
    noRekening,
    setNoRekening,
    nasabah,
    searching,
    suggestions,
    suggestionsLoading,
    selectSuggestion,
    handleSearch,
    reset: resetLookup,
  } = useNasabahLookup();

  const [angsuranTarget, setAngsuranTarget] = useState<PiutangRingkasanItem | null>(null);
  const [angsuranSaving, setAngsuranSaving] = useState(false);
  const [receipt, setReceipt] = useState<PiutangAngsuranHistoryItem | null>(null);

  const [historyTarget, setHistoryTarget] = useState<PiutangRingkasanItem | null>(null);
  const [historyList, setHistoryList] = useState<PiutangAngsuranHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [downloadingPeriod, setDownloadingPeriod] = useState<
    "harian" | "mingguan" | "bulanan" | null
  >(null);

  async function loadRingkasan() {
    setLoading(true);
    try {
      const { data } = await api.get<PiutangRingkasanItem[]>("/piutang");
      setRingkasan(data);
    } catch (error) {
      notify.error(getErrorMessage(error, "Gagal memuat data piutang"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRingkasan();
  }, []);

  const displayList = useMemo(() => {
    const q = search.trim().toLowerCase();
    const rows = ringkasan
      .filter((r) =>
        q ? r.nama.toLowerCase().includes(q) || r.noRekening.includes(q) : true,
      )
      .filter((r) => (statusFilter === "semua" ? true : r.status === statusFilter));

    // Each debitur's earliest loan date in view - groups (and the rows
    // within them) then sort oldest-first, so the newest piutang overall
    // ends up at the bottom while a person's multiple loans still sit next
    // to each other (required for the "don't repeat the name/NO" display).
    const earliestByDebitur = new Map<string, number>();
    for (const r of rows) {
      const t = new Date(r.tanggalPinjam).getTime();
      const current = earliestByDebitur.get(r.nasabahId);
      if (current === undefined || t < current) earliestByDebitur.set(r.nasabahId, t);
    }

    return rows.sort((a, b) => {
      const byGroup =
        (earliestByDebitur.get(a.nasabahId) ?? 0) - (earliestByDebitur.get(b.nasabahId) ?? 0);
      if (byGroup !== 0) return byGroup;
      return a.pinjamanKe - b.pinjamanKe;
    });
  }, [ringkasan, search, statusFilter]);

  // NO only increments when moving to a different debitur - a person's other
  // loans share the same number as their first row, mirroring the blanked
  // name/avatar cell below them.
  const numberedDisplayList = useMemo(() => {
    const debtorOrder = new Map<string, number>();
    for (const item of displayList) {
      if (!debtorOrder.has(item.nasabahId)) {
        debtorOrder.set(item.nasabahId, debtorOrder.size + 1);
      }
    }
    return displayList.map((item, index) => {
      const sameDebiturAsAbove =
        index > 0 && displayList[index - 1].nasabahId === item.nasabahId;
      return {
        ...item,
        sameDebiturAsAbove,
        displayNo: sameDebiturAsAbove ? null : (debtorOrder.get(item.nasabahId) ?? null),
      };
    });
  }, [displayList]);

  const stats = useMemo(() => {
    const totalPiutang = ringkasan.length;
    const aktifList = ringkasan.filter((r) => r.status === "aktif");
    const lunasList = ringkasan.filter((r) => r.status === "lunas");
    const totalDipinjamkan = ringkasan.reduce((sum, r) => sum + r.jumlahPinjaman, 0);
    const totalAngsuranTerkumpul = ringkasan.reduce((sum, r) => sum + r.totalAngsuran, 0);
    const totalSaldoBelumLunas = ringkasan.reduce((sum, r) => sum + r.saldo, 0);
    const persenTerbayar =
      totalDipinjamkan > 0 ? Math.round((totalAngsuranTerkumpul / totalDipinjamkan) * 100) : 0;
    const aktifPct = totalPiutang > 0 ? Math.round((aktifList.length / totalPiutang) * 100) : 0;
    const lunasPct = totalPiutang > 0 ? 100 - aktifPct : 0;
    const kesehatanLabel =
      totalPiutang === 0
        ? "Belum Ada Data"
        : persenTerbayar >= 75
          ? "Sangat Baik"
          : persenTerbayar >= 40
            ? "Berjalan Baik"
            : "Perlu Perhatian";
    return {
      totalPiutang,
      aktifList,
      lunasList,
      totalDipinjamkan,
      totalAngsuranTerkumpul,
      totalSaldoBelumLunas,
      persenTerbayar,
      aktifPct,
      lunasPct,
      kesehatanLabel,
    };
  }, [ringkasan]);

  const addPreview = useMemo(
    () => computePreview(Number(jumlahPinjaman) || 0, jenisPiutang, Number(tenor) || 0),
    [jumlahPinjaman, jenisPiutang, tenor],
  );

  function openAddModal() {
    setShowAddModal(true);
  }

  function closeAddModal() {
    setShowAddModal(false);
    resetLookup();
    setJenisPiutang("bulanan");
    setJumlahPinjaman("");
    setTenor("12");
    setKeterangan("");
  }

  async function submitAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!nasabah) return;
    const jumlahNumber = Number(jumlahPinjaman) || 0;
    const tenorNumber = Number(tenor) || 0;
    if (jumlahNumber <= 0) {
      notify.error("Jumlah pinjaman harus lebih dari 0");
      return;
    }
    if (tenorNumber < 1 || tenorNumber > TENOR_MAX) {
      notify.error(`Tenor harus antara 1 - ${TENOR_MAX} bulan`);
      return;
    }
    setAdding(true);
    try {
      await api.post("/piutang", {
        nasabahId: nasabah.id,
        jenisPiutang,
        jumlahPinjaman: jumlahNumber,
        tenor: tenorNumber,
        keterangan: keterangan.trim() || undefined,
      });
      notify.success(`Piutang baru untuk ${nasabah.nama} berhasil dicatat`);
      closeAddModal();
      loadRingkasan();
    } catch (error) {
      notify.error(getErrorMessage(error, "Gagal menambahkan piutang"));
    } finally {
      setAdding(false);
    }
  }

  function openAngsuran(item: PiutangRingkasanItem) {
    setAngsuranTarget(item);
    const sudahBayar = item.status === "lunas" || item.sudahBayarBulanIni;
    setReceipt(sudahBayar ? item.lastAngsuran : null);
  }

  function closeAngsuranModal() {
    setAngsuranTarget(null);
    setReceipt(null);
  }

  async function submitAngsuran() {
    if (!angsuranTarget?.nextAngsuran) return;
    setAngsuranSaving(true);
    try {
      const { data } = await api.post<PiutangAngsuranHistoryItem>("/piutang/angsuran", {
        piutangId: angsuranTarget.id,
      });
      notify.success(
        `Angsuran bulan ke-${angsuranTarget.nextAngsuran.bulanKe} untuk ${angsuranTarget.nama} berhasil dicatat`,
      );
      setReceipt(data);
      loadRingkasan();
    } catch (error) {
      notify.error(getErrorMessage(error, "Gagal menambahkan angsuran"));
    } finally {
      setAngsuranSaving(false);
    }
  }

  async function openHistory(item: PiutangRingkasanItem) {
    setHistoryTarget(item);
    setHistoryLoading(true);
    try {
      const { data } = await api.get<PiutangAngsuranHistoryItem[]>(
        `/piutang/${item.id}/angsuran`,
      );
      setHistoryList(data);
    } catch (error) {
      notify.error(getErrorMessage(error, "Gagal memuat riwayat angsuran"));
    } finally {
      setHistoryLoading(false);
    }
  }

  async function handleExport(p: "harian" | "mingguan" | "bulanan") {
    setDownloadingPeriod(p);
    try {
      const { year, month, day } = getWibDateParts();
      let rangeStart: Date;
      if (p === "harian") {
        rangeStart = startOfWibDay(year, month, day);
      } else if (p === "mingguan") {
        const monday = startOfWibWeek(year, month, day);
        rangeStart = startOfWibDay(monday.year, monday.month, monday.day);
      } else {
        rangeStart = startOfWibDay(year, month, 1);
      }

      // Grouped by debitur, same as the on-screen table, so a repeated name
      // (and NO) can be blanked out below instead of being rewritten every
      // row - oldest debitur group first, Pinjaman Ke-I before Ke-II within it.
      const periodRows = ringkasan.filter((r) => new Date(r.tanggalPinjam) >= rangeStart);
      const earliestByDebitur = new Map<string, number>();
      for (const r of periodRows) {
        const t = new Date(r.tanggalPinjam).getTime();
        const current = earliestByDebitur.get(r.nasabahId);
        if (current === undefined || t < current) earliestByDebitur.set(r.nasabahId, t);
      }
      const filtered = periodRows.sort((a, b) => {
        const byGroup =
          (earliestByDebitur.get(a.nasabahId) ?? 0) - (earliestByDebitur.get(b.nasabahId) ?? 0);
        if (byGroup !== 0) return byGroup;
        return a.pinjamanKe - b.pinjamanKe;
      });
      const periodOption = DOWNLOAD_OPTIONS.find((o) => o.key === p)!;
      const today = new Date().toISOString().slice(0, 10);

      let debtorNo = 0;
      await downloadPiutangPdf(
        {
          periodeLabel: `${periodOption.label} (${periodOption.caption})`,
          dicetakLabel: formatDateOnlyLongID(today),
          rows: filtered.map((r, i) => {
            const sameAsAbove = i > 0 && filtered[i - 1].nasabahId === r.nasabahId;
            if (!sameAsAbove) debtorNo += 1;
            return {
              noLabel: sameAsAbove ? "" : String(debtorNo),
              nama: sameAsAbove ? "" : r.nama,
              pinjamanKeLabel:
                r.jenisPiutang === "bulanan"
                  ? `Ke-${toRomanNumeral(r.pinjamanKe)}`
                  : "Berkala",
              jumlahPinjaman: r.jumlahPinjaman,
              totalAngsuran: r.totalAngsuran,
              jasaAnggotaTotal: r.jasaAnggotaTotal,
              provisiAdm: r.provisiAdm,
              saldo: r.saldo,
            };
          }),
        },
        `piutang-${p}-bankmini-${today}.pdf`,
      );
      notify.success(`Laporan piutang ${periodOption.label.toLowerCase()} berhasil diunduh`);
    } catch (error) {
      notify.error(getErrorMessage(error, "Gagal membuat laporan"));
    } finally {
      setDownloadingPeriod(null);
    }
  }

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="relative mb-5 overflow-hidden rounded-3xl bg-background-card p-5 shadow-soft sm:p-6 md:mb-7 2xl:mb-8"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.03] bg-[radial-gradient(circle,rgba(17,32,240,0.9)_1px,transparent_1px)] bg-size-[16px_16px]"
        />
        <div className="pointer-events-none absolute -top-14 -right-14 h-44 w-44 rounded-full bg-primary/10 blur-3xl" />

        <div className="relative flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="flex items-center gap-4">
            <motion.span
              initial={{ scale: 0.6, opacity: 0, rotate: -15 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              whileHover={{ scale: 1.08, rotate: 6 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-primary to-primary-dark text-white shadow-sm"
            >
              <Landmark size={24} />
            </motion.span>
            <div>
              <p className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                <Sparkles size={12} />
                Kredit Anggota
              </p>
              <h1 className="text-2xl font-bold text-text-primary">Piutang</h1>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-text-secondary">
                <Users size={13} className="text-text-muted" />
                Kelola pinjaman &amp; angsuran anggota
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <motion.button
              type="button"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={openAddModal}
              className="flex w-fit items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-primary-dark"
            >
              <Plus size={16} />
              Tambah Piutang
            </motion.button>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial="hidden"
        animate="visible"
        variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.08 } } }}
        className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6"
      >
        <motion.div
          variants={heroCardVariants}
          whileHover={{ y: -3 }}
          className="relative overflow-hidden rounded-2xl bg-linear-to-br from-primary to-primary-dark p-5 text-white shadow-soft transition-shadow hover:shadow-lg sm:col-span-2 lg:col-span-2"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-20 bg-[radial-gradient(circle,rgba(255,255,255,0.7)_1px,transparent_1px)] bg-size-[16px_16px]"
          />
          <div className="pointer-events-none absolute -top-8 -right-8 h-24 w-24 rounded-full bg-white/10 blur-2xl" />

          <div className="relative flex items-center gap-5">
            <div className="relative flex h-20 w-20 shrink-0 items-center justify-center">
              <svg viewBox="0 0 100 100" className="h-20 w-20 -rotate-90">
                <circle cx="50" cy="50" r="42" stroke="rgba(255,255,255,0.22)" strokeWidth="8" fill="none" />
                <motion.circle
                  cx="50"
                  cy="50"
                  r="42"
                  stroke="white"
                  strokeWidth="8"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 42}
                  initial={{ strokeDashoffset: 2 * Math.PI * 42 }}
                  animate={{
                    strokeDashoffset: 2 * Math.PI * 42 * (1 - stats.persenTerbayar / 100),
                  }}
                  transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                />
              </svg>
              <span className="absolute text-base font-bold">{stats.persenTerbayar}%</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-white/80">
                <Percent size={12} />
                Progress Pelunasan
              </p>
              <div className="mt-2 space-y-1.5 text-xs">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-white/75">Dipinjamkan</span>
                  <span className="font-bold">{formatCurrency(stats.totalDipinjamkan)}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-white/75">Saldo Tersisa</span>
                  <span className="font-bold">{formatCurrency(stats.totalSaldoBelumLunas)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="relative mt-4 border-t border-white/15 pt-3">
            <div className="mb-1.5 flex items-center justify-between text-[11px]">
              <span className="flex items-center gap-2.5 text-white/75">
                <span className="flex items-center gap-1">
                  <span className="inline-block h-2 w-2 rounded-full bg-white" />
                  Aktif {stats.aktifList.length}
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block h-2 w-2 rounded-full bg-white/35" />
                  Lunas {stats.lunasList.length}
                </span>
              </span>
              <span className="rounded-full bg-white/15 px-2 py-0.5 font-bold whitespace-nowrap">
                {stats.kesehatanLabel}
              </span>
            </div>
            <div className="flex h-2 w-full overflow-hidden rounded-full bg-white/15">
              <div
                className="h-full bg-white transition-[width] duration-700"
                style={{ width: `${stats.aktifPct}%` }}
              />
              <div
                className="h-full bg-white/35 transition-[width] duration-700"
                style={{ width: `${stats.lunasPct}%` }}
              />
            </div>
          </div>
        </motion.div>

        <CompactStatCard
          tone="blue"
          label="Total Pinjaman"
          value={stats.totalPiutang}
          caption="Seluruh riwayat pinjaman"
          icon={Users}
          progressPct={stats.aktifPct}
          progressLabel="Sedang berjalan (aktif)"
        />
        <CompactStatCard
          tone="orange"
          label="Aktif Berjalan"
          value={stats.aktifList.length}
          caption={`Saldo ${formatCurrency(stats.totalSaldoBelumLunas)}`}
          icon={Clock}
          progressPct={
            stats.totalDipinjamkan > 0
              ? Math.round((stats.totalSaldoBelumLunas / stats.totalDipinjamkan) * 100)
              : 0
          }
          progressLabel="Outstanding dari total dipinjamkan"
        />
        <CompactStatCard
          tone="green"
          label="Sudah Lunas"
          value={stats.lunasList.length}
          caption={`${stats.persenTerbayar}% dari total dipinjamkan`}
          icon={CheckCircle2}
          progressPct={stats.lunasPct}
          progressLabel="Dari seluruh pinjaman"
        />
        <CompactStatCard
          tone="cyan"
          label="Angsuran Terkumpul"
          value={formatCurrency(stats.totalAngsuranTerkumpul)}
          caption="Akumulasi seluruh angsuran masuk"
          icon={Coins}
          progressPct={stats.persenTerbayar}
          progressLabel="Dari total dipinjamkan"
        />
      </motion.div>


      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="relative flex h-full flex-col overflow-hidden rounded-3xl bg-background-card p-4 shadow-soft sm:p-5 lg:col-span-2"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.025] bg-[radial-gradient(circle,rgba(17,32,240,0.9)_1px,transparent_1px)] bg-size-[16px_16px]"
          />
          <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-bold text-text-primary">
                Daftar Piutang{" "}
                <span className="font-medium text-text-muted">({displayList.length})</span>
              </p>
              <p className="mt-1 text-xs text-text-secondary">
                Pinjaman &amp; angsuran per anggota
              </p>
            </div>
            <div className="relative w-full sm:max-w-xs">
              <Search
                size={16}
                className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-text-muted"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nama atau no. rekening..."
                className="w-full rounded-xl border border-transparent bg-background-hover py-2.5 pr-8 pl-9 text-sm text-text-primary transition-shadow focus:border-primary focus:bg-background-card focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute top-1/2 right-2.5 -translate-y-1/2 text-text-muted transition-colors hover:text-danger"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          <div className="relative mt-4 flex flex-wrap items-center gap-1.5 border-t border-border pt-4">
            <span className="mr-1 flex items-center gap-1 text-[11px] font-semibold text-text-muted">
              <Filter size={11} />
              Status:
            </span>
            {(
              [
                { value: "semua" as const, label: "Semua", icon: Users, count: ringkasan.length },
                {
                  value: "aktif" as const,
                  label: "Aktif",
                  icon: Clock,
                  count: stats.aktifList.length,
                },
                {
                  value: "lunas" as const,
                  label: "Lunas",
                  icon: CheckCircle2,
                  count: stats.lunasList.length,
                },
              ]
            ).map((opt) => {
              const active = statusFilter === opt.value;
              const OptIcon = opt.icon;
              return (
                <motion.button
                  key={opt.value}
                  type="button"
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setStatusFilter(opt.value)}
                  className="relative rounded-full px-3.5 py-1.5 text-xs font-semibold"
                >
                  {active && (
                    <motion.span
                      layoutId="piutang-filter-pill"
                      transition={{ type: "spring", stiffness: 420, damping: 32 }}
                      className="absolute inset-0 rounded-full bg-primary shadow-sm"
                    />
                  )}
                  <span
                    className={`relative flex items-center gap-1.5 transition-colors ${
                      active ? "text-white" : "text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    <OptIcon size={12} />
                    {opt.label}
                    <span
                      className={`rounded-full px-1.5 text-[10px] ${
                        active ? "bg-white/20" : "bg-background-hover"
                      }`}
                    >
                      {opt.count}
                    </span>
                  </span>
                </motion.button>
              );
            })}
          </div>

          <div className="relative mt-auto flex flex-wrap items-center gap-2 border-t border-border pt-4 text-[11px]">
            <span className="flex items-center gap-1.5 rounded-full bg-background-hover px-2.5 py-1 font-semibold text-text-secondary">
              <Wallet size={12} className="text-primary" />
              Rata-rata pinjaman{" "}
              {formatCurrency(
                stats.totalPiutang > 0 ? stats.totalDipinjamkan / stats.totalPiutang : 0,
              )}
            </span>
            <span className="flex items-center gap-1.5 rounded-full bg-background-hover px-2.5 py-1 font-semibold text-text-secondary">
              <TrendingUp size={12} className="text-primary" />
              Kesehatan portofolio: {stats.kesehatanLabel}
            </span>
            <span className="flex items-center gap-1.5 rounded-full bg-background-hover px-2.5 py-1 font-semibold text-text-secondary">
              <Coins size={12} className="text-primary" />
              Angsuran terkumpul {formatCurrency(stats.totalAngsuranTerkumpul)}
            </span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="relative overflow-hidden rounded-3xl bg-background-card p-5 shadow-soft"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.04] bg-[radial-gradient(circle,rgba(17,32,240,0.9)_1px,transparent_1px)] bg-size-[14px_14px]"
          />
          <div className="relative mb-3 flex items-center gap-2.5">
            <motion.span
              initial={{ scale: 0.6, opacity: 0, rotate: -15 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-primary to-primary-dark text-white shadow-sm"
            >
              <FileText size={18} />
            </motion.span>
            <div>
              <p className="text-sm font-bold text-text-primary">Unduh Laporan PDF</p>
              <p className="text-[11px] text-text-secondary">
                Ekspor rekap piutang ke file .pdf sesuai periode
              </p>
            </div>
          </div>
          <div className="relative grid grid-cols-3 gap-2">
            {DOWNLOAD_OPTIONS.map((opt) => {
              const isLoading = downloadingPeriod === opt.key;
              return (
                <motion.button
                  key={opt.key}
                  type="button"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  disabled={downloadingPeriod !== null}
                  onClick={() => handleExport(opt.key)}
                  className={`flex flex-col items-center gap-1 rounded-xl bg-linear-to-br px-2 py-3 text-center text-white shadow-sm transition-opacity disabled:cursor-not-allowed ${
                    opt.gradient
                  } ${downloadingPeriod && !isLoading ? "opacity-50" : ""}`}
                >
                  {isLoading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <opt.icon size={16} />
                  )}
                  <span className="text-[11px] font-bold">{opt.label}</span>
                  <span className="text-[9px] leading-tight text-white/75">{opt.caption}</span>
                </motion.button>
              );
            })}
          </div>
          <p className="relative mt-3 flex items-center gap-1.5 text-[10px] text-text-muted">
            <Download size={11} className="shrink-0 text-primary" />
            Klik salah satu periode untuk langsung mengunduh file-nya
          </p>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="overflow-hidden rounded-3xl bg-background-card shadow-soft"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-background-hover">
              <tr>
                <th className="px-4 py-3 text-xs font-bold tracking-wide text-text-muted uppercase">
                  No
                </th>
                <th className="px-4 py-3 text-xs font-bold tracking-wide text-text-muted uppercase">
                  Nama Debitur
                </th>
                <th className="px-4 py-3 text-xs font-bold tracking-wide text-text-muted uppercase">
                  Jenis
                </th>
                <th className="px-4 py-3 text-xs font-bold tracking-wide text-text-muted uppercase">
                  Pinjaman Ke
                </th>
                <th className="px-4 py-3 text-xs font-bold tracking-wide text-text-muted uppercase">
                  Jumlah Pinjaman
                </th>
                <th className="px-4 py-3 text-xs font-bold tracking-wide text-text-muted uppercase">
                  Total Angsuran
                </th>
                <th className="px-4 py-3 text-xs font-bold tracking-wide text-text-muted uppercase">
                  Jasa Anggota
                </th>
                <th className="px-4 py-3 text-xs font-bold tracking-wide text-text-muted uppercase">
                  Provisi/Adm
                </th>
                <th className="px-4 py-3 text-xs font-bold tracking-wide text-text-muted uppercase">
                  Saldo
                </th>
                <th className="px-4 py-3 text-xs font-bold tracking-wide text-text-muted uppercase">
                  Aksi
                </th>
              </tr>
            </thead>
            <motion.tbody initial="hidden" animate="visible" variants={listVariants}>
              {loading ? (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-2 text-text-secondary">
                      <Loader2 size={22} className="animate-spin text-primary" />
                      Memuat data piutang...
                    </div>
                  </td>
                </tr>
              ) : displayList.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-2 text-text-secondary">
                      <Landmark size={26} className="text-text-muted" />
                      Tidak ada data piutang
                    </div>
                  </td>
                </tr>
              ) : (
                numberedDisplayList.map((item) => {
                  const lunas = item.status === "lunas";
                  const sudahBayar = lunas || item.sudahBayarBulanIni;
                  const JenisIcon = item.jenisPiutang === "bulanan" ? CalendarClock : Repeat;
                  const pinjamanKeLabel =
                    item.jenisPiutang === "bulanan"
                      ? `Ke-${toRomanNumeral(item.pinjamanKe)}`
                      : "Berkala";
                  return (
                    <motion.tr
                      key={item.id}
                      variants={rowVariants}
                      className="border-b border-border transition-colors last:border-0 hover:bg-background-hover"
                    >
                      <td className="px-4 py-3 text-text-secondary">{item.displayNo ?? ""}</td>
                      <td className="px-4 py-3">
                        {item.sameDebiturAsAbove ? (
                          <div className="flex items-center gap-2.5 pl-1">
                            <span className="h-9 w-9 shrink-0" />
                          </div>
                        ) : (
                          <div className="flex items-center gap-2.5">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                              {item.nama.slice(0, 2).toUpperCase()}
                            </span>
                            <div className="min-w-0">
                              <p className="truncate font-medium text-text-primary">{item.nama}</p>
                              <p className="font-mono text-xs text-text-muted">
                                {item.noRekening}
                              </p>
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                          <JenisIcon size={11} />
                          {JENIS_PIUTANG_LABEL[item.jenisPiutang]}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-text-primary">
                        {pinjamanKeLabel}
                      </td>
                      <td className="px-4 py-3 text-text-primary">
                        {formatCurrency(item.jumlahPinjaman)}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => openHistory(item)}
                          className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-xs font-semibold text-success transition-colors hover:bg-success/20"
                          title="Lihat riwayat angsuran"
                        >
                          {formatCurrency(item.totalAngsuran)}
                          <History size={11} />
                        </button>
                      </td>
                      <td className="px-4 py-3 text-text-secondary">
                        {formatCurrency(item.jasaAnggotaTotal)}
                      </td>
                      <td className="px-4 py-3 text-text-secondary">
                        {formatCurrency(item.provisiAdm)}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-bold text-text-primary">
                          {formatCurrency(item.saldo)}
                        </p>
                        {lunas ? (
                          <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-bold text-success">
                            <CheckCircle2 size={9} />
                            Lunas
                          </span>
                        ) : (
                          <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-warning/15 px-2 py-0.5 text-[10px] font-bold text-warning">
                            <Clock size={9} />
                            Cicilan {item.jumlahAngsuranTerbayar}/{item.tenor}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.92 }}
                          onClick={() => openAngsuran(item)}
                          title={sudahBayar ? "Lihat kwitansi" : "Bayar angsuran"}
                          className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold text-white shadow-sm transition-colors ${
                            sudahBayar
                              ? "bg-success hover:bg-success/90"
                              : "bg-danger hover:bg-danger/90"
                          }`}
                        >
                          {sudahBayar ? <Receipt size={12} /> : <Banknote size={12} />}
                          {sudahBayar ? "Kwitansi" : "Bayar Angsuran"}
                        </motion.button>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </motion.tbody>
          </table>
        </div>
      </motion.div>

      {/* Modal Tambah Piutang */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeAddModal}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="scrollbar-hide relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-background-card p-6 shadow-soft"
            >
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-[0.03] bg-[radial-gradient(circle,rgba(17,32,240,0.9)_1px,transparent_1px)] bg-size-[18px_18px]"
              />
              <div
                aria-hidden
                className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-primary/10 blur-3xl"
              />

              <div className="relative mb-4 flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <motion.span
                    initial={{ scale: 0.6, opacity: 0, rotate: -15 }}
                    animate={{ scale: 1, opacity: 1, rotate: 0 }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-primary to-primary-dark text-white shadow-sm"
                  >
                    <Landmark size={20} />
                  </motion.span>
                  <div>
                    <h2 className="text-lg font-bold text-text-primary">Tambah Piutang</h2>
                    <p className="flex items-center gap-1 text-xs text-text-secondary">
                      <Sparkles size={11} className="text-primary" />
                      Catat pinjaman baru untuk anggota
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={closeAddModal}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-background-hover hover:text-text-primary"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="relative mb-4">
                <InformasiRekeningCard
                  noRekening={noRekening}
                  onNoRekeningChange={setNoRekening}
                  onSubmit={handleSearch}
                  searching={searching}
                  nasabah={nasabah}
                  suggestions={suggestions}
                  suggestionsLoading={suggestionsLoading}
                  onSelectSuggestion={selectSuggestion}
                />
              </div>

              <fieldset
                disabled={!nasabah}
                className="relative flex flex-col gap-4 disabled:opacity-50"
              >
                {!nasabah && (
                  <div className="flex items-center gap-2 rounded-xl bg-warning/10 px-3 py-2 text-xs font-semibold text-warning">
                    <AlertCircle size={13} className="shrink-0" />
                    Cari &amp; pilih data nasabah terlebih dahulu.
                  </div>
                )}

                {nasabah && (
                  <div className="rounded-xl bg-primary/5 px-3 py-2 text-[11px] text-primary">
                    Pinjaman ini akan tercatat sebagai pinjaman ke-
                    {ringkasan.filter((r) => r.nasabahId === nasabah.id).length + 1} untuk{" "}
                    {nasabah.nama}
                  </div>
                )}

                <form onSubmit={submitAdd} className="flex flex-col gap-4">
                  <div>
                    <label className={labelClass}>Jenis Piutang</label>
                    <div className="grid grid-cols-2 gap-2">
                      {JENIS_PIUTANG_OPTIONS.map((opt) => {
                        const OptIcon = opt.icon;
                        const active = jenisPiutang === opt.value;
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setJenisPiutang(opt.value)}
                            className={`flex flex-col items-start gap-1 rounded-xl border-2 px-3 py-2.5 text-left transition-colors ${
                              active
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-primary/40"
                            }`}
                          >
                            <span
                              className={`flex items-center gap-1.5 text-sm font-bold ${
                                active ? "text-primary" : "text-text-primary"
                              }`}
                            >
                              <OptIcon size={14} />
                              {opt.label}
                            </span>
                            <span className="text-[10px] text-text-muted">{opt.caption}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>Jumlah Pinjaman</label>
                    <div className="flex items-center gap-2 rounded-xl border border-border bg-background-hover px-3 py-2.5 transition-colors focus-within:border-primary">
                      <span className="text-sm font-bold text-text-muted">Rp</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        required
                        value={formatDigitsID(jumlahPinjaman)}
                        onChange={(e) => setJumlahPinjaman(e.target.value.replace(/\D/g, ""))}
                        placeholder="0"
                        className="w-full min-w-0 bg-transparent text-sm font-bold text-text-primary focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>Tenor (bulan, maks. {TENOR_MAX})</label>
                    <div className="flex items-center gap-2 rounded-xl border border-border bg-background-hover px-3 py-2.5 transition-colors focus-within:border-primary">
                      <input
                        type="number"
                        inputMode="numeric"
                        required
                        min={1}
                        max={TENOR_MAX}
                        value={tenor}
                        onChange={(e) => setTenor(e.target.value.replace(/\D/g, ""))}
                        placeholder="12"
                        className="w-full min-w-0 bg-transparent text-sm font-bold text-text-primary focus:outline-none"
                      />
                      <span className="shrink-0 text-xs font-bold text-text-muted">bulan</span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {TENOR_QUICK_OPTIONS.map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setTenor(String(t))}
                          className={`rounded-full px-3 py-1 text-[11px] font-semibold transition-colors ${
                            Number(tenor) === t
                              ? "bg-primary text-white"
                              : "bg-primary/10 text-primary hover:bg-primary/20"
                          }`}
                        >
                          {t} bulan
                        </button>
                      ))}
                    </div>
                  </div>

                  {addPreview && (
                    <div className="rounded-2xl bg-primary/5 p-3.5">
                      <p className="mb-2.5 flex items-center gap-1.5 text-xs font-bold text-primary">
                        <Percent size={12} />
                        Preview Perhitungan
                      </p>
                      <div className="space-y-1.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-text-secondary">
                            Jasa Anggota ({addPreview.persentaseJasa}%, flat/bulan)
                          </span>
                          <span className="font-bold text-text-primary">
                            {formatCurrency(addPreview.nominalJasaFlat)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-text-secondary">
                            Provisi/Adm (0.5%, dipotong di awal)
                          </span>
                          <span className="font-bold text-text-primary">
                            {formatCurrency(addPreview.provisiAdm)}
                          </span>
                        </div>
                        {jenisPiutang === "bulanan" ? (
                          <div className="flex items-center justify-between border-t border-primary/15 pt-1.5">
                            <span className="text-text-secondary">
                              Angsuran/bulan (pokok {formatCurrency(addPreview.pokokPerBulan ?? 0)}{" "}
                              + jasa)
                            </span>
                            <span className="font-bold text-primary">
                              {formatCurrency(addPreview.angsuranPerBulan)}
                            </span>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center justify-between border-t border-primary/15 pt-1.5">
                              <span className="text-text-secondary">
                                Bulan 1 s/d {Math.max(1, (Number(tenor) || 1) - 1)} (jasa saja)
                              </span>
                              <span className="font-bold text-primary">
                                {formatCurrency(addPreview.angsuranPerBulan)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-text-secondary">
                                Bulan ke-{tenor || 0} (pelunasan pokok + jasa)
                              </span>
                              <span className="font-bold text-primary">
                                {formatCurrency(addPreview.pelunasanTerakhir ?? 0)}
                              </span>
                            </div>
                          </>
                        )}
                        <div className="flex items-center justify-between border-t border-primary/15 pt-1.5">
                          <span className="font-semibold text-text-secondary">
                            Total dibayar selama masa pinjaman
                          </span>
                          <span className="font-bold text-primary">
                            {formatCurrency(addPreview.totalKeseluruhan)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className={labelClass}>Keterangan (opsional)</label>
                    <input
                      type="text"
                      value={keterangan}
                      onChange={(e) => setKeterangan(e.target.value)}
                      placeholder="Misal: Pinjaman modal usaha..."
                      className={inputClass}
                    />
                  </div>

                  <div className="mt-1 flex items-center justify-end gap-2 border-t border-border pt-4">
                    <button
                      type="button"
                      onClick={closeAddModal}
                      className="rounded-xl px-4 py-2.5 text-sm font-semibold text-text-secondary transition-colors hover:bg-background-hover"
                    >
                      Batal
                    </button>
                    <motion.button
                      type="submit"
                      disabled={adding || !nasabah}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-primary-dark disabled:opacity-60"
                    >
                      {adding && (
                        <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      )}
                      Simpan Piutang
                    </motion.button>
                  </div>
                </form>
              </fieldset>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Angsuran */}
      <AnimatePresence>
        {angsuranTarget &&
          (() => {
            const showingReceipt = receipt !== null;
            return (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={closeAngsuranModal}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 8 }}
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  onClick={(e) => e.stopPropagation()}
                  className="relative w-full max-w-sm overflow-hidden rounded-3xl bg-background-card p-6 shadow-soft"
                >
                  {showingReceipt ? (
                    <div
                      aria-hidden
                      className="pointer-events-none absolute inset-0 opacity-[0.03] bg-[radial-gradient(circle,rgba(34,197,94,0.9)_1px,transparent_1px)] bg-size-[18px_18px]"
                    />
                  ) : (
                    <div
                      aria-hidden
                      className="pointer-events-none absolute inset-0 opacity-[0.03] bg-[radial-gradient(circle,rgba(248,113,113,0.9)_1px,transparent_1px)] bg-size-[18px_18px]"
                    />
                  )}
                  <div
                    aria-hidden
                    className={`pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full blur-3xl ${
                      showingReceipt ? "bg-success/10" : "bg-danger/10"
                    }`}
                  />

                  <div className="relative mb-4 flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <motion.span
                        key={showingReceipt ? "receipt-icon" : "pay-icon"}
                        initial={{ scale: 0.6, opacity: 0, rotate: -15 }}
                        animate={{ scale: 1, opacity: 1, rotate: 0 }}
                        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white shadow-sm ${
                          showingReceipt ? "bg-success" : "bg-danger"
                        }`}
                      >
                        {showingReceipt ? <Receipt size={20} /> : <Banknote size={20} />}
                      </motion.span>
                      <div>
                        <h2 className="text-lg font-bold text-text-primary">
                          {showingReceipt ? "Kwitansi Pembayaran" : "Bayar Angsuran"}
                        </h2>
                        <p className="flex items-center gap-1 text-xs text-text-secondary">
                          Piutang {JENIS_PIUTANG_LABEL[angsuranTarget.jenisPiutang]} &middot; Tenor{" "}
                          {angsuranTarget.tenor} bulan
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={closeAngsuranModal}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-background-hover hover:text-text-primary"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <div className="relative mb-4 flex items-center gap-2.5 rounded-2xl bg-background-hover p-3">
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                        showingReceipt ? "bg-success/10 text-success" : "bg-danger/10 text-danger"
                      }`}
                    >
                      {angsuranTarget.nama.slice(0, 2).toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-text-primary">
                        {angsuranTarget.nama}
                      </p>
                      <p className="font-mono text-[11px] text-text-muted">
                        {angsuranTarget.noRekening}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-[10px] text-text-muted">Sisa Saldo</p>
                      <p className="text-xs font-bold text-warning">
                        {formatCurrency(angsuranTarget.saldo)}
                      </p>
                    </div>
                  </div>

                  {showingReceipt && receipt ? (
                    <div className="relative flex flex-col gap-4">
                      <div className="overflow-hidden rounded-2xl bg-success p-4 text-center text-white">
                        <p className="text-xs text-white/80">
                          Angsuran Bulan ke-{receipt.bulanKe} dari {angsuranTarget.tenor}
                        </p>
                        <p className="mt-1 flex items-center justify-center gap-1.5 text-[11px] font-semibold text-white/90">
                          <Coins size={12} />
                          {JENIS_PEMBAYARAN_LABEL[receipt.jenisPembayaran]}
                        </p>
                        <p className="mt-2 text-2xl font-bold">
                          {formatCurrency(receipt.nominal)}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-background-hover p-3.5">
                        <p className="mb-2 flex items-center gap-1.5 text-xs font-bold text-text-primary">
                          <Receipt size={12} className="text-success" />
                          Detail Kwitansi
                        </p>
                        <div className="space-y-1.5 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-text-secondary">No. Kwitansi</span>
                            <span className="font-mono font-semibold text-text-primary">
                              {receipt.id.slice(0, 8).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-text-secondary">Tanggal Bayar</span>
                            <span className="font-semibold text-text-primary">
                              {formatDateID(receipt.tanggalBayar)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-text-secondary">Petugas</span>
                            <span className="font-semibold text-text-primary">
                              {receipt.processedBy}
                            </span>
                          </div>
                          <div className="flex items-center justify-between border-t border-border pt-1.5">
                            <span className="font-semibold text-text-secondary">Total Dibayar</span>
                            <span className="font-bold text-success">
                              {formatCurrency(receipt.nominal)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-1 flex items-center justify-end border-t border-border pt-4">
                        <motion.button
                          type="button"
                          onClick={closeAngsuranModal}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.97 }}
                          className="flex items-center gap-2 rounded-xl bg-success px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-success/90"
                        >
                          <CheckCircle2 size={16} />
                          Tutup
                        </motion.button>
                      </div>
                    </div>
                  ) : angsuranTarget.nextAngsuran ? (
                    <div className="relative flex flex-col gap-4">
                      <div className="overflow-hidden rounded-2xl bg-danger p-4 text-center text-white">
                        <p className="text-xs text-white/80">
                          Angsuran Bulan ke-{angsuranTarget.nextAngsuran.bulanKe} dari{" "}
                          {angsuranTarget.tenor}
                        </p>
                        <p className="mt-1 flex items-center justify-center gap-1.5 text-[11px] font-semibold text-white/90">
                          <Coins size={12} />
                          {JENIS_PEMBAYARAN_LABEL[angsuranTarget.nextAngsuran.jenisPembayaran]}
                        </p>
                        <p className="mt-2 text-2xl font-bold">
                          {formatCurrency(angsuranTarget.nextAngsuran.nominal)}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-background-hover p-3.5">
                        <p className="mb-2 flex items-center gap-1.5 text-xs font-bold text-text-primary">
                          <Coins size={12} className="text-danger" />
                          Rincian Pembayaran
                        </p>
                        <div className="space-y-1.5 text-xs">
                          {angsuranTarget.nextAngsuran.jenisPembayaran === "pokok_dan_jasa" && (
                            <div className="flex items-center justify-between">
                              <span className="text-text-secondary">Angsuran Pokok</span>
                              <span className="font-semibold text-text-primary">
                                {formatCurrency(
                                  angsuranTarget.nominalAngsuranPokokPerBulan ?? 0,
                                )}
                              </span>
                            </div>
                          )}
                          {angsuranTarget.nextAngsuran.jenisPembayaran === "pelunasan" && (
                            <div className="flex items-center justify-between">
                              <span className="text-text-secondary">Pelunasan Pokok</span>
                              <span className="font-semibold text-text-primary">
                                {formatCurrency(angsuranTarget.jumlahPinjaman)}
                              </span>
                            </div>
                          )}
                          <div className="flex items-center justify-between">
                            <span className="text-text-secondary">Jasa Anggota</span>
                            <span className="font-semibold text-text-primary">
                              {formatCurrency(angsuranTarget.nominalJasaFlat)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between border-t border-border pt-1.5">
                            <span className="font-semibold text-text-secondary">Total Dibayar</span>
                            <span className="font-bold text-danger">
                              {formatCurrency(angsuranTarget.nextAngsuran.nominal)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <p className="flex items-start gap-1.5 rounded-xl bg-background-hover px-3 py-2 text-[11px] text-text-muted">
                        <AlertCircle size={13} className="mt-0.5 shrink-0" />
                        Nominal ditentukan otomatis oleh sistem sesuai jenis piutang dan urutan
                        bulan berjalan, tidak dapat diubah manual.
                      </p>

                      <div className="mt-1 flex items-center justify-end gap-2 border-t border-border pt-4">
                        <button
                          type="button"
                          onClick={closeAngsuranModal}
                          className="rounded-xl px-4 py-2.5 text-sm font-semibold text-text-secondary transition-colors hover:bg-background-hover"
                        >
                          Batal
                        </button>
                        <motion.button
                          type="button"
                          onClick={submitAngsuran}
                          disabled={angsuranSaving}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.97 }}
                          className="flex items-center gap-2 rounded-xl bg-danger px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-danger/90 disabled:opacity-60"
                        >
                          {angsuranSaving && (
                            <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          )}
                          Konfirmasi Pembayaran
                        </motion.button>
                      </div>
                    </div>
                  ) : (
                    <p className="relative flex items-center gap-1.5 rounded-xl bg-success/10 px-3 py-2.5 text-xs text-success">
                      <CheckCircle2 size={14} className="shrink-0" />
                      Piutang ini sudah lunas, tidak ada angsuran berikutnya.
                    </p>
                  )}
                </motion.div>
              </motion.div>
            );
          })()}
      </AnimatePresence>

      {/* Modal Riwayat Angsuran */}
      <AnimatePresence>
        {historyTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setHistoryTarget(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="scrollbar-hide relative max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-background-card p-6 shadow-soft"
            >
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-[0.03] bg-[radial-gradient(circle,rgba(17,32,240,0.9)_1px,transparent_1px)] bg-size-[18px_18px]"
              />
              <div
                aria-hidden
                className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-primary/10 blur-3xl"
              />

              <div className="relative mb-4 flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <motion.span
                    initial={{ scale: 0.6, opacity: 0, rotate: -15 }}
                    animate={{ scale: 1, opacity: 1, rotate: 0 }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary"
                  >
                    <History size={20} />
                  </motion.span>
                  <div>
                    <h2 className="text-lg font-bold text-text-primary">Riwayat Angsuran</h2>
                    <p className="truncate text-xs text-text-secondary">
                      {historyTarget.nama} &middot; Piutang{" "}
                      {JENIS_PIUTANG_LABEL[historyTarget.jenisPiutang]}{" "}
                      {historyTarget.jenisPiutang === "bulanan"
                        ? `Ke-${toRomanNumeral(historyTarget.pinjamanKe)}`
                        : ""}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setHistoryTarget(null)}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-background-hover hover:text-text-primary"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="relative mb-5 grid grid-cols-3 gap-2.5">
                <div className="rounded-xl bg-primary/10 p-3 text-center">
                  <p className="truncate text-sm font-bold text-text-primary">
                    {formatCurrency(historyTarget.jumlahPinjaman)}
                  </p>
                  <p className="mt-0.5 truncate text-[10px] text-text-muted">Pokok Pinjaman</p>
                </div>
                <div className="rounded-xl bg-success/10 p-3 text-center">
                  <p className="truncate text-sm font-bold text-text-primary">
                    {formatCurrency(historyTarget.totalAngsuran)}
                  </p>
                  <p className="mt-0.5 truncate text-[10px] text-text-muted">Total Angsuran</p>
                </div>
                <div className="rounded-xl bg-warning/10 p-3 text-center">
                  <p className="truncate text-sm font-bold text-text-primary">
                    {formatCurrency(historyTarget.saldo)}
                  </p>
                  <p className="mt-0.5 truncate text-[10px] text-text-muted">Sisa Saldo</p>
                </div>
              </div>

              {historyLoading ? (
                <div className="relative flex flex-col items-center gap-2 py-10 text-text-secondary">
                  <Loader2 size={22} className="animate-spin text-primary" />
                  Memuat riwayat...
                </div>
              ) : historyList.length === 0 ? (
                <div className="relative flex flex-col items-center gap-2 py-10 text-center text-text-secondary">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-background-hover">
                    <Coins size={20} className="text-text-muted" />
                  </span>
                  <p className="text-sm font-semibold">Belum ada angsuran</p>
                  <p className="text-[11px] text-text-muted">
                    Riwayat akan muncul di sini setelah angsuran pertama dicatat
                  </p>
                </div>
              ) : (
                <div className="relative overflow-hidden rounded-2xl border border-border">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="border-b border-border bg-background-hover">
                        <tr>
                          <th className="px-3 py-2.5 font-bold tracking-wide text-text-muted uppercase">
                            No
                          </th>
                          <th className="px-3 py-2.5 font-bold tracking-wide text-text-muted uppercase">
                            Bulan Ke
                          </th>
                          <th className="px-3 py-2.5 font-bold tracking-wide text-text-muted uppercase">
                            Jenis Pembayaran
                          </th>
                          <th className="px-3 py-2.5 font-bold tracking-wide text-text-muted uppercase">
                            Nominal
                          </th>
                          <th className="px-3 py-2.5 font-bold tracking-wide text-text-muted uppercase">
                            Tanggal
                          </th>
                          <th className="px-3 py-2.5 font-bold tracking-wide text-text-muted uppercase">
                            Petugas
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...historyList]
                          .sort((a, b) => a.bulanKe - b.bulanKe)
                          .map((h, i, sorted) => {
                            const terbaru = i === sorted.length - 1;
                            return (
                              <tr
                                key={h.id}
                                className={`border-b border-border last:border-0 ${
                                  terbaru ? "bg-success/5" : ""
                                }`}
                              >
                                <td className="px-3 py-2.5 text-text-secondary">{i + 1}</td>
                                <td className="px-3 py-2.5 font-semibold text-text-primary">
                                  {h.bulanKe}
                                  {terbaru && (
                                    <span className="ml-1.5 rounded-full bg-success/15 px-1.5 py-0.5 text-[9px] font-bold text-success">
                                      Terbaru
                                    </span>
                                  )}
                                </td>
                                <td className="px-3 py-2.5 text-text-secondary">
                                  {JENIS_PEMBAYARAN_LABEL[h.jenisPembayaran]}
                                </td>
                                <td className="px-3 py-2.5 font-bold text-text-primary">
                                  {formatCurrency(h.nominal)}
                                </td>
                                <td className="px-3 py-2.5 text-text-secondary">
                                  {formatDateID(h.tanggalBayar)}
                                </td>
                                <td className="px-3 py-2.5 text-text-secondary">
                                  {h.processedBy}
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </Layout>
  );
}
