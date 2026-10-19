"use client";

import { useEffect, useState } from "react";
import {
  LayoutDashboard, Megaphone, Users, Briefcase,
  FileText, KeyRound,
  Building2, ClipboardCheck, FileBarChart,
  CalendarDays, Trophy, NotebookPen, BookOpen, Settings,
} from "lucide-react";
import type { UserPayload } from "@/lib/auth";
import { SUPER_ADMIN_LOGIN_ID } from "@/lib/constants";

export type SubItem = { href: string; label: string; icon: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }> };
export type MenuItem = {
  key: string;
  href?: string;
  label: string;
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties; className?: string }>;
  submenu?: SubItem[];
  locked?: boolean;
};

export const MENUS: Record<string, MenuItem[]> = {
  ADMIN: [
    { key: "dashboard",    href: "/admin/dashboard",    label: "Dashboard",   icon: LayoutDashboard },
    { key: "absensi-harian", href: "/admin/absensi-harian", label: "Absensi Harian", icon: ClipboardCheck },
    { key: "pengumuman",   href: "/admin/pengumuman",   label: "Pengumuman",  icon: Megaphone },
    { key: "materi",       href: "/admin/materi",       label: "Materi",      icon: BookOpen },
    { key: "data-siswa",   href: "/admin/data-siswa",   label: "Data Siswa",  icon: Users },
    { key: "catatan-siswa", href: "/admin/catatan-siswa", label: "Catatan Siswa", icon: NotebookPen },
    { key: "manajemen-password", href: "/admin/manajemen-password", label: "Manajemen Password", icon: KeyRound },
    {
      key: "magang", label: "PKL", icon: Briefcase,
      submenu: [
        { href: "/admin/magang/penempatan", label: "Penempatan",    icon: Building2 },
        { href: "/admin/magang/absensi",    label: "Absensi",       icon: ClipboardCheck },
        { href: "/admin/magang/rekap",      label: "Rekap & Laporan", icon: FileBarChart },
      ],
    },
    { key: "ujian-ukk", href: "/admin/ujian-ukk/jadwal-soal", label: "UKK", icon: FileText },
    { key: "pengaturan", href: "/admin/pengaturan", label: "Pengaturan", icon: Settings },
  ],
  GURU: [
    { key: "dashboard",    href: "/guru/dashboard",    label: "Dashboard",   icon: LayoutDashboard },
    { key: "absensi-harian", href: "/guru/absensi-harian", label: "Absensi Harian", icon: ClipboardCheck },
    { key: "pengumuman",   href: "/guru/pengumuman",   label: "Pengumuman",  icon: Megaphone },
    { key: "materi",       href: "/guru/materi",       label: "Materi & Tugas", icon: BookOpen },
    { key: "data-siswa",   href: "/guru/data-siswa",   label: "Data Siswa",  icon: Users },
    { key: "catatan-siswa", href: "/guru/catatan-siswa", label: "Catatan Siswa", icon: NotebookPen },
    {
      key: "magang", label: "PKL", icon: Briefcase,
      submenu: [
        { href: "/guru/magang/penempatan", label: "Penempatan",     icon: Building2 },
        { href: "/guru/magang/absensi",    label: "Absensi",        icon: ClipboardCheck },
        { href: "/guru/magang/rekap",      label: "Rekap & Laporan",icon: FileBarChart },
      ],
    },
    { key: "ujian-ukk", href: "/guru/ujian-ukk/jadwal-soal", label: "UKK", icon: FileText },
  ],
  SISWA: [
    { key: "dashboard",    href: "/siswa/dashboard",    label: "Dashboard",   icon: LayoutDashboard },
    { key: "absensi-harian", href: "/siswa/absensi-harian", label: "Absensi Harian", icon: ClipboardCheck },
    { key: "pengumuman",   href: "/siswa/pengumuman",   label: "Pengumuman",  icon: Megaphone },
    { key: "materi",       href: "/siswa/materi",       label: "Materi",      icon: BookOpen },
    { key: "catatan-siswa", href: "/siswa/catatan-siswa", label: "Catatan Saya", icon: NotebookPen },
    {
      key: "magang", label: "PKL", icon: Briefcase,
      submenu: [
        { href: "/siswa/magang/penempatan", label: "Penempatan", icon: Building2 },
        { href: "/siswa/magang/absensi",    label: "Absensi",    icon: ClipboardCheck },
        { href: "/siswa/magang/rekap",      label: "Rekap",      icon: FileBarChart },
      ],
    },
    {
      key: "ujian-ukk", href: "/siswa/ujian-ukk", label: "UKK", icon: FileText, locked: true,
      submenu: [
        { href: "/siswa/ujian-ukk/jadwal-soal", label: "Jadwal & Soal", icon: CalendarDays },
        { href: "/siswa/ujian-ukk/nilai-saya",  label: "Nilai Saya",    icon: Trophy },
      ],
    },
  ],
};

/**
 * Status akses fitur siswa: PKL/UKK hanya terbuka untuk kelas XII (ditulis
 * romawi "XII RPL 1" atau angka "12 PG 1") dan kalau admin sudah mengaktifkannya
 * di menu Pengaturan.
 */
export function useSiswaFitur(enabled = true) {
  const [kelasXII, setKelasXII] = useState(false);
  const [pengaturan, setPengaturan] = useState({ magangAktif: false, ukkAktif: false });

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    fetch("/api/auth/me", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((me: { siswa?: { kelas?: { nama?: string } } } | null) => {
        if (cancelled) return;
        const namaKelas = me?.siswa?.kelas?.nama?.trim().toUpperCase() ?? "";
        setKelasXII(namaKelas.startsWith("XII") || /^12(?!\d)/.test(namaKelas));
      })
      .catch(() => {});
    fetch("/api/pengaturan", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { magangAktif?: boolean; ukkAktif?: boolean } | null) => {
        if (cancelled || !d) return;
        setPengaturan({ magangAktif: !!d.magangAktif, ukkAktif: !!d.ukkAktif });
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [enabled]);

  return {
    kelasXII,
    magangAktif: pengaturan.magangAktif,
    ukkAktif: pengaturan.ukkAktif,
    /** Tujuan menu PKL: halaman fitur bila aktif, halaman "belum aktif" bila belum. */
    magangHref: kelasXII && pengaturan.magangAktif ? "/siswa/magang/penempatan" : "/siswa/magang",
    ukkHref: kelasXII && pengaturan.ukkAktif ? "/siswa/ujian-ukk/jadwal-soal" : "/siswa/ujian-ukk",
  };
}

export function useDashboardMenu(user: UserPayload): { items: MenuItem[]; pendingResetCount: number } {
  const isSuperAdmin = user.loginId === SUPER_ADMIN_LOGIN_ID;
  const isGuru = user.role === "GURU";
  const isSiswa = user.role === "SISWA";

  const [guruHasMapel, setGuruHasMapel] = useState<boolean | null>(null);
  useEffect(() => {
    if (!isGuru) return;
    let cancelled = false;
    fetch("/api/mapel/saya", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : []))
      .then((list: string[]) => {
        if (!cancelled) setGuruHasMapel(Array.isArray(list) && list.length > 0);
      })
      .catch(() => { if (!cancelled) setGuruHasMapel(true); });
    return () => { cancelled = true; };
  }, [isGuru]);

  const { kelasXII: siswaKelasXII, magangAktif, ukkAktif } = useSiswaFitur(isSiswa);

  const items = (MENUS[user.role] ?? [])
    .filter((item) => {
      if (item.key === "manajemen-password") return isSuperAdmin;
      if (item.key === "materi" && isGuru) return guruHasMapel !== false;
      return true;
    })
    .map((item) => {
      if (!isSiswa || (item.key !== "magang" && item.key !== "ujian-ukk")) return item;
      const fiturAktif = item.key === "magang" ? magangAktif : ukkAktif;
      if (siswaKelasXII && fiturAktif) return { ...item, locked: false, href: undefined };
      return { ...item, locked: true, href: item.key === "magang" ? "/siswa/magang" : "/siswa/ujian-ukk" };
    });

  return { items, pendingResetCount: 0 };
}
