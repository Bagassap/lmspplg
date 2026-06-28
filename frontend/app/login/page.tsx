import { LoginCard } from "./LoginCard";

export default function LoginPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#F0F2FA] px-4 py-12 sm:px-6">
      {/* subtle dot-grid texture */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(151,125,255,0.045) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />
      <LoginCard />
    </main>
  );
}
