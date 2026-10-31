import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.BACKEND_URL || "http://localhost:3001";

// Menayangkan satu berkas di dalam arsip pengumpulan secara inline (teks/gambar/PDF).
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = (await cookies()).get("token")?.value;
  if (!token) return NextResponse.json({ message: "Tidak terautentikasi" }, { status: 401 });
  const { id } = await params;
  const path = request.nextUrl.searchParams.get("path") ?? "";
  try {
    const res = await fetch(`${BACKEND}/api/ujian-ukk/submisi/${encodeURIComponent(id)}/isi/berkas?path=${encodeURIComponent(path)}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) return NextResponse.json(await res.json().catch(() => ({ message: "Gagal membuka berkas" })), { status: res.status });
    const headers = new Headers();
    headers.set("Content-Type", res.headers.get("content-type") ?? "text/plain; charset=utf-8");
    headers.set("Content-Disposition", "inline");
    headers.set("X-Content-Type-Options", "nosniff");
    headers.set("Content-Security-Policy", "sandbox; default-src 'none'; img-src 'self' data:; style-src 'unsafe-inline'");
    headers.set("Cache-Control", "no-store");
    return new NextResponse(await res.arrayBuffer(), { status: 200, headers });
  } catch {
    return NextResponse.json({ message: "Server tidak dapat dijangkau" }, { status: 502 });
  }
}
