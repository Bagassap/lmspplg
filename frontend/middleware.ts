import { NextRequest, NextResponse } from "next/server";

type JWTPayload = { sub: string; role: string; nama: string; exp?: number };

function decodeJWT(token: string): JWTPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const raw = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(raw)) as JWTPayload;
    if (payload.exp && payload.exp * 1000 < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

const ROLE_DASHBOARD: Record<string, string> = {
  ADMIN: "/admin/dashboard",
  GURU:  "/guru/dashboard",
  SISWA: "/siswa/dashboard",
};

const ROLE_PREFIX: Record<string, string> = {
  ADMIN: "/admin",
  GURU:  "/guru",
  SISWA: "/siswa",
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token   = request.cookies.get("token")?.value ?? null;
  const payload = token ? decodeJWT(token) : null;

  if (pathname === "/login") {
    if (payload) {
      const dest = ROLE_DASHBOARD[payload.role] ?? "/siswa/dashboard";
      return NextResponse.redirect(new URL(dest, request.url));
    }
    return NextResponse.next();
  }

  if (pathname === "/dashboard") {
    if (!payload) return NextResponse.redirect(new URL("/login", request.url));
    const dest = ROLE_DASHBOARD[payload.role] ?? "/siswa/dashboard";
    return NextResponse.redirect(new URL(dest, request.url));
  }

  if (!payload) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const expected = ROLE_PREFIX[payload.role];
  if (expected && !pathname.startsWith(expected)) {
    const dest = ROLE_DASHBOARD[payload.role] ?? "/siswa/dashboard";
    return NextResponse.redirect(new URL(dest, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/login",
    "/dashboard",
    "/admin/:path*",
    "/guru/:path*",
    "/siswa/:path*",
  ],
};
