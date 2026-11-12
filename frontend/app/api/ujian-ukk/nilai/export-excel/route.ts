import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const BACKEND = process.env.BACKEND_URL || "http://localhost:3001";

export async function GET() {
  const token = (await cookies()).get("token")?.value;
  if (!token) return NextResponse.json({ message: "Tidak terautentikasi" }, { status: 401 });

  let res: Response;
  try {
    res = await fetch(`${BACKEND}/api/ujian-ukk/nilai/export-excel`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
  } catch {
    return NextResponse.json({ message: "Server tidak dapat dijangkau" }, { status: 502 });
  }

  if (!res.ok || !res.body) {
    const data = await res.json().catch(() => null);
    return NextResponse.json(data ?? { message: "Gagal membuat Excel" }, { status: res.status || 500 });
  }

  const headers = new Headers();
  headers.set("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  headers.set("Content-Disposition", res.headers.get("content-disposition") ?? 'attachment; filename="Nilai_UKK_Semua_Siswa.xlsx"');
  return new NextResponse(res.body, { status: 200, headers });
}
