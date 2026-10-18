"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, Lock, LogOut, Moon, Sun, UserCircle, CreditCard } from "lucide-react";
import type { UserPayload } from "@/lib/auth";
import { AppProfileCard } from "@/components/app/AppProfileCard";
import { icon3dStyle, toneAt } from "@/components/shared/Icon3D";
import { KARTU_PELAJAR_URL } from "@/components/shared/KartuPelajarBanner";
import { useDashboardMenu, type MenuItem } from "@/components/dashboard/useDashboardMenu";
import { AppCard } from "@/components/app/AppUI";

// Sudah ada di bilah bawah, jadi tidak diulang di daftar menu.
const SKIP_KEYS = ["dashboard", "absensi-harian", "materi", "pengumuman"];

function Row({ href, icon: Icon, label, hint, tone, badge, locked, onClick, external }: {
  href?: string; icon: React.ElementType; label: string; hint?: string; tone: number;
  badge?: number; locked?: boolean; onClick?: () => void; external?: boolean;
}) {
  const body = (
    <>
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl" style={icon3dStyle(toneAt(tone))}>
        <Icon size={20} color="#fff" />
      </span>
      <div className="min-w-0 flex-1 text-left">
        <p className="truncate text-[15px] font-bold text-slate-900 dark:text-white">{label}</p>
        {hint && <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">{hint}</p>}
      </div>
      {!!badge && badge > 0 && (
        <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-[#F26A3D] px-1.5 text-[10px] font-bold text-white">
          {badge > 99 ? "99+" : badge}
        </span>
      )}
      {locked ? <Lock size={16} className="shrink-0 text-slate-300" /> : <ChevronRight size={18} className="shrink-0 text-slate-300" />}
    </>
  );
  const cls = "flex w-full items-center gap-3 px-4 py-3 active:bg-[#F1EDFA] dark:active:bg-white/5";
  if (href && external) return <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>{body}</a>;
  if (href) return <Link href={href} className={cls}>{body}</Link>;
  return <button type="button" onClick={onClick} className={cls}>{body}</button>;
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <p className="px-1 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">{title}</p>
      <AppCard className="divide-y divide-slate-100 overflow-hidden !p-0 dark:divide-white/5">{children}</AppCard>
    </section>
  );
}

/**
 * Halaman "Menu" mode aplikasi: kepala profil + daftar menu bergrup + tombol
 * keluar. Menggantikan bottom sheet "Lainnya" di versi lama.
 */
export function AppMenuPage({ user }: { user: UserPayload }) {
  const { items, pendingResetCount } = useDashboardMenu(user);
  const [dark, setDark] = useState(false);
  const [out, setOut] = useState(false);

  useEffect(() => { setDark(document.documentElement.classList.contains("dark")); }, []);

  function toggleDark() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try { localStorage.setItem("theme", next ? "dark" : "light"); } catch {}
  }

  async function logout() {
    setOut(true);
    try { sessionStorage.removeItem("lms_session"); } catch {}
    try { localStorage.removeItem("lms_last_path"); } catch {}
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.replace("/login");
  }

  const list = items.filter((i) => !SKIP_KEYS.includes(i.key));
  const single = list.filter((i) => !i.submenu || i.locked);
  const grouped = list.filter((i): i is MenuItem & { submenu: NonNullable<MenuItem["submenu"]> } => !!i.submenu && !i.locked);
  let n = 0;

  return (
    <div className="space-y-5 pb-4">
      <AppProfileCard fallback={{ nama: user.nama, fotoProfil: user.fotoProfil, role: user.role }} />

      <Group title="Akun">
        {user.role === "SISWA" && <Row href="/siswa/profil" icon={UserCircle} label="Profil Saya" hint="Data diri dan foto profil" tone={n++} />}
        {user.role === "SISWA" && <Row href={KARTU_PELAJAR_URL} external icon={CreditCard} label="Kartu Pelajar Digital" hint="Buka kartu pelajar" tone={n++} />}
        <Row icon={dark ? Sun : Moon} label={dark ? "Mode Terang" : "Mode Gelap"} hint="Ubah tampilan aplikasi" tone={n++} onClick={toggleDark} />
      </Group>

      {single.length > 0 && (
        <Group title="Menu">
          {single.map((m) => (
            <Row key={m.key} href={m.href} icon={m.icon} label={m.label} tone={n++} locked={m.locked}
              badge={m.key === "manajemen-password" ? pendingResetCount : undefined} />
          ))}
        </Group>
      )}

      {grouped.map((g) => (
        <Group key={g.key} title={g.label}>
          {g.submenu.map((s) => <Row key={s.href} href={s.href} icon={s.icon} label={s.label} tone={n++} />)}
        </Group>
      ))}

      <button type="button" onClick={logout} disabled={out}
        className="flex w-full items-center justify-center gap-2 rounded-full py-3.5 text-sm font-bold text-white disabled:opacity-60"
        style={{ background: "#3E03B3", boxShadow: "0 10px 24px -8px rgba(62,3,179,0.55)" }}>
        <LogOut size={18} /> {out ? "Keluar..." : "Keluar"}
      </button>
      <p className="text-center text-[11px] text-slate-400">LMS PPLG • SMK Ma&apos;arif NU 01 Limpung</p>
    </div>
  );
}
