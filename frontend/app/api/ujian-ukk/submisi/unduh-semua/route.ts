import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const BACKEND = process.env.BACKEND_URL || "http://localhost:3001";

// Mengalirkan ZIP semua berkas pengumpulan UKK (admin/guru) dari backend ke browser.
export async function GET(request: Request) {
  const token = (await cookies()).get("token")?.value;
  if (!token) return NextResponse.json({ message: "Tidak terautentikasi" }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const qs = new URLSearchParams();
  for (const k of ["tahapanId", "kelasId"]) {
    const v = searchParams.get(k);
    if (v) qs.set(k, v);
  }
  try {
    const res = await fetch(`${BACKEND}/api/ujian-ukk/submisi/unduh-semua?${qs.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok || !res.body) {
      return NextResponse.json(await res.json().catch(() => ({ message: "Gagal mengunduh" })), { status: res.status });
    }
    const headers = new Headers();
    headers.set("Content-Type", "application/zip");
    const cd = res.headers.get("content-disposition");
    if (cd) headers.set("Content-Disposition", cd);
    return new NextResponse(res.body, { status: 200, headers });
  } catch {
    return NextResponse.json({ message: "Server tidak dapat dijangkau" }, { status: 502 });
  }
}
