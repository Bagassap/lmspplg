import { Lock } from "lucide-react";

export function KuotaTerpenuhiChip({ label = "Kuota terpenuhi" }: { label?: string }) {
  return (
    <span className="inline-flex w-fit shrink-0 items-center gap-1 rounded-lg px-2 py-0.5 text-[10px] font-bold" style={{ background: "#FEE2E2", color: "#DC2626" }}>
      <Lock size={10} /> {label}
    </span>
  );
}
