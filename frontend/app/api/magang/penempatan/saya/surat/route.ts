import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const BACKEND = process.env.BACKEND_URL || "http://localhost:3001";

export async function POST(req: Request) {
  const token = (await cookies()).get("token")?.value;
  if (!token) return NextResponse.json({ message: "Tidak terautentikasi" }, { status: 401 });
  const formData = await req.formData();
  try {
    const res = await fetch(`${BACKEND}/api/magang/penempatan/saya/surat`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    return NextResponse.json(await res.json().catch(() => null), { status: res.status });
  } catch {
    return NextResponse.json({ message: "Server tidak dapat dijangkau" }, { status: 502 });
  }
}
