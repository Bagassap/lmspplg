import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { ToastProvider } from "@/components/shared/ToastSystem";
import { PwaInstall } from "@/components/shared/PwaInstall";
import { AppModeFlag } from "@/components/shared/AppModeFlag";
import { PwaReinstallGate } from "@/components/shared/PwaReinstallGate";
import { IconToneRotator } from "@/components/shared/IconToneRotator";

const satoshi = localFont({
  src: [
    {
      path: "./fonts/Satoshi-Variable.woff2",
      weight: "300 900",
      style: "normal",
    },
    {
      path: "./fonts/Satoshi-VariableItalic.woff2",
      weight: "300 900",
      style: "italic",
    },
  ],
  variable: "--font-satoshi",
  display: "swap",
});

// Font jam digital (tujuh segmen, SIL OFL) untuk tampilan jam di menu Absensi.
const digital = localFont({
  src: "./fonts/DSEG7Classic-Bold.woff2",
  weight: "700",
  style: "normal",
  variable: "--font-digital",
  display: "swap",
});

export const metadata: Metadata = {
  title: "LMS PPLG | SMK Ma'arif NU 01 Limpung",
  description:
    "Sistem pembelajaran digital untuk siswa, guru, dan admin jurusan Pengembangan Perangkat Lunak dan Gim SMK Ma'arif NU 01 Limpung.",
  appleWebApp: {
    capable: true,
    title: "LMS PPLG",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#3E03B3",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning className={`${satoshi.variable} ${digital.variable} h-full antialiased`}>
      <head>
        {/* Layar sempit memakai tampilan aplikasi: sembunyikan halaman sampai hidrasi selesai agar tidak sempat terlihat tampilan mobile lama. */}
        <script dangerouslySetInnerHTML={{ __html: 'try{if(window.matchMedia("(max-width:1023px)").matches)document.documentElement.setAttribute("data-boot-mobile","1")}catch(e){}' }} />
        {/* Tandai pembukaan awal aplikasi terpasang sebelum halaman sempat mengalihkan alamat (lihat PwaReinstallGate). */}
        <script dangerouslySetInnerHTML={{ __html: 'try{if(sessionStorage.getItem("lms_pwa_gate")===null){var o=matchMedia("(display-mode: standalone)").matches&&location.pathname==="/"&&new URLSearchParams(location.search).get("pwa")!=="2";sessionStorage.setItem("lms_pwa_gate",o?"old":"ok")}}catch(e){}' }} />
      </head>
      <body className="min-h-full flex flex-col bg-white text-black">
        <ToastProvider>
          {children}
          <PwaInstall />
          <AppModeFlag />
          <IconToneRotator />
          <PwaReinstallGate />
        </ToastProvider>
      </body>
    </html>
  );
}
