import { LoginCard } from "./LoginCard";

export default function LoginPage() {
  return (
    <main className="relative flex min-h-[100dvh] items-end justify-center overflow-hidden bg-[#0082FB] sm:items-center sm:bg-[#F1F5F8] sm:px-6 sm:py-12">
      <div
        className="pointer-events-none absolute inset-0 hidden sm:block"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(0,130,251,0.045) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />
      <LoginCard />
    </main>
  );
}
