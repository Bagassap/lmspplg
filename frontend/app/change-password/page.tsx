import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { ChangePasswordCard } from "./ChangePasswordCard";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

// Which identity-verification field the form asks for (or whether it's
// skipped entirely) is read straight from the session JWT (same claims the
// middleware already trusts to guard this route) — never fetched from a
// value the client could tamper with.
async function getVerificationState(): Promise<{ profileCompleted: boolean; bypassIdentityVerification: boolean }> {
  const token = (await cookies()).get("token")?.value;
  if (!token) return { profileCompleted: false, bypassIdentityVerification: false };
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const p = payload as { profileCompleted?: boolean; bypassIdentityVerification?: boolean };
    return { profileCompleted: !!p.profileCompleted, bypassIdentityVerification: !!p.bypassIdentityVerification };
  } catch {
    return { profileCompleted: false, bypassIdentityVerification: false };
  }
}

export default async function ChangePasswordPage() {
  const { profileCompleted, bypassIdentityVerification } = await getVerificationState();

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
      <ChangePasswordCard profileCompleted={profileCompleted} bypassIdentityVerification={bypassIdentityVerification} />
    </main>
  );
}
