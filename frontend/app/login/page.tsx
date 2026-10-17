import { LoginCard } from "./LoginCard";

export default function LoginPage() {
  return (
    <main className="relative flex min-h-[100dvh] items-end justify-center overflow-hidden bg-[#3E03B3] sm:items-center sm:bg-[#FFFFFF] sm:px-6 sm:py-12">
      <div
        className="pointer-events-none absolute inset-0 hidden sm:block"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(62,3,179,0.045) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />
      <LoginCard />
    </main>
  );
}
