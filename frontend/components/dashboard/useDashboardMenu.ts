"use client";

import { useEffect, useState } from "react";
import {
  LayoutDashboard, Bell, Users, Briefcase,
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

// Sumber tunggal daftar menu per role — dipakai Sidebar (desktop) & bottom
// nav mobile supaya keduanya tidak pernah drift satu sama lain.
export const MENUS: Record<string, MenuItem[]> = {
  ADMIN: [
    { key: "dashboard",    href: "/admin/dashboard",    label: "Dashboard",   icon: LayoutDashboard },
    { key: "absensi-harian", href: "/admin/absensi-harian", label: "Absensi Harian", icon: ClipboardCheck },
    { key: "pengumuman",   href: "/admin/pengumuman",   label: "Pengumuman",  icon: Bell },
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
    { key: "pengumuman",   href: "/guru/pengumuman",   label: "Pengumuman",  icon: Bell },
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
    { key: "pengumuman",   href: "/siswa/pengumuman",   label: "Pengumuman",  icon: Bell },
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

export function useDashboardMenu(user: UserPayload): { items: MenuItem[]; pendingResetCount: number } {
  const isSuperAdmin = user.loginId === SUPER_ADMIN_LOGIN_ID;
  const isGuru = user.role === "GURU";
  const isSiswa = user.role === "SISWA";

  // null = belum diketahui (belum selesai fetch) — selama itu menu Materi
  // tetap ditampilkan agar tidak flicker untuk mayoritas guru yang punya mapel;
  // baru disembunyikan begitu terkonfirmasi guru ini tidak diampu mapel apa pun.
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

  // PKL & UKK cuma relevan buat siswa kelas XII — kelas X/XI tetap lihat menu
  // ini (biar tahu fiturnya ada) tapi terkunci ke halaman "Coming Soon", lalu
  // otomatis kebuka sendiri begitu siswa naik ke XII (kenaikan kelas ganti
  // kelasId-nya, tidak perlu toggle manual apa pun). Default false (terkunci)
  // selama status kelas belum dikonfirmasi, supaya X/XI tidak sempat kelihatan
  // submenu asli walau sekejap. Tidak berlaku untuk guru/admin — sisi admin
  // (mis. Tempatkan Siswa) tetap menampilkan siswa dari semua kelas.
  const [siswaKelasXII, setSiswaKelasXII] = useState(false);
  useEffect(() => {
    if (!isSiswa) return;
    let cancelled = false;
    fetch("/api/auth/me", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((me: { siswa?: { kelas?: { nama?: string } } } | null) => {
        if (cancelled) return;
        const namaKelas = me?.siswa?.kelas?.nama?.trim().toUpperCase() ?? "";
        setSiswaKelasXII(namaKelas.startsWith("XII"));
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [isSiswa]);

  // Selain kelas XII, menu Magang/UKK juga butuh saklar admin menyala (menu
  // Pengaturan) — periode PKL/UKK beda tiap tahun ajaran & tidak berdasarkan
  // tanggal tetap, jadi kelas XII saja tidak cukup untuk membuka menunya.
  // Default false (terkunci) selama belum dikonfirmasi, sama seperti
  // siswaKelasXII di atas.
  const [pengaturan, setPengaturan] = useState({ magangAktif: false, ukkAktif: false });
  useEffect(() => {
    if (!isSiswa) return;
    let cancelled = false;
    fetch("/api/pengaturan", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { magangAktif?: boolean; ukkAktif?: boolean } | null) => {
        if (cancelled || !d) return;
        setPengaturan({ magangAktif: !!d.magangAktif, ukkAktif: !!d.ukkAktif });
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [isSiswa]);

  const items = (MENUS[user.role] ?? [])
    .filter((item) => {
      if (item.key === "manajemen-password") return isSuperAdmin;
      if (item.key === "materi" && isGuru) return guruHasMapel !== false;
      return true;
    })
    .map((item) => {
      if (!isSiswa || (item.key !== "magang" && item.key !== "ujian-ukk")) return item;
      const fiturAktif = item.key === "magang" ? pengaturan.magangAktif : pengaturan.ukkAktif;
      if (siswaKelasXII && fiturAktif) return { ...item, locked: false, href: undefined };
      return { ...item, locked: true, href: item.key === "magang" ? "/siswa/magang" : "/siswa/ujian-ukk" };
    });

  const [pendingResetCount, setPendingResetCount] = useState(0);
  useEffect(() => {
    if (!isSuperAdmin) return;
    let cancelled = false;
    fetch("/api/users/password-reset-requests", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : []))
      .then((list: { status: string }[]) => {
        if (!cancelled && Array.isArray(list)) {
          setPendingResetCount(list.filter((r) => r.status === "PENDING").length);
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [isSuperAdmin]);

  return { items, pendingResetCount };
}
