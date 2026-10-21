"use client";

const JAM = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MENIT = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));

/**
 * Input jam format 24 jam (00–23 : 00–59), tanpa AM/PM — tidak bergantung bahasa browser.
 * value & onChange memakai format "HH:mm" seperti <input type="time">.
 */
export function TimeInput24({ value, onChange, className, disabled }: {
  value: string; onChange: (v: string) => void; className?: string; disabled?: boolean;
}) {
  const [h, m] = (value || "").split(":");
  const jam = JAM.includes(h) ? h : "";
  const menit = MENIT.includes(m) ? m : "";
  const set = (nh: string, nm: string) => onChange(`${nh || "00"}:${nm || "00"}`);
  const cls = `${className ?? ""} min-w-0 flex-1 text-center`;
  return (
    <div className="flex w-full items-center gap-1.5">
      <select value={jam} disabled={disabled} onChange={(e) => set(e.target.value, menit)} className={cls} aria-label="Jam">
        {!jam && <option value="">--</option>}
        {JAM.map((x) => <option key={x} value={x}>{x}</option>)}
      </select>
      <span className="font-bold text-slate-400">:</span>
      <select value={menit} disabled={disabled} onChange={(e) => set(jam, e.target.value)} className={cls} aria-label="Menit">
        {!menit && <option value="">--</option>}
        {MENIT.map((x) => <option key={x} value={x}>{x}</option>)}
      </select>
    </div>
  );
}
