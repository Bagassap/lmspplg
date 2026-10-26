"use client";

import { useEffect, useState } from "react";

const BULAN = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
const pad = (n: number) => String(n).padStart(2, "0");

function parse(v: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(v || "");
  return m ? { y: m[1], m: m[2], d: m[3] } : { y: "", m: "", d: "" };
}

/**
 * Input tanggal format Indonesia (tanggal / bulan / tahun) — tidak bergantung bahasa browser,
 * tidak seperti <input type="date"> yang bisa tampil bulan/tanggal/tahun.
 * value & onChange memakai format "YYYY-MM-DD" ("" bila belum lengkap).
 */
export function DateInputID({ value, onChange, className, required, disabled, birth, min, max }: {
  value: string; onChange: (v: string) => void; className?: string; required?: boolean; disabled?: boolean;
  /** rentang tahun untuk tanggal lahir (30 tahun ke belakang s.d. tahun ini) */
  birth?: boolean; min?: string; max?: string;
}) {
  const [p, setP] = useState(() => parse(value));
  useEffect(() => { setP(parse(value)); }, [value]);

  const now = new Date().getFullYear();
  let y1 = birth ? now - 30 : now - 3;
  let y2 = birth ? now : now + 6;
  if (min && /^\d{4}/.test(min)) y1 = Math.max(y1, Number(min.slice(0, 4)));
  if (max && /^\d{4}/.test(max)) y2 = Math.min(y2, Number(max.slice(0, 4)));
  const cur = Number(p.y);
  if (cur && cur < y1) y1 = cur;
  if (cur && cur > y2) y2 = cur;
  const tahun: string[] = [];
  for (let y = y2; y >= y1; y--) tahun.push(String(y));

  const hariMaks = p.y && p.m ? new Date(Number(p.y), Number(p.m), 0).getDate() : 31;

  function update(next: { y: string; m: string; d: string }) {
    let { y, m, d } = next;
    if (y && m && d) {
      const maks = new Date(Number(y), Number(m), 0).getDate();
      if (Number(d) > maks) d = pad(maks);
    }
    setP({ y, m, d });
    onChange(y && m && d ? `${y}-${m}-${d}` : "");
  }

  // margin dipindah ke pembungkus; lebar & padding diatur sendiri supaya muat di kolom sempit
  const tokens = (className ?? "").split(/\s+/).filter(Boolean);
  const wrapCls = tokens.filter((t) => /^-?m[trblxy]?-/.test(t)).join(" ");
  const cls = `${tokens.filter((t) => !/^-?m[trblxy]?-/.test(t) && !/^(w|min-w|max-w|p[xlr]?)-/.test(t)).join(" ")} w-full min-w-0 px-1.5 text-center`;
  return (
    <div className={`grid w-full items-center gap-1 ${wrapCls}`} style={{ gridTemplateColumns: "minmax(0,0.85fr) minmax(0,1.15fr) minmax(0,1.1fr)" }}>
      <select aria-label="Tanggal" required={required} disabled={disabled} value={p.d} onChange={(e) => update({ ...p, d: e.target.value })} className={cls}>
        <option value="">Tgl</option>
        {Array.from({ length: hariMaks }, (_, i) => pad(i + 1)).map((x) => <option key={x} value={x}>{Number(x)}</option>)}
      </select>
      <select aria-label="Bulan" required={required} disabled={disabled} value={p.m} onChange={(e) => update({ ...p, m: e.target.value })} className={cls}>
        <option value="">Bulan</option>
        {BULAN.map((n, i) => <option key={n} value={pad(i + 1)}>{n}</option>)}
      </select>
      <select aria-label="Tahun" required={required} disabled={disabled} value={p.y} onChange={(e) => update({ ...p, y: e.target.value })} className={cls}>
        <option value="">Tahun</option>
        {tahun.map((x) => <option key={x} value={x}>{x}</option>)}
      </select>
    </div>
  );
}
