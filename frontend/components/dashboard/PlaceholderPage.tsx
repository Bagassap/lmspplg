export function PlaceholderPage({
  title,
  badge,
  badgeVariant = "kelola",
  icon: Icon,
}: {
  title: string;
  badge: string;
  badgeVariant?: "kelola" | "lihat" | "sendiri";
  icon: React.ComponentType<{ size?: number; className?: string }>;
}) {
  const badgeStyle =
    badgeVariant === "kelola"
      ? "bg-[#3E03B3]/15 text-[#3E03B3]"
      : badgeVariant === "lihat"
        ? "bg-[#3E03B3]/10 text-[#3E03B3]"
        : "bg-[#00AAFA]/15 text-[#00AAFA]";

  return (
    <div>
      {/* Tampilan aplikasi terpasang (ditampilkan lewat CSS html[data-app-mode]) */}
      <div className="app-only space-y-5">
        <div>
          <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">Segera hadir</p>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">{title}</h1>
        </div>
        <div className="flex flex-col items-center gap-3 rounded-3xl bg-white px-6 py-12 text-center shadow-[0_4px_16px_-6px_rgba(15,23,42,0.14)] dark:bg-[#1E293B]">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: "#F1EDFA", color: "#3E03B3" }}>
            <Icon size={24} />
          </span>
          <p className="text-sm font-bold text-slate-800 dark:text-slate-100">Fitur dalam pengembangan</p>
          <p className="max-w-sm text-xs text-slate-500 dark:text-slate-400">Halaman ini akan segera tersedia.</p>
        </div>
      </div>
      <div className="app-hide flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white/60 py-20 text-center dark:border-slate-700/50 dark:bg-slate-800/40">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
          <Icon size={26} className="text-primary" />
        </div>
        <p className="font-medium text-slate-500 dark:text-slate-400">{title}</p>
        <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">Fitur dalam pengembangan</p>
      </div>
    </div>
  );
}
