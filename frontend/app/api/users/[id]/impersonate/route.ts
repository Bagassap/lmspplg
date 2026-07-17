import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    return NextResponse.json({ message: "Tidak terautentikasi" }, { status: 401 });
  }

  if (cookieStore.get("impersonation_token")?.value) {
    return NextResponse.json(
      { message: "Sudah dalam mode pemantauan, tidak dapat memantau bertingkat" },
      { status: 400 },
    );
  }

  let backendRes: Response;
  try {
    backendRes = await fetch(`${BACKEND_URL}/api/users/${id}/impersonate`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    return NextResponse.json(
      { message: "Server tidak dapat dijangkau" },
      { status: 502 },
    );
  }

  const data = await backendRes.json().catch(() => null);

  if (!backendRes.ok || !data) {
    return NextResponse.json(
      { message: data?.message || "Gagal memulai mode pemantauan" },
      { status: backendRes.status || 400 },
    );
  }

  const cookieOpts = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
  };

  cookieStore.set("impersonation_token", token, cookieOpts);
  cookieStore.set("token", data.access_token, cookieOpts);

  return NextResponse.json({ success: true, redirectTo: data.redirectTo }, { status: 200 });
}
