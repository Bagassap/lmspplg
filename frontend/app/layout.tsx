import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/shared/ToastSystem";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-montserrat",
  display: "swap",
});

export const metadata: Metadata = {
  title: "LMS PPLG | SMK Ma'arif NU 01 Limpung",
  description:
    "Sistem pembelajaran digital untuk siswa, guru, dan admin jurusan Pengembangan Perangkat Lunak dan Gim SMK Ma'arif NU 01 Limpung.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${montserrat.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-white text-black">
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
