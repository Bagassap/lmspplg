import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Turbopack is default in Next.js 16; empty config silences the webpack-mismatch warning.
  // react-pdf is "use client" only, so canvas (pdfjs SSR dep) is never bundled server-side.
  turbopack: {},
  // No `images.remotePatterns`/`domains` needed: every next/image usage in this app
  // (Sidebar logo, login/splash) points at a local /public asset, never a remote URL.
  // The self-hosted /_next/image 400 error was caused by `sharp` (Next's image
  // optimizer, only an optional dependency of `next`) not being guaranteed to install
  // in production — fixed by adding `sharp` directly to package.json dependencies.
};

export default nextConfig;
