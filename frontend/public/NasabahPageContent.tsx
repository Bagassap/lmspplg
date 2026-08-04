"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import toast from "react-hot-toast";
import {
  AlertTriangle,
  ArrowUpDown,
  BookUser,
  Briefcase,
  Cake,
  Calendar,
  CheckCircle2,
  CreditCard,
  Download,
  Eye,
  Filter,
  GraduationCap,
  Hash,
  Loader2,
  MapPin,
  Pencil,
  Phone,
  School,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  TrendingUp,
  UserCircle2,
  UserPlus,
  Users,
  Wallet,
  X,
  XCircle,
} from "lucide-react";
import Layout from "@/components/Layout";
import { AnimatedCurrency } from "@/components/dashboard/AnimatedCurrency";
import api from "@/lib/api";
import { getErrorMessage } from "@/lib/error";
import { formatCurrency, formatDate } from "@/lib/format";
import type {
  JenisKelamin,
  JenisNasabah,
  Nasabah,
  StatusNasabah,
} from "@/lib/types";

interface AddForm {
  nama: string;
  jenisNasabah: JenisNasabah;
  nis: string;
  kelas: string;
  jurusan: string;
  nip: string;
  jabatan: string;
  alamat: string;
  tahunAngkatan: string;
  noTelepon: string;
  jenisKelamin: JenisKelamin | "";
  tanggalLahir: string;
}

const initialAddForm: AddForm = {
  nama: "",
  jenisNasabah: "siswa",
  nis: "",
  kelas: "",
  jurusan: "",
  nip: "",
  jabatan: "",
  alamat: "",
  tahunAngkatan: "",
  noTelepon: "",
  jenisKelamin: "",
  tanggalLahir: "",
};

interface EditForm {
  nama: string;
  jenisNasabah: JenisNasabah;
  nis: string;
  kelas: string;
  jurusan: string;
  nip: string;
  jabatan: string;
  alamat: string;
  tahunAngkatan: string;
  noTelepon: string;
  jenisKelamin: JenisKelamin | "";
  status: StatusNasabah;
}

function toEditForm(nasabah: Nasabah): EditForm {
  return {
    nama: nasabah.nama,
    jenisNasabah: nasabah.jenisNasabah,
    nis: nasabah.nis ?? "",
    kelas: nasabah.kelas ?? "",
    jurusan: nasabah.jurusan ?? "",
    nip: nasabah.nip ?? "",
    jabatan: nasabah.jabatan ?? "",
    alamat: nasabah.alamat ?? "",
    tahunAngkatan: nasabah.tahunAngkatan ?? "",
    noTelepon: nasabah.noTelepon ?? "",
    jenisKelamin: nasabah.jenisKelamin ?? "",
    status: nasabah.status,
  };
}

const jenisLabel: Record<JenisNasabah, string> = {
  siswa: "Siswa",
  guru: "Guru",
  umum: "Umum",
  kelas: "Kelas",
};

const JENIS_COLOR: Record<JenisNasabah, string> = {
  siswa: "#1120f0",
  guru: "#f59e0b",
  umum: "#10b981",
  kelas: "#8b5cf6",
};

const JENIS_ICON: Record<JenisNasabah, typeof GraduationCap> = {
  siswa: GraduationCap,
  guru: BookUser,
  umum: Users,
  kelas: School,
};

const HEALTH_TIER_META: Record<
  "success" | "warning" | "danger",
  {
    color: string;
    bg: string;
    text: string;
    label: string;
    icon: typeof CheckCircle2;
  }
> = {
  success: {
    color: "#10b981",
    bg: "bg-success/10",
    text: "text-success",
    label: "Kondisi Sangat Baik",
    icon: CheckCircle2,
  },
  warning: {
    color: "#f59e0b",
    bg: "bg-warning/10",
    text: "text-warning",
    label: "Perlu Perhatian",
    icon: AlertTriangle,
  },
  danger: {
    color: "#f87171",
    bg: "bg-danger/10",
    text: "text-danger",
    label: "Kondisi Kritis",
    icon: XCircle,
  },
};

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

type Tab = "sekolah" | "umum";

function completeness(n: Nasabah): number {
  const isKelas = n.jenisNasabah === "kelas";
  const fields: (string | null | undefined)[] = [
    isKelas ? n.tahunAngkatan : n.alamat,
    n.noTelepon,
    n.jenisKelamin,
    n.tanggalLahir,
  ];
  if (n.jenisNasabah === "siswa") fields.push(n.nis, n.kelas, n.jurusan);
  else if (n.jenisNasabah === "guru") fields.push(n.nip, n.jabatan);
  const filled = fields.filter((f) => f && String(f).trim() !== "").length;
  return Math.round((filled / fields.length) * 100);
}

function missingFields(n: Nasabah): { key: string; label: string }[] {
  const isKelas = n.jenisNasabah === "kelas";
  const base: { key: string; label: string; value: string | null | undefined }[] = [
    isKelas
      ? { key: "tahunAngkatan", label: "Tahun Angkatan", value: n.tahunAngkatan }
      : { key: "alamat", label: "Alamat", value: n.alamat },
    { key: "noTelepon", label: "No Telepon", value: n.noTelepon },
    { key: "jenisKelamin", label: "Jenis Kelamin", value: n.jenisKelamin },
    { key: "tanggalLahir", label: "Tanggal Lahir", value: n.tanggalLahir },
  ];
  if (n.jenisNasabah === "siswa") {
    base.push(
      { key: "nis", label: "NIS", value: n.nis },
      { key: "kelas", label: "Kelas", value: n.kelas },
      { key: "jurusan", label: "Jurusan", value: n.jurusan },
    );
  } else if (n.jenisNasabah === "guru") {
    base.push(
      { key: "nip", label: "NIP", value: n.nip },
      { key: "jabatan", label: "Jabatan", value: n.jabatan },
    );
  }
  return base.filter((f) => !f.value || String(f.value).trim() === "");
}

function ViewField({
  icon: Icon,
  label,
  value,
  mono,
  className,
}: {
  icon: typeof Hash;
  label: string;
  value: string;
  mono?: boolean;
  className?: string;
}) {
  return (
    <div className={`min-w-0 ${className ?? ""}`}>
      <p className="flex items-center gap-1 text-[10px] font-semibold tracking-wide text-text-muted uppercase">
        <Icon size={10} />
        {label}
      </p>
      <p
        className={`mt-0.5 truncate text-xs font-semibold text-text-primary ${
          mono ? "font-mono" : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function FieldLabel({
  icon: Icon,
  children,
}: {
  icon: typeof Hash;
  children: ReactNode;
}) {
  return (
    <label className={labelClass}>
      <span className="flex items-center gap-1.5">
        <Icon size={12} className="text-primary" />
        {children}
      </span>
    </label>
  );
}

function ProgressRing({ percent }: { percent: number }) {
  const size = 32;
  const radius = (size - 4) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;
  const color =
    percent >= 70 ? "#10b981" : percent >= 40 ? "#f59e0b" : "#f87171";
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#e5e7eb"
          strokeWidth={3}
          fill="none"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={3}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-text-primary">
        {percent}%
      </span>
    </div>
  );
}

export function NasabahPageContent() {
  const [activeTab, setActiveTab] = useState<Tab>("sekolah");
  const [nasabahList, setNasabahList] = useState<Nasabah[]>([]);
  const [loading, setLoading] = useState(true);
  const [jenisFilter, setJenisFilter] = useState<JenisNasabah | "">("");
  const [statusFilter, setStatusFilter] = useState<StatusNasabah | "">("");
  const [sortBy, setSortBy] = useState<"terbaru" | "nama" | "saldo">("terbaru");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<Nasabah | null>(null);
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [viewing, setViewing] = useState<Nasabah | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState<AddForm>(initialAddForm);
  const [addSaving, setAddSaving] = useState(false);

  async function loadNasabah() {
    setLoading(true);
    try {
      const effectiveJenis =
        activeTab === "umum" ? "umum" : jenisFilter || undefined;
      const { data } = await api.get<Nasabah[]>("/nasabah", {
        params: {
          jenis: effectiveJenis,
          search: search || undefined,
        },
      });
      const scoped =
        activeTab === "sekolah" && !jenisFilter
          ? data.filter((n) => n.jenisNasabah !== "umum")
          : data;
      setNasabahList(scoped);
    } catch (error) {
      toast.error(getErrorMessage(error, "Gagal memuat data nasabah"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const initialSearch = params.get("search");
    if (initialSearch) setSearch(initialSearch);
    const initialJenis = params.get("jenis");
    if (initialJenis === "siswa" || initialJenis === "guru" || initialJenis === "kelas") {
      setActiveTab("sekolah");
      setJenisFilter(initialJenis);
    } else if (initialJenis === "umum") {
      setActiveTab("umum");
    }
    if (params.get("tambah") === "1") {
      setAddForm(initialAddForm);
      setShowAddModal(true);
    }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      loadNasabah();
      setSelected(new Set());
    }, 300);
    return () => clearTimeout(timeout);
  }, [activeTab, jenisFilter, search]);

  const displayList = useMemo(() => {
    const filtered = statusFilter
      ? nasabahList.filter((n) => n.status === statusFilter)
      : nasabahList;
    return [...filtered].sort((a, b) => {
      if (sortBy === "nama") return a.nama.localeCompare(b.nama);
      if (sortBy === "saldo") return Number(b.saldo) - Number(a.saldo);
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [nasabahList, statusFilter, sortBy]);

  const totalCount = displayList.length;
  const aktifCount = displayList.filter((n) => n.status === "aktif").length;
  const aktifPercent = totalCount > 0 ? Math.round((aktifCount / totalCount) * 100) : 0;
  const totalSaldoTab = displayList.reduce((sum, n) => sum + Number(n.saldo), 0);
  const rataSaldoTab = totalCount > 0 ? totalSaldoTab / totalCount : 0;

  const allSelected = displayList.length > 0 && displayList.every((n) => selected.has(n.id));

  const aktifTier: "success" | "warning" | "danger" =
    aktifPercent >= 70 ? "success" : aktifPercent >= 40 ? "warning" : "danger";
  const aktifMeta = HEALTH_TIER_META[aktifTier];

  const statusCounts = useMemo(() => {
    const counts = { aktif: 0, nonaktif: 0 };
    nasabahList.forEach((n) => {
      if (n.status === "aktif") counts.aktif += 1;
      else counts.nonaktif += 1;
    });
    return counts;
  }, [nasabahList]);

  const JenisFilterIcon = jenisFilter ? JENIS_ICON[jenisFilter] : null;

  function toggleSelectAll() {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(displayList.map((n) => n.id)));
    }
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function switchTab(tab: Tab) {
    setActiveTab(tab);
    setJenisFilter("");
    setSelected(new Set());
  }

  function clearFilters() {
    setJenisFilter("");
    setStatusFilter("");
  }

  function exportCsv() {
    const rows = [
      ["No Rekening", "Nama", "Jenis", "Saldo", "Status", "Terdaftar"],
      ...displayList.map((n) => [
        n.noRekening,
        n.nama,
        jenisLabel[n.jenisNasabah],
        String(n.saldo),
        n.status,
        n.createdAt,
      ]),
    ];
    const csv = rows
      .map((row) =>
        row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","),
      )
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nasabah-${activeTab}-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleBulkDelete() {
    if (!confirm(`Hapus ${selected.size} nasabah terpilih?`)) return;
    const results = await Promise.allSettled(
      Array.from(selected).map((id) => api.delete(`/nasabah/${id}`)),
    );
    const failed = results.filter((r) => r.status === "rejected").length;
    if (failed > 0) {
      toast.error(`${failed} nasabah gagal dihapus`);
    } else {
      toast.success("Nasabah terpilih berhasil dihapus");
    }
    setSelected(new Set());
    loadNasabah();
  }

  function openEdit(nasabah: Nasabah) {
    setEditing(nasabah);
    setEditForm(toEditForm(nasabah));
  }

  function closeEdit() {
    setEditing(null);
    setEditForm(null);
  }

  function openView(nasabah: Nasabah) {
    setViewing(nasabah);
  }

  function closeView() {
    setViewing(null);
  }

  function openAdd() {
    setAddForm(initialAddForm);
    setShowAddModal(true);
  }

  function closeAdd() {
    setShowAddModal(false);
  }

  async function handleAddSubmit(e: React.FormEvent) {
    e.preventDefault();
    setAddSaving(true);
    try {
      await api.post("/nasabah", {
        nama: addForm.nama,
        jenisNasabah: addForm.jenisNasabah,
        nis: addForm.jenisNasabah === "siswa" ? addForm.nis || undefined : undefined,
        kelas:
          addForm.jenisNasabah === "siswa" ? addForm.kelas || undefined : undefined,
        jurusan:
          addForm.jenisNasabah === "siswa"
            ? addForm.jurusan || undefined
            : undefined,
        nip: addForm.jenisNasabah === "guru" ? addForm.nip || undefined : undefined,
        jabatan:
          addForm.jenisNasabah === "guru" ? addForm.jabatan || undefined : undefined,
        alamat: addForm.jenisNasabah === "kelas" ? undefined : addForm.alamat || undefined,
        tahunAngkatan:
          addForm.jenisNasabah === "kelas" ? addForm.tahunAngkatan || undefined : undefined,
        noTelepon: addForm.noTelepon || undefined,
        jenisKelamin: addForm.jenisKelamin || undefined,
        tanggalLahir: addForm.tanggalLahir || undefined,
      });
      toast.success("Nasabah berhasil ditambahkan");
      closeAdd();
      loadNasabah();
    } catch (error) {
      toast.error(getErrorMessage(error, "Gagal menambahkan nasabah"));
    } finally {
      setAddSaving(false);
    }
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editing || !editForm) return;
    setSaving(true);
    try {
      await api.patch(`/nasabah/${editing.id}`, {
        nama: editForm.nama,
        jenisNasabah: editForm.jenisNasabah,
        nis: editForm.jenisNasabah === "siswa" ? editForm.nis : undefined,
        kelas: editForm.jenisNasabah === "siswa" ? editForm.kelas : undefined,
        jurusan:
          editForm.jenisNasabah === "siswa" ? editForm.jurusan : undefined,
        nip: editForm.jenisNasabah === "guru" ? editForm.nip : undefined,
        jabatan:
          editForm.jenisNasabah === "guru" ? editForm.jabatan : undefined,
        alamat: editForm.jenisNasabah === "kelas" ? undefined : editForm.alamat,
        tahunAngkatan:
          editForm.jenisNasabah === "kelas" ? editForm.tahunAngkatan : undefined,
        noTelepon: editForm.noTelepon,
        jenisKelamin: editForm.jenisKelamin || undefined,
        status: editForm.status,
      });
      toast.success("Nasabah berhasil diperbarui");
      closeEdit();
      loadNasabah();
    } catch (error) {
      toast.error(getErrorMessage(error, "Gagal memperbarui nasabah"));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(nasabah: Nasabah) {
    if (!confirm(`Hapus nasabah ${nasabah.nama} (${nasabah.noRekening})?`)) {
      return;
    }
    try {
      await api.delete(`/nasabah/${nasabah.id}`);
      toast.success("Nasabah berhasil dihapus");
      loadNasabah();
    } catch (error) {
      toast.error(getErrorMessage(error, "Gagal menghapus nasabah"));
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
              <Users size={24} />
              <motion.span
                animate={{ opacity: [1, 0.4, 1] }}
                transition={{ duration: 1.6, repeat: Infinity }}
                className="absolute -right-0.5 -bottom-0.5 h-3.5 w-3.5 rounded-full bg-success ring-2 ring-background-card"
              />
            </motion.span>
            <div>
              <p className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                <Sparkles size={12} />
                Manajemen Nasabah
              </p>
              <h1 className="text-2xl font-bold text-text-primary">Nasabah</h1>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-text-secondary">
                <ShieldCheck size={13} className="text-text-muted" />
                Kelola data &amp; saldo seluruh nasabah bank mini
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-2.5 rounded-full bg-primary/10 py-1.5 pr-3.5 pl-1.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                <Users size={16} />
              </span>
              <span className="text-left leading-tight">
                <span className="block text-xs font-bold text-primary">
                  {nasabahList.length} Nasabah
                </span>
                <span className="block text-[10px] text-primary/70">Terdaftar</span>
              </span>
            </span>
            <motion.button
              type="button"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={openAdd}
              className="flex w-fit items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-primary-dark"
            >
              <UserPlus size={16} />
              Tambah Nasabah
            </motion.button>
          </div>
        </div>
      </motion.div>

      <div className="mb-5 flex gap-6 border-b border-border">
        {(
          [
            { key: "sekolah" as Tab, label: "Nasabah Sekolah" },
            { key: "umum" as Tab, label: "Nasabah Umum" },
          ]
        ).map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => switchTab(tab.key)}
            className={`relative pb-3 text-sm font-semibold transition-colors ${
              activeTab === tab.key
                ? "text-primary"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            {tab.label}
            {activeTab === tab.key && (
              <motion.span
                layoutId="nasabah-tab-underline"
                transition={{ type: "spring", stiffness: 420, damping: 32 }}
                className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-primary"
              />
            )}
          </button>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="relative mb-4 overflow-hidden rounded-3xl bg-background-card p-4 shadow-soft sm:p-5"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.025] bg-[radial-gradient(circle,rgba(17,32,240,0.9)_1px,transparent_1px)] bg-size-[16px_16px]"
        />

        <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="flex items-center gap-1.5 text-sm font-bold text-text-primary">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Filter size={13} />
              </span>
              {activeTab === "sekolah" ? "Nasabah Sekolah" : "Nasabah Umum"}{" "}
              <span className="font-medium text-text-muted">
                ({displayList.length})
              </span>
            </p>
            <p className="mt-1 ml-9 text-xs text-text-secondary">
              Kelola, saring, dan ekspor data nasabah dengan cepat
            </p>
          </div>
          <div className="flex flex-1 flex-wrap items-center gap-2 sm:justify-end">
            <div className="relative w-full sm:max-w-xs">
              <Search
                size={16}
                className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-text-muted"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nama atau no rekening..."
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
            <div className="relative shrink-0">
              <ArrowUpDown
                size={13}
                className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-text-muted"
              />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="appearance-none rounded-xl border border-transparent bg-background-hover py-2.5 pr-3 pl-8 text-xs font-semibold text-text-secondary transition-shadow focus:border-primary focus:bg-background-card focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="terbaru">Terbaru</option>
                <option value="nama">Nama A-Z</option>
                <option value="saldo">Saldo Tertinggi</option>
              </select>
            </div>
            <motion.button
              type="button"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.95 }}
              onClick={exportCsv}
              className="flex shrink-0 items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-primary-dark"
            >
              <Download size={14} />
              Export
            </motion.button>
          </div>
        </div>

        <div className="relative mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
          <div className="flex flex-wrap items-center gap-1.5">
            {activeTab === "sekolah" &&
              (
                [
                  { value: "" as const, label: "Semua", icon: Users },
                  { value: "siswa" as const, label: "Siswa", icon: GraduationCap },
                  { value: "guru" as const, label: "Guru", icon: BookUser },
                  { value: "kelas" as const, label: "Kelas", icon: School },
                ]
              ).map((opt) => {
                const active = jenisFilter === opt.value;
                const color = opt.value ? JENIS_COLOR[opt.value] : "#1120f0";
                const OptIcon = opt.icon;
                return (
                  <motion.button
                    key={opt.label}
                    type="button"
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setJenisFilter(opt.value)}
                    className="relative rounded-full px-3.5 py-1.5 text-xs font-semibold"
                  >
                    {active && (
                      <motion.span
                        layoutId="jenis-pill-active"
                        transition={{ type: "spring", stiffness: 420, damping: 32 }}
                        className="absolute inset-0 rounded-full shadow-sm"
                        style={{ backgroundColor: color }}
                      />
                    )}
                    <span
                      className={`relative flex items-center gap-1.5 transition-colors ${
                        active
                          ? "text-white"
                          : "text-text-secondary hover:text-text-primary"
                      }`}
                    >
                      <OptIcon size={12} />
                      {opt.label}
                    </span>
                  </motion.button>
                );
              })}
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                {
                  value: "" as const,
                  label: "Semua Status",
                  icon: Filter,
                  count: nasabahList.length,
                },
                {
                  value: "aktif" as const,
                  label: "Aktif",
                  icon: CheckCircle2,
                  count: statusCounts.aktif,
                },
                {
                  value: "nonaktif" as const,
                  label: "Nonaktif",
                  icon: XCircle,
                  count: statusCounts.nonaktif,
                },
              ]
            ).map((opt) => {
              const active = statusFilter === opt.value;
              const OptIcon = opt.icon;
              return (
                <motion.button
                  key={opt.label}
                  type="button"
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setStatusFilter(opt.value)}
                  className="relative rounded-full px-3.5 py-1.5 text-xs font-semibold"
                >
                  {active && (
                    <motion.span
                      layoutId="status-pill-active"
                      transition={{ type: "spring", stiffness: 420, damping: 32 }}
                      className="absolute inset-0 rounded-full bg-success shadow-sm"
                    />
                  )}
                  <span
                    className={`relative flex items-center gap-1.5 transition-colors ${
                      active
                        ? "text-white"
                        : "text-text-secondary hover:text-text-primary"
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
        </div>

        <div className="relative mt-4 flex items-center gap-3 rounded-2xl bg-background-hover/60 p-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Users size={14} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="mb-1.5 flex items-center justify-between gap-2 text-[11px] font-semibold text-text-secondary">
              <span>Distribusi Status Nasabah</span>
              <span className="flex items-center gap-2 text-text-muted">
                <span className="flex items-center gap-1">
                  <CheckCircle2 size={11} className="text-success" />
                  {statusCounts.aktif} Aktif
                </span>
                <span className="flex items-center gap-1">
                  <XCircle size={11} className="text-text-muted" />
                  {statusCounts.nonaktif} Nonaktif
                </span>
              </span>
            </div>
            <div className="flex h-2 w-full overflow-hidden rounded-full bg-background-hover">
              <motion.div
                initial={{ width: 0 }}
                animate={{
                  width: `${
                    statusCounts.aktif + statusCounts.nonaktif > 0
                      ? (statusCounts.aktif / (statusCounts.aktif + statusCounts.nonaktif)) * 100
                      : 0
                  }%`,
                }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="h-full bg-success"
              />
              <motion.div
                initial={{ width: 0 }}
                animate={{
                  width: `${
                    statusCounts.aktif + statusCounts.nonaktif > 0
                      ? (statusCounts.nonaktif / (statusCounts.aktif + statusCounts.nonaktif)) * 100
                      : 0
                  }%`,
                }}
                transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="h-full bg-border"
              />
            </div>
          </div>
        </div>

        {(jenisFilter || statusFilter) && (
          <div className="relative mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
            <span className="flex items-center gap-1 text-[11px] font-semibold text-text-muted">
              <Sparkles size={11} />
              Filter aktif:
            </span>
            {jenisFilter && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                {JenisFilterIcon && <JenisFilterIcon size={12} />}
                {jenisLabel[jenisFilter]}
                <button type="button" onClick={() => setJenisFilter("")}>
                  <X size={12} />
                </button>
              </span>
            )}
            {statusFilter && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-3 py-1 text-xs font-medium text-success capitalize">
                {statusFilter === "aktif" ? (
                  <CheckCircle2 size={12} />
                ) : (
                  <XCircle size={12} />
                )}
                {statusFilter}
                <button type="button" onClick={() => setStatusFilter("")}>
                  <X size={12} />
                </button>
              </span>
            )}
            <button
              type="button"
              onClick={clearFilters}
              className="text-xs font-semibold text-text-muted transition-colors hover:text-danger"
            >
              Clear all
            </button>
          </div>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="relative mb-4 overflow-hidden rounded-3xl bg-background-card p-5 shadow-soft md:mb-6 2xl:mb-7.5"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.03] bg-[radial-gradient(circle,rgba(17,32,240,0.9)_1px,transparent_1px)] bg-size-[18px_18px]"
        />
        <motion.div
          aria-hidden
          animate={{ backgroundColor: `${aktifMeta.color}22` }}
          transition={{ duration: 0.6 }}
          className="pointer-events-none absolute -top-12 -right-12 h-44 w-44 rounded-full blur-3xl"
        />

        <div className="relative grid grid-cols-1 gap-4 sm:grid-cols-[auto_1fr] sm:items-center">
          <div className="flex items-center gap-4">
            <div className="relative h-16 w-16 shrink-0">
              <motion.div
                aria-hidden
                animate={{
                  opacity: [0.5, 0.9, 0.5],
                  scale: [1, 1.15, 1],
                  backgroundColor: `${aktifMeta.color}33`,
                }}
                transition={{
                  opacity: { duration: 2.2, repeat: Infinity, ease: "easeInOut" },
                  scale: { duration: 2.2, repeat: Infinity, ease: "easeInOut" },
                  backgroundColor: { duration: 0.6 },
                }}
                className="absolute inset-0 rounded-full blur-md"
              />
              <svg width={64} height={64} className="relative -rotate-90">
                <circle cx={32} cy={32} r={27} stroke="#e5e7eb" strokeWidth={6} fill="none" />
                <motion.circle
                  cx={32}
                  cy={32}
                  r={27}
                  strokeWidth={6}
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 27}
                  animate={{
                    strokeDashoffset:
                      2 * Math.PI * 27 * (1 - aktifPercent / 100),
                    stroke: aktifMeta.color,
                  }}
                  initial={{ strokeDashoffset: 2 * Math.PI * 27 }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-text-primary">
                {aktifPercent}%
              </span>
            </div>
            <div>
              <div className="mb-1 flex items-center gap-1.5">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Users size={12} />
                </span>
                <p className="text-xs font-bold tracking-widest text-text-muted uppercase">
                  Nasabah Aktif
                </p>
              </div>
              <p className="text-xs text-text-secondary">
                <span className="font-bold text-text-primary">{aktifCount}</span>{" "}
                dari {totalCount} nasabah berstatus aktif
              </p>
              <motion.span
                key={aktifTier}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className={`mt-1.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${aktifMeta.bg} ${aktifMeta.text}`}
              >
                <aktifMeta.icon size={11} />
                {aktifMeta.label}
              </motion.span>
            </div>
          </div>

          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.08, delayChildren: 0.15 } },
            }}
            className="grid grid-cols-3 gap-3 border-t border-border pt-4 sm:border-t-0 sm:border-l sm:pt-0 sm:pl-6"
          >
            {[
              {
                label: "Total Nasabah",
                caption: "Semua data terdaftar",
                icon: Users,
                gradient: "from-primary to-primary-dark",
                node: <p className="text-lg font-bold">{totalCount}</p>,
              },
              {
                label: "Total Saldo",
                caption: "Akumulasi seluruh rekening",
                icon: Wallet,
                gradient: "from-gradient-green-from to-gradient-green-to",
                node: (
                  <AnimatedCurrency
                    value={totalSaldoTab}
                    className="block text-xs font-bold wrap-break-word text-white sm:text-lg"
                  />
                ),
              },
              {
                label: "Rata-rata Saldo",
                caption: "Per nasabah aktif",
                icon: TrendingUp,
                gradient: "from-gradient-orange-from to-gradient-orange-to",
                node: (
                  <AnimatedCurrency
                    value={rataSaldoTab}
                    className="block text-xs font-bold wrap-break-word text-white sm:text-lg"
                  />
                ),
              },
            ].map((stat) => (
              <motion.div
                key={stat.label}
                variants={{
                  hidden: { opacity: 0, y: 8 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
                }}
                whileHover={{ y: -3 }}
                className={`relative min-w-0 overflow-hidden rounded-2xl bg-linear-to-br p-3.5 text-white shadow-sm transition-shadow hover:shadow-md ${stat.gradient}`}
              >
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 opacity-20 bg-[radial-gradient(circle,rgba(255,255,255,0.7)_1px,transparent_1px)] bg-size-[12px_12px]"
                />
                <div className="relative min-w-0">
                  <motion.span
                    initial={{ scale: 0.6, opacity: 0, rotate: -15 }}
                    animate={{ scale: 1, opacity: 1, rotate: 0 }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm"
                  >
                    <stat.icon size={15} />
                  </motion.span>
                  <div className="mt-2 min-w-0">
                    {stat.node}
                    <p className="mt-0.5 truncate text-[10px] font-semibold text-white/80">
                      {stat.label}
                    </p>
                    <p className="truncate text-[9px] text-white/60">{stat.caption}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.div>

      <AnimatePresence>
        {selected.size > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-3 flex items-center justify-between overflow-hidden rounded-xl bg-primary/10 px-4 py-2.5"
          >
            <p className="text-sm font-medium text-primary">
              {selected.size} nasabah dipilih
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSelected(new Set())}
                className="text-xs font-semibold text-text-secondary hover:text-text-primary"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleBulkDelete}
                className="flex items-center gap-1 rounded-lg bg-danger px-3 py-1.5 text-xs font-bold text-white hover:bg-danger/90"
              >
                <Trash2 size={12} />
                Hapus Terpilih
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleSelectAll}
                    className="h-4 w-4 rounded border-border accent-primary"
                  />
                </th>
                <th className="px-4 py-3 text-xs font-bold tracking-wide text-text-muted uppercase">
                  Nama
                </th>
                <th className="px-4 py-3 text-xs font-bold tracking-wide text-text-muted uppercase">
                  Status
                </th>
                <th className="px-4 py-3 text-xs font-bold tracking-wide text-text-muted uppercase">
                  Saldo
                </th>
                <th className="px-4 py-3 text-xs font-bold tracking-wide text-text-muted uppercase">
                  Kelengkapan Data
                </th>
                <th className="px-4 py-3 text-xs font-bold tracking-wide text-text-muted uppercase">
                  Terdaftar
                </th>
                <th className="px-4 py-3 text-xs font-bold tracking-wide text-text-muted uppercase">
                  Aksi
                </th>
              </tr>
            </thead>
            <motion.tbody initial="hidden" animate="visible" variants={listVariants}>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-2 text-text-secondary">
                      <Loader2 size={22} className="animate-spin text-primary" />
                      Memuat data nasabah...
                    </div>
                  </td>
                </tr>
              ) : displayList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-2 text-text-secondary">
                      <Users size={26} className="text-text-muted" />
                      Tidak ada data nasabah
                    </div>
                  </td>
                </tr>
              ) : (
                displayList.map((nasabah) => {
                  const Icon = JENIS_ICON[nasabah.jenisNasabah];
                  const saldoPositive = Number(nasabah.saldo) > 0;
                  const pct = completeness(nasabah);
                  return (
                    <motion.tr
                      key={nasabah.id}
                      variants={rowVariants}
                      className="border-b border-border transition-colors last:border-0 hover:bg-background-hover"
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selected.has(nasabah.id)}
                          onChange={() => toggleSelect(nasabah.id)}
                          className="h-4 w-4 rounded border-border accent-primary"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <span
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                            style={{
                              backgroundColor: JENIS_COLOR[nasabah.jenisNasabah],
                            }}
                          >
                            {nasabah.nama.slice(0, 2).toUpperCase()}
                          </span>
                          <div className="min-w-0">
                            <p className="font-medium text-text-primary">
                              {nasabah.nama}
                            </p>
                            <p className="flex items-center gap-1 text-xs text-text-muted">
                              <Icon size={11} />
                              {jenisLabel[nasabah.jenisNasabah]} &middot;{" "}
                              <span className="font-mono">
                                {nasabah.noRekening}
                              </span>
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium capitalize ${
                            nasabah.status === "aktif"
                              ? "bg-success/15 text-success"
                              : "bg-background-hover text-text-secondary"
                          }`}
                        >
                          {nasabah.status === "aktif" ? (
                            <CheckCircle2 size={12} />
                          ) : (
                            <XCircle size={12} />
                          )}
                          {nasabah.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1.5 font-semibold text-text-primary">
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              saldoPositive ? "bg-success" : "bg-text-muted"
                            }`}
                          />
                          {formatCurrency(nasabah.saldo)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="flex items-center gap-2">
                            <ProgressRing percent={pct} />
                            <span className="text-xs text-text-muted">
                              {pct}%
                            </span>
                          </div>
                          <motion.button
                            whileTap={{ scale: 0.92 }}
                            onClick={() => openView(nasabah)}
                            className="flex items-center gap-1 rounded-lg bg-primary/10 px-2.5 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
                          >
                            <Eye size={12} />
                            Lihat Data
                          </motion.button>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-text-secondary">
                        {formatDate(nasabah.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.92 }}
                            onClick={() => openEdit(nasabah)}
                            className="flex items-center gap-1 rounded-lg bg-primary px-2.5 py-1.5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-primary-dark"
                          >
                            <Pencil size={12} />
                            Edit
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.92 }}
                            onClick={() => handleDelete(nasabah)}
                            className="flex items-center gap-1 rounded-lg bg-danger px-2.5 py-1.5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-danger/90"
                          >
                            <Trash2 size={12} />
                            Hapus
                          </motion.button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </motion.tbody>
          </table>
        </div>
      </motion.div>

      <AnimatePresence>
        {editing && editForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeEdit}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="scrollbar-hide relative max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-background-card p-6 shadow-soft"
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
                    initial={{ scale: 0.6, rotate: -15, opacity: 0 }}
                    animate={{ scale: 1, rotate: 0, opacity: 1 }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-sm font-bold text-white"
                    style={{ backgroundColor: JENIS_COLOR[editing.jenisNasabah] }}
                  >
                    {editing.nama.slice(0, 2).toUpperCase()}
                  </motion.span>
                  <div>
                    <h2 className="text-lg font-bold text-text-primary">
                      Edit Nasabah
                    </h2>
                    <p className="truncate text-xs text-text-secondary">
                      {editing.nama}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ${
                      editing.status === "aktif"
                        ? "bg-success/15 text-success"
                        : "bg-background-hover text-text-secondary"
                    }`}
                  >
                    {editing.status === "aktif" ? (
                      <CheckCircle2 size={11} />
                    ) : (
                      <XCircle size={11} />
                    )}
                    {editing.status}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
                    <Wallet size={11} />
                    {formatCurrency(editing.saldo)}
                  </span>
                  <span className="hidden items-center gap-1 rounded-full bg-warning/10 px-2.5 py-1 text-[11px] font-semibold text-warning sm:inline-flex">
                    <Sparkles size={11} />
                    {completeness(editing)}% lengkap
                  </span>
                  <button
                    type="button"
                    onClick={closeEdit}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-background-hover hover:text-text-primary"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              <p className="relative mb-4 flex items-center gap-1.5 rounded-xl bg-primary/5 px-3 py-2 text-xs text-text-secondary">
                <Sparkles size={13} className="shrink-0 text-primary" />
                Perbarui data nasabah, lalu simpan untuk menerapkan perubahan.
              </p>
              <form onSubmit={handleUpdate} className="relative flex flex-col gap-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <FieldLabel icon={UserCircle2}>Nama</FieldLabel>
                    <input
                      type="text"
                      required
                      value={editForm.nama}
                      onChange={(e) =>
                        setEditForm({ ...editForm, nama: e.target.value })
                      }
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <FieldLabel icon={Users}>Jenis Nasabah</FieldLabel>
                    <select
                      value={editForm.jenisNasabah}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          jenisNasabah: e.target.value as JenisNasabah,
                        })
                      }
                      className={inputClass}
                    >
                      <option value="siswa">Siswa</option>
                      <option value="guru">Guru</option>
                      <option value="kelas">Kelas</option>
                      <option value="umum">Umum</option>
                    </select>
                  </div>
                </div>

                {editForm.jenisNasabah === "siswa" && (
                  <div className="rounded-2xl border border-primary/20 bg-primary/5 p-3">
                    <p className="mb-3 flex items-center gap-1.5 text-[11px] font-bold tracking-wide text-primary uppercase">
                      <GraduationCap size={12} />
                      Data Sekolah
                    </p>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <div>
                        <FieldLabel icon={Hash}>NIS</FieldLabel>
                        <input
                          type="text"
                          value={editForm.nis}
                          onChange={(e) =>
                            setEditForm({ ...editForm, nis: e.target.value })
                          }
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <FieldLabel icon={GraduationCap}>Kelas</FieldLabel>
                        <input
                          type="text"
                          value={editForm.kelas}
                          onChange={(e) =>
                            setEditForm({ ...editForm, kelas: e.target.value })
                          }
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <FieldLabel icon={BookUser}>Jurusan</FieldLabel>
                        <input
                          type="text"
                          value={editForm.jurusan}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              jurusan: e.target.value,
                            })
                          }
                          className={inputClass}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {editForm.jenisNasabah === "guru" && (
                  <div className="rounded-2xl border border-warning/20 bg-warning/5 p-3">
                    <p className="mb-3 flex items-center gap-1.5 text-[11px] font-bold tracking-wide text-warning uppercase">
                      <Briefcase size={12} />
                      Data Kepegawaian
                    </p>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <FieldLabel icon={Hash}>NIP</FieldLabel>
                        <input
                          type="text"
                          value={editForm.nip}
                          onChange={(e) =>
                            setEditForm({ ...editForm, nip: e.target.value })
                          }
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <FieldLabel icon={Briefcase}>Jabatan</FieldLabel>
                        <input
                          type="text"
                          value={editForm.jabatan}
                          onChange={(e) =>
                            setEditForm({ ...editForm, jabatan: e.target.value })
                          }
                          className={inputClass}
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <FieldLabel icon={Phone}>No Telepon</FieldLabel>
                    <input
                      type="text"
                      value={editForm.noTelepon}
                      onChange={(e) =>
                        setEditForm({ ...editForm, noTelepon: e.target.value })
                      }
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <FieldLabel icon={ShieldCheck}>Status</FieldLabel>
                    <select
                      value={editForm.status}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          status: e.target.value as StatusNasabah,
                        })
                      }
                      className={inputClass}
                    >
                      <option value="aktif">Aktif</option>
                      <option value="nonaktif">Nonaktif</option>
                    </select>
                  </div>

                  <div>
                    {editForm.jenisNasabah === "kelas" ? (
                      <>
                        <FieldLabel icon={Calendar}>Tahun Angkatan</FieldLabel>
                        <input
                          type="text"
                          value={editForm.tahunAngkatan}
                          onChange={(e) =>
                            setEditForm({ ...editForm, tahunAngkatan: e.target.value })
                          }
                          placeholder="Contoh: 2023/2024"
                          className={inputClass}
                        />
                      </>
                    ) : (
                      <>
                        <FieldLabel icon={MapPin}>Alamat</FieldLabel>
                        <input
                          type="text"
                          value={editForm.alamat}
                          onChange={(e) =>
                            setEditForm({ ...editForm, alamat: e.target.value })
                          }
                          className={inputClass}
                        />
                      </>
                    )}
                  </div>
                </div>

                <div className="mt-2 flex justify-end gap-2">
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.96 }}
                    onClick={closeEdit}
                    className="rounded-xl bg-background-hover px-4 py-2.5 text-sm font-semibold text-text-secondary transition-colors hover:bg-border"
                  >
                    Batal
                  </motion.button>
                  <motion.button
                    type="submit"
                    whileTap={{ scale: 0.96 }}
                    disabled={saving}
                    className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-primary-dark disabled:opacity-50"
                  >
                    {saving && <Loader2 size={14} className="animate-spin" />}
                    {saving ? "Menyimpan..." : "Simpan"}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {viewing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeView}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="scrollbar-hide relative max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-background-card p-6 shadow-soft"
            >
              {(() => {
                const Icon = JENIS_ICON[viewing.jenisNasabah];
                const pct = completeness(viewing);
                const missing = missingFields(viewing);
                const color = JENIS_COLOR[viewing.jenisNasabah];
                const sectionVariants = {
                  hidden: {},
                  visible: {
                    transition: { staggerChildren: 0.08, delayChildren: 0.15 },
                  },
                };
                const itemVariants = {
                  hidden: { opacity: 0, y: 10 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
                };
                return (
                  <>
                    <div
                      aria-hidden
                      className="pointer-events-none absolute inset-0 opacity-[0.03] bg-[radial-gradient(circle,rgba(17,32,240,0.9)_1px,transparent_1px)] bg-size-[18px_18px]"
                    />
                    <div
                      aria-hidden
                      className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full blur-3xl"
                      style={{ backgroundColor: `${color}22` }}
                    />

                    <div className="relative mb-4 flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <motion.span
                          initial={{ scale: 0.6, rotate: -15, opacity: 0 }}
                          animate={{ scale: 1, rotate: 0, opacity: 1 }}
                          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-sm font-bold text-white"
                          style={{ backgroundColor: color }}
                        >
                          {viewing.nama.slice(0, 2).toUpperCase()}
                        </motion.span>
                        <div className="min-w-0">
                          <h2 className="truncate text-lg font-bold text-text-primary">
                            {viewing.nama}
                          </h2>
                          <p className="flex items-center gap-1 text-xs text-text-secondary">
                            <Icon size={12} />
                            {jenisLabel[viewing.jenisNasabah]} &middot;{" "}
                            <span className="font-mono">{viewing.noRekening}</span>
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={closeView}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-background-hover hover:text-text-primary"
                      >
                        <X size={16} />
                      </button>
                    </div>

                    <div className="relative mb-4 flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ${
                          viewing.status === "aktif"
                            ? "bg-success/15 text-success"
                            : "bg-background-hover text-text-secondary"
                        }`}
                      >
                        {viewing.status === "aktif" ? (
                          <CheckCircle2 size={11} />
                        ) : (
                          <XCircle size={11} />
                        )}
                        {viewing.status}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
                        <Wallet size={11} />
                        {formatCurrency(viewing.saldo)}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-1 text-[11px] font-semibold text-success">
                        <Calendar size={11} />
                        Sejak {formatDate(viewing.createdAt)}
                      </span>
                    </div>

                    <motion.div
                      initial="hidden"
                      animate="visible"
                      variants={sectionVariants}
                      className="relative grid grid-cols-1 gap-4 lg:grid-cols-2"
                    >
                      <div className="space-y-4">
                        <motion.div variants={itemVariants}>
                          <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold tracking-wide text-text-muted uppercase">
                            <Wallet size={12} className="text-primary" />
                            Informasi Rekening
                          </p>
                          <div className="grid grid-cols-2 gap-3 rounded-2xl border border-border p-3">
                            <ViewField icon={Hash} label="No Rekening" value={viewing.noRekening} mono />
                            <ViewField icon={Wallet} label="Saldo" value={formatCurrency(viewing.saldo)} />
                            <ViewField
                              icon={viewing.status === "aktif" ? CheckCircle2 : XCircle}
                              label="Status"
                              value={viewing.status}
                              className="capitalize"
                            />
                            <ViewField icon={Calendar} label="Terdaftar" value={formatDate(viewing.createdAt)} />
                          </div>
                        </motion.div>

                        <motion.div variants={itemVariants}>
                          <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold tracking-wide text-text-muted uppercase">
                            <UserCircle2 size={12} className="text-primary" />
                            Informasi Pribadi
                          </p>
                          <div className="grid grid-cols-2 gap-3 rounded-2xl border border-border p-3">
                            <ViewField icon={UserCircle2} label="Jenis Kelamin" value={viewing.jenisKelamin ?? "-"} />
                            <ViewField
                              icon={Cake}
                              label="Tanggal Lahir"
                              value={viewing.tanggalLahir ? formatDate(viewing.tanggalLahir) : "-"}
                            />
                            <ViewField icon={Phone} label="No Telepon" value={viewing.noTelepon ?? "-"} />
                            {viewing.jenisNasabah === "kelas" ? (
                              <ViewField icon={Calendar} label="Tahun Angkatan" value={viewing.tahunAngkatan ?? "-"} className="col-span-2" />
                            ) : (
                              <ViewField icon={MapPin} label="Alamat" value={viewing.alamat ?? "-"} className="col-span-2" />
                            )}
                          </div>
                        </motion.div>
                      </div>

                      <div className="space-y-4">
                        <motion.div
                          variants={itemVariants}
                          className="flex items-center gap-4 rounded-2xl bg-background-hover p-4"
                        >
                          <ProgressRing percent={pct} />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-text-primary">
                              Kelengkapan Data {pct}%
                            </p>
                            {missing.length === 0 ? (
                              <p className="mt-0.5 flex items-center gap-1 text-[11px] text-success">
                                <CheckCircle2 size={11} /> Semua data sudah lengkap
                              </p>
                            ) : (
                              <p className="mt-0.5 text-[11px] text-text-muted">
                                Belum lengkap:{" "}
                                {missing.map((m) => m.label).join(", ")}
                              </p>
                            )}
                          </div>
                        </motion.div>

                        {viewing.jenisNasabah === "siswa" && (
                          <motion.div variants={itemVariants}>
                            <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold tracking-wide text-primary uppercase">
                              <GraduationCap size={12} />
                              Informasi Sekolah
                            </p>
                            <div className="grid grid-cols-2 gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-3">
                              <ViewField icon={Hash} label="NIS" value={viewing.nis ?? "-"} mono />
                              <ViewField icon={GraduationCap} label="Kelas" value={viewing.kelas ?? "-"} />
                              <ViewField icon={BookUser} label="Jurusan" value={viewing.jurusan ?? "-"} className="col-span-2" />
                            </div>
                          </motion.div>
                        )}

                        {viewing.jenisNasabah === "guru" && (
                          <motion.div variants={itemVariants}>
                            <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold tracking-wide text-warning uppercase">
                              <Briefcase size={12} />
                              Informasi Pekerjaan
                            </p>
                            <div className="grid grid-cols-2 gap-3 rounded-2xl border border-warning/20 bg-warning/5 p-3">
                              <ViewField icon={Hash} label="NIP" value={viewing.nip ?? "-"} mono />
                              <ViewField icon={Briefcase} label="Jabatan" value={viewing.jabatan ?? "-"} className="col-span-2" />
                            </div>
                          </motion.div>
                        )}
                      </div>
                    </motion.div>

                    <div className="mt-5 flex justify-end gap-2">
                      <motion.button
                        type="button"
                        whileTap={{ scale: 0.96 }}
                        onClick={closeView}
                        className="rounded-xl bg-background-hover px-4 py-2.5 text-sm font-semibold text-text-secondary transition-colors hover:bg-border"
                      >
                        Tutup
                      </motion.button>
                      <motion.button
                        type="button"
                        whileTap={{ scale: 0.96 }}
                        onClick={() => {
                          const target = viewing;
                          closeView();
                          if (target) openEdit(target);
                        }}
                        className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-primary-dark"
                      >
                        <Pencil size={14} />
                        Edit Data
                      </motion.button>
                    </div>
                  </>
                );
              })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeAdd}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="scrollbar-hide relative max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-background-card p-6 shadow-soft"
            >
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-[0.03] bg-[radial-gradient(circle,rgba(17,32,240,0.9)_1px,transparent_1px)] bg-size-[18px_18px]"
              />
              <div
                aria-hidden
                className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-primary/10 blur-3xl"
              />

              <div className="relative mb-2 flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <motion.span
                    initial={{ scale: 0.6, rotate: -15, opacity: 0 }}
                    animate={{ scale: 1, rotate: 0, opacity: 1 }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary"
                  >
                    <UserPlus size={20} />
                  </motion.span>
                  <div>
                    <h2 className="text-lg font-bold text-text-primary">
                      Tambah Nasabah Baru
                    </h2>
                    <p className="flex items-center gap-1 text-xs text-text-secondary">
                      <Sparkles size={11} className="text-warning" />
                      Daftarkan nasabah untuk mulai bertransaksi
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={closeAdd}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-background-hover hover:text-text-primary"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleAddSubmit} className="relative mt-4 flex flex-col gap-4">
                <div>
                  <FieldLabel icon={Users}>Jenis Nasabah</FieldLabel>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {(
                      [
                        {
                          value: "siswa" as const,
                          label: "Siswa",
                          desc: "Pelajar aktif",
                          icon: GraduationCap,
                          color: JENIS_COLOR.siswa,
                        },
                        {
                          value: "guru" as const,
                          label: "Guru",
                          desc: "Staff pengajar",
                          icon: BookUser,
                          color: JENIS_COLOR.guru,
                        },
                        {
                          value: "kelas" as const,
                          label: "Kelas",
                          desc: "Kas kelas",
                          icon: School,
                          color: JENIS_COLOR.kelas,
                        },
                        {
                          value: "umum" as const,
                          label: "Umum",
                          desc: "Masyarakat umum",
                          icon: Users,
                          color: JENIS_COLOR.umum,
                        },
                      ]
                    ).map((opt) => {
                      const active = addForm.jenisNasabah === opt.value;
                      const OptIcon = opt.icon;
                      return (
                        <motion.button
                          key={opt.value}
                          type="button"
                          whileHover={{ y: -2 }}
                          whileTap={{ scale: 0.96 }}
                          onClick={() =>
                            setAddForm({ ...addForm, jenisNasabah: opt.value })
                          }
                          className="relative flex flex-col items-center gap-1.5 rounded-2xl border-2 p-3 text-center shadow-sm transition-all"
                          style={
                            active
                              ? { backgroundColor: opt.color, borderColor: opt.color }
                              : { backgroundColor: `${opt.color}0d`, borderColor: `${opt.color}33` }
                          }
                        >
                          <span
                            className="flex h-9 w-9 items-center justify-center rounded-full"
                            style={
                              active
                                ? { backgroundColor: "rgba(255,255,255,0.25)", color: "#ffffff" }
                                : { backgroundColor: `${opt.color}1a`, color: opt.color }
                            }
                          >
                            <OptIcon size={18} />
                          </span>
                          <span
                            className={`text-xs font-bold ${
                              active ? "text-white" : "text-text-primary"
                            }`}
                          >
                            {opt.label}
                          </span>
                          <span
                            className={`text-[10px] ${
                              active ? "text-white/80" : "text-text-muted"
                            }`}
                          >
                            {opt.desc}
                          </span>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <FieldLabel icon={UserCircle2}>Nama Lengkap</FieldLabel>
                    <input
                      type="text"
                      required
                      value={addForm.nama}
                      onChange={(e) => setAddForm({ ...addForm, nama: e.target.value })}
                      placeholder="Contoh: Ahmad Fauzi"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <FieldLabel icon={Phone}>No Telepon</FieldLabel>
                    <input
                      type="text"
                      value={addForm.noTelepon}
                      onChange={(e) =>
                        setAddForm({ ...addForm, noTelepon: e.target.value })
                      }
                      placeholder="08xxxxxxxxxx"
                      className={inputClass}
                    />
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  {addForm.jenisNasabah === "siswa" && (
                    <motion.div
                      key="siswa"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden rounded-2xl border border-primary/20 bg-primary/5 p-3"
                    >
                      <p className="mb-3 flex items-center gap-1.5 text-[11px] font-bold tracking-wide text-primary uppercase">
                        <GraduationCap size={12} />
                        Data Sekolah
                      </p>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <div>
                          <FieldLabel icon={Hash}>NIS</FieldLabel>
                          <input
                            type="text"
                            value={addForm.nis}
                            onChange={(e) => setAddForm({ ...addForm, nis: e.target.value })}
                            className={inputClass}
                          />
                        </div>
                        <div>
                          <FieldLabel icon={GraduationCap}>Kelas</FieldLabel>
                          <input
                            type="text"
                            value={addForm.kelas}
                            onChange={(e) =>
                              setAddForm({ ...addForm, kelas: e.target.value })
                            }
                            className={inputClass}
                          />
                        </div>
                        <div>
                          <FieldLabel icon={BookUser}>Jurusan</FieldLabel>
                          <input
                            type="text"
                            value={addForm.jurusan}
                            onChange={(e) =>
                              setAddForm({ ...addForm, jurusan: e.target.value })
                            }
                            className={inputClass}
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {addForm.jenisNasabah === "guru" && (
                    <motion.div
                      key="guru"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden rounded-2xl border border-warning/20 bg-warning/5 p-3"
                    >
                      <p className="mb-3 flex items-center gap-1.5 text-[11px] font-bold tracking-wide text-warning uppercase">
                        <Briefcase size={12} />
                        Data Kepegawaian
                      </p>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                          <FieldLabel icon={Hash}>NIP</FieldLabel>
                          <input
                            type="text"
                            value={addForm.nip}
                            onChange={(e) => setAddForm({ ...addForm, nip: e.target.value })}
                            className={inputClass}
                          />
                        </div>
                        <div>
                          <FieldLabel icon={Briefcase}>Jabatan</FieldLabel>
                          <input
                            type="text"
                            value={addForm.jabatan}
                            onChange={(e) =>
                              setAddForm({ ...addForm, jabatan: e.target.value })
                            }
                            className={inputClass}
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <FieldLabel icon={UserCircle2}>Jenis Kelamin</FieldLabel>
                    <select
                      value={addForm.jenisKelamin}
                      onChange={(e) =>
                        setAddForm({
                          ...addForm,
                          jenisKelamin: e.target.value as JenisKelamin | "",
                        })
                      }
                      className={inputClass}
                    >
                      <option value="">Pilih</option>
                      <option value="L">Laki-laki</option>
                      <option value="P">Perempuan</option>
                    </select>
                  </div>
                  <div>
                    <FieldLabel icon={Cake}>Tanggal Lahir</FieldLabel>
                    <input
                      type="date"
                      value={addForm.tanggalLahir}
                      onChange={(e) =>
                        setAddForm({ ...addForm, tanggalLahir: e.target.value })
                      }
                      className={inputClass}
                    />
                  </div>
                  <div>
                    {addForm.jenisNasabah === "kelas" ? (
                      <>
                        <FieldLabel icon={Calendar}>Tahun Angkatan</FieldLabel>
                        <input
                          type="text"
                          value={addForm.tahunAngkatan}
                          onChange={(e) =>
                            setAddForm({ ...addForm, tahunAngkatan: e.target.value })
                          }
                          placeholder="Contoh: 2023/2024"
                          className={inputClass}
                        />
                      </>
                    ) : (
                      <>
                        <FieldLabel icon={MapPin}>Alamat</FieldLabel>
                        <input
                          type="text"
                          value={addForm.alamat}
                          onChange={(e) => setAddForm({ ...addForm, alamat: e.target.value })}
                          className={inputClass}
                        />
                      </>
                    )}
                  </div>
                </div>

                <div className="mt-2 flex justify-end gap-2">
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.96 }}
                    onClick={closeAdd}
                    className="rounded-xl bg-background-hover px-4 py-2.5 text-sm font-semibold text-text-secondary transition-colors hover:bg-border"
                  >
                    Batal
                  </motion.button>
                  <motion.button
                    type="submit"
                    whileTap={{ scale: 0.96 }}
                    disabled={addSaving}
                    className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-primary-dark disabled:opacity-50"
                  >
                    {addSaving && <Loader2 size={14} className="animate-spin" />}
                    {addSaving ? "Menyimpan..." : "Simpan Nasabah"}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Layout>
  );
}
