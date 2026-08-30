"use client";

import { useEffect, useState } from "react";
import { Briefcase, FileText, Loader2, Info } from "lucide-react";
import { useToast } from "@/components/shared/ToastSystem";
import { DataSiswaHeader } from "@/components/data-siswa/DataSiswaHeader";

type Pengaturan = { magangAktif: boolean; ukkAktif: boolean };
type Key = keyof Pengaturan;

function ToggleSwitch({ checked, onClick, disabled }: { checked: boolean; onClick: () => void; disabled?: boolean }) {
  return (
    <button type="button" role="switch" aria-checked={checked} onClick={onClick} disabled={disabled}
      className="relative h-7 w-12 shrink-0 rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-60"
      style={{ background: checked ? "#00D67F" : "#CBD5E1" }}>
      <span className="absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition-transform"
        style={{ transform: checked ? "translateX(1.25rem)" : "translateX(0.125rem)" }} />
    </button>
  );
}

function PengaturanCard({
  icon: Icon, color, title, description, checked, saving, onToggle,
}: {
  icon: typeof Briefcase;
  color: string;
  title: string;
  description: string;
  checked: boolean;
  saving: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white" style={{ background: color }}>
            <Icon size={20} />
          </span>
          <div>
            <p className="text-sm font-bold text-slate-800 dark:text-white">{title}</p>
            <p className="text-[11px] font-semibold" style={{ color: checked ? "#00D67F" : "#94a3b8" }}>
              {checked ? "Aktif" : "Nonaktif"}
            </p>
          </div>
        </div>
        {saving ? <Loader2 size={20} className="mt-1 animate-spin text-slate-300" /> : <ToggleSwitch checked={checked} onClick={onToggle} />}
      </div>
      <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">{description}</p>
    </div>
  );
}

export function PengaturanClient() {
  const toast = useToast();
  const [data, setData] = useState<Pengaturan | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<Key | null>(null);

  useEffect(() => {
    fetch("/api/pengaturan", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setData({ magangAktif: !!d?.magangAktif, ukkAktif: !!d?.ukkAktif }))
      .catch(() => toast.error("Gagal memuat pengaturan"))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function toggle(key: Key) {
    if (!data || saving) return;
    const nextValue = !data[key];
    const prev = data;
    setSaving(key);
    setData({ ...data, [key]: nextValue });
    try {
      const res = await fetch("/api/pengaturan", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: nextValue }),
      });
      if (!res.ok) throw new Error();
      const label = key === "magangAktif" ? "Menu PKL/Magang" : "Menu UKK";
      toast.success(nextValue ? `${label} diaktifkan` : `${label} dinonaktifkan`,
        nextValue ? "Siswa kelas XII sekarang bisa mengakses." : "Siswa kelas XII tidak lagi bisa mengakses.");
    } catch {
      setData(prev);
      toast.error("Gagal menyimpan pengaturan", "Coba lagi.");
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="space-y-6">
      <DataSiswaHeader eyebrow="Admin" title="Pengaturan Sistem" />

      {loading || !data ? (
        <div className="py-16 text-center text-sm font-semibold text-slate-400">Memuat…</div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <PengaturanCard
              icon={Briefcase}
              color="#0064E0"
              title="Menu PKL / Magang"
              description="Kalau aktif, siswa kelas XII bisa membuka menu PKL (Penempatan, Absensi, Rekap). Siswa kelas X/XI tetap terkunci apa pun kondisinya, dan guru/admin selalu bisa mengelola data PKL kapan saja untuk persiapan."
              checked={data.magangAktif}
              saving={saving === "magangAktif"}
              onToggle={() => toggle("magangAktif")}
            />
            <PengaturanCard
              icon={FileText}
              color="#8B5CF6"
              title="Menu UKK"
              description="Kalau aktif, siswa kelas XII bisa membuka menu UKK (Jadwal & Soal, Nilai Saya). Siswa kelas X/XI tetap terkunci apa pun kondisinya, dan guru/admin selalu bisa menyiapkan jadwal & soal kapan saja."
              checked={data.ukkAktif}
              saving={saving === "ukkAktif"}
              onToggle={() => toggle("ukkAktif")}
            />
          </div>

          <div className="flex items-start gap-2.5 rounded-2xl border border-blue-100 bg-blue-50/60 px-4 py-3.5 text-xs leading-relaxed text-blue-700 dark:border-blue-900/40 dark:bg-blue-900/10 dark:text-blue-300">
            <Info size={15} className="mt-0.5 shrink-0" />
            <p>
              Periode PKL dan UKK berbeda-beda tiap tahun ajaran, jadi tidak diaktifkan otomatis berdasarkan tanggal —
              nyalakan saklar ini manual begitu jadwal resmi tahun ini dimulai, dan matikan lagi setelah periodenya selesai kalau perlu.
              Perubahan langsung berlaku untuk semua siswa kelas XII, tidak perlu diatur satu per satu.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
