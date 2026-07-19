import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

type JWTPayload = { sub: string; role: string; nama: string; mustChangePassword?: boolean; exp?: number };

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

async function verifyJWT(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as JWTPayload;
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

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token   = request.cookies.get("token")?.value ?? null;
  const payload = token ? await verifyJWT(token) : null;

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

  const impersonating = !!request.cookies.get("impersonation_token")?.value;

  if (pathname === "/change-password") {
    if (impersonating || !payload.mustChangePassword) {
      const dest = ROLE_DASHBOARD[payload.role] ?? "/siswa/dashboard";
      return NextResponse.redirect(new URL(dest, request.url));
    }
    return NextResponse.next();
  }

  if (!impersonating && payload.mustChangePassword) {
    return NextResponse.redirect(new URL("/change-password", request.url));
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
    "/change-password",
    "/admin/:path*",
    "/guru/:path*",
    "/siswa/:path*",
  ],
};
