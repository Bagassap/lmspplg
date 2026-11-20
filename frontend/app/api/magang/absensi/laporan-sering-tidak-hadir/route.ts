import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const BACKEND = process.env.BACKEND_URL || "http://localhost:3001";

async function getToken() {
  const s = await cookies();
  return s.get("token")?.value;
}

export async function GET(request: Request) {
  const token = await getToken();
  if (!token) return NextResponse.json({ message: "Tidak terautentikasi" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const periode = searchParams.get("periode") ?? "";
  const tempatMagangId = searchParams.get("tempatMagangId") ?? "";

  const qs = new URLSearchParams();
  if (periode) qs.set("periode", periode);
  if (tempatMagangId) qs.set("tempatMagangId", tempatMagangId);

  try {
    const res = await fetch(`${BACKEND}/api/magang/absensi/laporan-sering-tidak-hadir?${qs}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    return NextResponse.json(await res.json().catch(() => null), { status: res.status });
  } catch {
    return NextResponse.json({ message: "Server tidak dapat dijangkau" }, { status: 502 });
  }
}
