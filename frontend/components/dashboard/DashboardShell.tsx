"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { MobileBottomNav } from "./MobileBottomNav";
import { ImpersonationBanner } from "./ImpersonationBanner";
import type { UserPayload } from "@/lib/auth";
import { useIsAppMode } from "@/lib/pwaInstall";

export function DashboardShell({
  user,
  children,
}: {
  user: UserPayload;
  children: React.ReactNode;
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  // ingat pilihan sidebar tertutup/terbuka antar halaman dan reload
  useEffect(() => {
    try { if (localStorage.getItem("lms_sidebar_collapsed") === "1") setSidebarCollapsed(true); } catch {}
  }, []);
  const toggleSidebar = () => setSidebarCollapsed((v) => {
    const next = !v;
    try { localStorage.setItem("lms_sidebar_collapsed", next ? "1" : "0"); } catch {}
    return next;
  });
  const pathname = usePathname();
  const appMode = useIsAppMode();

  useEffect(() => {
    if (!sessionStorage.getItem("lms_session")) {
      fetch("/api/auth/logout", { method: "POST" }).finally(() => {
        window.location.replace("/login");
      });
    }
  }, []);

  useEffect(() => {
    try { localStorage.setItem("lms_last_path", pathname); } catch {}
  }, [pathname]);

  return (
    <div className="flex min-h-screen">
      <Sidebar
        user={user}
        open={false}
        collapsed={sidebarCollapsed}
        onClose={() => {}}
        onToggleCollapse={toggleSidebar}
      />

      <div
        className={[
          "flex min-w-0 flex-1 flex-col bg-surface transition-[padding] duration-300 ease-in-out dark:bg-[#0F172A]",
          sidebarCollapsed ? "lg:pl-0" : "lg:pl-64",
        ].join(" ")}
      >
        <ImpersonationBanner impersonatedBy={user.impersonatedBy} nama={user.nama} />
        <Topbar user={user} sidebarCollapsed={sidebarCollapsed} onOpenSidebar={toggleSidebar} />
        <main className={`mx-auto w-full max-w-screen-2xl p-4 md:p-6 lg:pb-6 2xl:p-10 ${appMode ? "pb-36" : "pb-24"}`}>{children}</main>
      </div>

      <MobileBottomNav user={user} />
    </div>
  );
}
