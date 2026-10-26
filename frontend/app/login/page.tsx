import type { Viewport } from "next";
import { LoginCard } from "./LoginCard";

// Bilah status HP di halaman login ikut abu-abu (bawaan aplikasi: ungu).
export const viewport: Viewport = { themeColor: "#E5E7EB" };

export default function LoginPage() {
  return (
    <main className="fixed inset-0 flex items-end overscroll-none sm:relative sm:inset-auto sm:min-h-[100dvh] justify-center overflow-hidden bg-[#E5E7EB] sm:items-center dark:bg-[#1F2937] sm:px-6 sm:py-12">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(71,85,105,0.14) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />
      <LoginCard />
    </main>
  );
}
