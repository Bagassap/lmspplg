import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Turbopack is default in Next.js 16; empty config silences the webpack-mismatch warning.
  // react-pdf is "use client" only, so canvas (pdfjs SSR dep) is never bundled server-side.
  turbopack: {},
};

export default nextConfig;
