import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { ChangePasswordCard } from "./ChangePasswordCard";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

// Which identity-verification field the form asks for depends on
// profileCompleted, read straight from the session JWT (same claim the
// middleware already trusts to guard this route) — never fetched from a
// value the client could tamper with.
async function getProfileCompleted(): Promise<boolean> {
  const token = (await cookies()).get("token")?.value;
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return !!(payload as { profileCompleted?: boolean }).profileCompleted;
  } catch {
    return false;
  }
}

export default async function ChangePasswordPage() {
  const profileCompleted = await getProfileCompleted();

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#F0F2FA] px-4 py-12 sm:px-6">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(151,125,255,0.045) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />
      <ChangePasswordCard profileCompleted={profileCompleted} />
    </main>
  );
}
