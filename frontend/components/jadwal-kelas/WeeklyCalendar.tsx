"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import { User, MapPin, Clock, Zap, BookOpen } from "lucide-react";

export type JadwalItem = {
  id: string;
  hari: string;
  jamMulai: string;
  jamSelesai: string;
  mataPelajaran: string;
  kelas: string;
  ruangan?: string | null;
  guru: { id: string; user: { id: string; nama: string } };
};

type Props = {
  data: JadwalItem[];
  loading?: boolean;
  readonly?: boolean;
  highlightNow?: boolean;
  onCellClick?: (hari: string, jam: string) => void;
  onCardClick?: (item: JadwalItem) => void;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const DAYS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"];
const DAY_MAP = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const START_HOUR = 7;
const END_HOUR = 17;
const HOUR_PX = 80;
const GRID_H = (END_HOUR - START_HOUR) * HOUR_PX;
const HOURS = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => i + START_HOUR);

// ─── Elegant palette: tinted bg + strong strip + dark readable text ───────────

const COLORS = [
  { strip: "#6334F4", bg: "#F3EFFE", text: "#4B25B9", badge: "#EDE5FD" },
  { strip: "#FF3644", bg: "#FEE8EA", text: "#CC1A26", badge: "#FCCFD2" },
  { strip: "#D97706", bg: "#FFFBEB", text: "#92400E", badge: "#FEF3C7" },
  { strip: "#FF7867", bg: "#FFF3F1", text: "#CC4535", badge: "#FFE4DF" },
  { strip: "#059669", bg: "#ECFDF5", text: "#065F46", badge: "#D1FAE5" },
  { strip: "#1D4ED8", bg: "#EFF6FF", text: "#1E3A8A", badge: "#DBEAFE" },
  { strip: "#9333EA", bg: "#FAF5FF", text: "#6B21A8", badge: "#F3E8FF" },
  { strip: "#DB2777", bg: "#FDF2F8", text: "#9D174D", badge: "#FCE7F3" },
];

function cardColor(name: string) {
  let h = 0;
  for (const c of name) h = ((h * 31 + c.charCodeAt(0)) & 0x7fffffff);
  return COLORS[h % COLORS.length];
}

function parseMins(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function getTopPx(jam: string): number {
  return (parseMins(jam) - START_HOUR * 60) * (HOUR_PX / 60);
}

function getHeightPx(start: string, end: string): number {
  return Math.max((parseMins(end) - parseMins(start)) * (HOUR_PX / 60), 36);
}

function nowTopPx(): number {
  const n = new Date();
  return (n.getHours() * 60 + n.getMinutes() - START_HOUR * 60) * (HOUR_PX / 60);
}

function isNowActive(hari: string, mulai: string, selesai: string): boolean {
  const n = new Date();
  if (hari !== DAY_MAP[n.getDay()]) return false;
  const mins = n.getHours() * 60 + n.getMinutes();
  return mins >= parseMins(mulai) && mins < parseMins(selesai);
}

function getDayDate(dayName: string): string {
  const today = new Date();
  const targetIdx = DAY_MAP.indexOf(dayName);
  if (targetIdx === -1) return "";
  const d = new Date(today);
  d.setDate(today.getDate() + (targetIdx - today.getDay()));
  return d.getDate().toString();
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
      <div style={{ minWidth: 680 }}>
        <div className="flex border-b border-gray-100 bg-gray-50/60 px-3 py-3">
          <div className="w-14 shrink-0" />
          {DAYS.map((d) => (
            <div key={d} className="flex-1 px-2">
              <div className="mx-auto h-8 w-14 animate-pulse rounded-xl bg-gray-200" />
            </div>
          ))}
        </div>
        <div className="flex px-3">
          <div className="w-14 shrink-0" />
          {DAYS.map((d) => (
            <div key={d} className="flex-1 space-y-3 px-1.5 py-4">
              {[88, 88, 88].map((h, i) => (
                <div
                  key={i}
                  className="animate-pulse rounded-xl bg-gray-100"
                  style={{ height: h, animationDelay: `${i * 80}ms` }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Summary bar ──────────────────────────────────────────────────────────────

function SummaryBar({ data }: { data: JadwalItem[] }) {
  const counts = DAYS.map((d) => ({
    day: d,
    count: data.filter((j) => j.hari === d).length,
  }));
  const total = data.length;
  const uniqueSubjects = new Set(data.map((j) => j.mataPelajaran)).size;

  return (
    <div className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-sm">
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#6334F4]/10">
          <Zap size={13} className="text-[#6334F4]" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-extrabold text-gray-800">{total}</span>
          <span className="text-xs text-gray-400">jadwal</span>
          <span className="text-gray-300">·</span>
          <span className="text-sm font-extrabold text-gray-800">{uniqueSubjects}</span>
          <span className="text-xs text-gray-400">mata pelajaran</span>
        </div>
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        {counts.map(({ day, count }) => (
          <div
            key={day}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-[10px] font-extrabold transition-colors"
            style={
              count > 0
                ? { backgroundColor: "#6334F4", color: "white" }
                : { backgroundColor: "#F3F4F6", color: "#9CA3AF" }
            }
            title={`${day}: ${count} jadwal`}
          >
            {count}
          </div>
        ))}
        <div className="ml-1 flex items-center gap-0.5">
          {DAYS.map((day) => (
            <span key={day} className="text-[9px] w-7 text-center font-medium text-gray-400">
              {day.slice(0, 3)}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function WeeklyCalendar({
  data,
  loading,
  readonly,
  highlightNow,
  onCellClick,
  onCardClick,
}: Props) {
  const colRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const today = DAY_MAP[new Date().getDay()];
  const nowTop = nowTopPx();
  const showNowLine = highlightNow && nowTop >= 0 && nowTop <= GRID_H;

  if (loading) return <Skeleton />;

  function handleColClick(day: string, e: React.MouseEvent<HTMLDivElement>) {
    if (readonly || !onCellClick) return;
    const el = colRefs.current[day];
    if (!el) return;
    const y = e.clientY - el.getBoundingClientRect().top;
    const rawMins = Math.floor(y / (HOUR_PX / 60) / 15) * 15;
    const totalMins =
      START_HOUR * 60 + Math.max(0, Math.min(rawMins, (END_HOUR - START_HOUR) * 60));
    const hh = Math.floor(totalMins / 60).toString().padStart(2, "0");
    const mm = (totalMins % 60).toString().padStart(2, "0");
    onCellClick(day, `${hh}:${mm}`);
  }

  return (
    <div>
      <SummaryBar data={data} />

      <div className="overflow-x-auto rounded-3xl border border-gray-100 bg-white shadow-sm">
        <div style={{ minWidth: 680 }}>

          {/* ── Day header ── */}
          <div className="flex border-b border-gray-100 px-3">
            {/* Time label */}
            <div className="w-14 shrink-0 border-r border-gray-50 py-4">
              <p className="text-center text-[9px] font-bold uppercase tracking-widest text-gray-300">
                WIB
              </p>
            </div>

            {DAYS.map((day) => {
              const isToday = day === today;
              const dateNum = getDayDate(day);
              const dayCount = data.filter((j) => j.hari === day).length;
              return (
                <div
                  key={day}
                  className={`relative flex-1 border-r border-gray-50 px-1 py-3 text-center last:border-r-0 ${
                    isToday ? "bg-[#6334F4]/3" : ""
                  }`}
                >
                  {/* Today top accent */}
                  {isToday && (
                    <div className="absolute inset-x-0 top-0 h-0.75 rounded-b bg-[#6334F4]" />
                  )}

                  <p
                    className={`text-[10px] font-extrabold uppercase tracking-widest ${
                      isToday ? "text-[#6334F4]" : "text-gray-400"
                    }`}
                  >
                    {day.slice(0, 3)}
                  </p>

                  {dateNum && (
                    <div
                      className={`mx-auto mt-1.5 flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                        isToday
                          ? "bg-[#6334F4] text-white shadow-sm"
                          : "text-gray-700"
                      }`}
                    >
                      {dateNum}
                    </div>
                  )}

                  {dayCount > 0 && (
                    <div
                      className="mx-auto mt-1.5 w-fit rounded-full px-2 py-0.5 text-[9px] font-bold"
                      style={
                        isToday
                          ? { backgroundColor: "#6334F4", color: "white" }
                          : { backgroundColor: "#F3F4F6", color: "#6B7280" }
                      }
                    >
                      {dayCount}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* ── Grid body ── */}
          <div className="flex px-3">
            {/* Time column */}
            <div
              className="relative w-14 shrink-0 border-r border-gray-50"
              style={{ height: GRID_H }}
            >
              {HOURS.map((h) => (
                <div
                  key={h}
                  className="absolute flex w-full items-center justify-end pr-2"
                  style={{ top: (h - START_HOUR) * HOUR_PX - 7 }}
                >
                  {h < END_HOUR && (
                    <span className="text-[10px] font-semibold text-gray-300">
                      {h.toString().padStart(2, "0")}
                      <span className="text-[8px]">:00</span>
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Day columns */}
            {DAYS.map((day) => {
              const dayItems = data.filter((j) => j.hari === day);
              const isToday = day === today;

              return (
                <div
                  key={day}
                  ref={(el) => { colRefs.current[day] = el; }}
                  className={`relative flex-1 border-r border-gray-50 last:border-r-0 ${
                    !readonly ? "cursor-pointer" : ""
                  } ${isToday ? "bg-[#6334F4]/1.5" : ""}`}
                  style={{ height: GRID_H }}
                  onClick={(e) => handleColClick(day, e)}
                >
                  {/* Hour lines */}
                  {HOURS.map((h) => (
                    <div
                      key={h}
                      className="pointer-events-none absolute w-full border-t border-gray-100"
                      style={{ top: (h - START_HOUR) * HOUR_PX }}
                    />
                  ))}
                  {/* Half-hour lines */}
                  {HOURS.slice(0, -1).map((h) => (
                    <div
                      key={`h${h}`}
                      className="pointer-events-none absolute w-full border-t border-dashed border-gray-50"
                      style={{ top: (h - START_HOUR) * HOUR_PX + HOUR_PX / 2 }}
                    />
                  ))}

                  {/* Now line */}
                  {showNowLine && isToday && (
                    <div
                      className="pointer-events-none absolute z-20 flex w-full items-center"
                      style={{ top: nowTop }}
                    >
                      <div className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#FF3644] ring-2 ring-white shadow-sm" />
                      <div className="h-px flex-1 bg-[#FF3644]/60" />
                    </div>
                  )}

                  {/* Cards */}
                  {dayItems.map((item, idx) => {
                    const color = cardColor(item.mataPelajaran);
                    const active =
                      highlightNow && isNowActive(item.hari, item.jamMulai, item.jamSelesai);
                    const h = getHeightPx(item.jamMulai, item.jamSelesai);
                    const showKelas = h >= 42;
                    const showTime = h >= 64;
                    const showTeacher = h >= 92;
                    const showRoom = h >= 112;

                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -4 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.18, delay: idx * 0.04 }}
                        className={`absolute left-1 right-1 overflow-hidden rounded-lg ${
                          !readonly ? "cursor-pointer group" : ""
                        }`}
                        style={{
                          top: getTopPx(item.jamMulai) + 1,
                          height: h - 2,
                          backgroundColor: color.bg,
                          borderLeft: `3px solid ${color.strip}`,
                          boxShadow: active
                            ? `0 0 0 2px ${color.strip}40, 0 2px 8px ${color.strip}20`
                            : "0 1px 4px rgba(0,0,0,0.05)",
                        }}
                        whileHover={
                          !readonly
                            ? {
                                scale: 1.02,
                                zIndex: 20,
                                boxShadow: `0 4px 16px ${color.strip}25`,
                                x: 1,
                              }
                            : {}
                        }
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!readonly && onCardClick) onCardClick(item);
                        }}
                      >
                        {/* Active dot */}
                        {active && (
                          <div className="absolute right-1.5 top-1.5 flex items-center gap-1">
                            <span
                              className="h-1.5 w-1.5 animate-pulse rounded-full"
                              style={{ backgroundColor: color.strip }}
                            />
                          </div>
                        )}

                        <div className="flex h-full flex-col px-2 py-1.5 gap-0.5">
                          {/* Subject */}
                          <p
                            className="text-[11px] font-extrabold leading-tight truncate pr-3"
                            style={{ color: color.text }}
                          >
                            {item.mataPelajaran}
                          </p>

                          {/* Kelas badge */}
                          {showKelas && (
                            <span
                              className="w-fit rounded-md px-1.5 py-0.5 text-[8px] font-bold leading-tight"
                              style={{ backgroundColor: color.badge, color: color.strip }}
                            >
                              {item.kelas}
                            </span>
                          )}

                          {/* Time */}
                          {showTime && (
                            <div
                              className="mt-0.5 flex items-center gap-1"
                              style={{ color: `${color.text}99` }}
                            >
                              <Clock size={8} className="shrink-0" />
                              <span className="text-[9px] font-semibold">
                                {item.jamMulai}–{item.jamSelesai}
                              </span>
                            </div>
                          )}

                          {/* Teacher */}
                          {showTeacher && (
                            <div
                              className="flex items-center gap-1"
                              style={{ color: `${color.text}80` }}
                            >
                              <User size={8} className="shrink-0" />
                              <span className="truncate text-[9px]">
                                {item.guru.user.nama}
                              </span>
                            </div>
                          )}

                          {/* Room */}
                          {showRoom && item.ruangan && (
                            <div
                              className="flex items-center gap-1"
                              style={{ color: `${color.text}60` }}
                            >
                              <MapPin size={8} className="shrink-0" />
                              <span className="truncate text-[9px]">{item.ruangan}</span>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {/* ── Footer ── */}
          {!readonly && (
            <div className="flex items-center gap-2 border-t border-gray-50 px-5 py-2.5">
              <BookOpen size={11} className="text-gray-300" />
              <p className="text-[10px] text-gray-400">
                Klik area kosong untuk tambah jadwal · Klik kartu untuk edit
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
