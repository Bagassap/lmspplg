import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { tokenCookieOptions } from "@/lib/authCookie";

export async function POST(request: Request) {
  const cookieStore = await cookies();

  cookieStore.set("token", "", { ...tokenCookieOptions(request), maxAge: 0 });

  return NextResponse.json({ ok: true });
}
