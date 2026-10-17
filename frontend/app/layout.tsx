import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { ToastProvider } from "@/components/shared/ToastSystem";
import { PwaInstall } from "@/components/shared/PwaInstall";

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
    <html lang="id" className={`${satoshi.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-white text-black">
        <ToastProvider>
          {children}
          <PwaInstall />
        </ToastProvider>
      </body>
    </html>
  );
}
