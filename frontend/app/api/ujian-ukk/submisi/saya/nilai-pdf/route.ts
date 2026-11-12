import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const BACKEND = process.env.BACKEND_URL || "http://localhost:3001";

export async function GET(request: Request) {
  const token = (await cookies()).get("token")?.value;
  if (!token) return NextResponse.json({ message: "Tidak terautentikasi" }, { status: 401 });

  const submisiId = new URL(request.url).searchParams.get("submisiId") ?? "";
  const qs = submisiId ? `?submisiId=${encodeURIComponent(submisiId)}` : "";

  let res: Response;
  try {
    res = await fetch(`${BACKEND}/api/ujian-ukk/submisi/saya/nilai-pdf${qs}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
  } catch {
    return NextResponse.json({ message: "Server tidak dapat dijangkau" }, { status: 502 });
  }

  if (!res.ok || !res.body) {
    const data = await res.json().catch(() => null);
    return NextResponse.json(data ?? { message: "Gagal membuat PDF" }, { status: res.status || 500 });
  }

  const headers = new Headers();
  headers.set("Content-Type", "application/pdf");
  headers.set("Content-Disposition", res.headers.get("content-disposition") ?? 'attachment; filename="Nilai_UKK.pdf"');
  return new NextResponse(res.body, { status: 200, headers });
}
