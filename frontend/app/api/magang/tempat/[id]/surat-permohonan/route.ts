import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const BACKEND = process.env.BACKEND_URL || "http://localhost:3001";
const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const token = (await cookies()).get("token")?.value;
  if (!token) return NextResponse.json({ message: "Tidak terautentikasi" }, { status: 401 });

  let res: Response;
  try {
    res = await fetch(`${BACKEND}/api/magang/tempat/${encodeURIComponent(id)}/surat-permohonan`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
  } catch {
    return NextResponse.json({ message: "Server tidak dapat dijangkau" }, { status: 502 });
  }

  if (!res.ok || !res.body) {
    const data = await res.json().catch(() => null);
    return NextResponse.json(data ?? { message: "Gagal membuat surat" }, { status: res.status || 500 });
  }

  const headers = new Headers();
  headers.set("Content-Type", DOCX_MIME);
  headers.set("Content-Disposition", res.headers.get("content-disposition") ?? 'attachment; filename="Surat_Permohonan_PKL.docx"');
  return new NextResponse(res.body, { status: 200, headers });
}
