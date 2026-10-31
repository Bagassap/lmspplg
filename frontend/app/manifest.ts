import type { MetadataRoute } from "next";

const ICON_VERSION = 2;
const PWA_VERSION = "2";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "LMS PPLG | SMK Ma'arif NU 01 Limpung",
    short_name: "LMS PPLG",
    description:
      "Sistem pembelajaran digital untuk siswa, guru, dan admin jurusan Pengembangan Perangkat Lunak dan Gim SMK Ma'arif NU 01 Limpung.",
    lang: "id",
    start_url: `/?pwa=${PWA_VERSION}`,
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#FFFFFF",
    theme_color: "#3E03B3",
    categories: ["education"],
    icons: [
      { src: `/icon-192.png?v=${ICON_VERSION}`, sizes: "192x192", type: "image/png", purpose: "any" },
      { src: `/icon-512.png?v=${ICON_VERSION}`, sizes: "512x512", type: "image/png", purpose: "any" },
      { src: `/icon-maskable-192.png?v=${ICON_VERSION}`, sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: `/icon-maskable-512.png?v=${ICON_VERSION}`, sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
