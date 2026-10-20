"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Code2, CheckCircle, AlertCircle } from "lucide-react";
import { CodePracticeCanvas } from "@/components/materi/CodePracticeCanvas";
import { useIsAppMode } from "@/lib/pwaInstall";

export function TugasPraktikViewerModal({
  open, onClose, title, subtitle, html, css, js, isDone, onTerima, onRevisi,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  html: string;
  css: string;
  js: string;
  // isDone true = sudah diterima, sembunyikan aksi Terima/Revisi (read-only).
  isDone?: boolean;
  onTerima?: () => void;
  onRevisi?: () => void;
}) {
  const app = useIsAppMode();
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-4">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, y: "100%" }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            className="relative flex h-[95dvh] w-full max-w-[1400px] flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl dark:bg-slate-800 sm:rounded-3xl"
          >
            <div className="relative flex shrink-0 items-center gap-3 overflow-hidden px-6 py-4"
              style={{ background: app ? "#F1EDFA" : "#0EA5E9" }}>
              <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/10" />
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${app ? "bg-white text-[#3E03B3]" : "bg-white/15 text-white"}`}>
                <Code2 size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className={`truncate text-base font-extrabold ${app ? "text-slate-900" : "text-white"}`}>{title}</h2>
                {subtitle && <p className={`text-xs ${app ? "text-slate-500" : "text-white/70"}`}>{subtitle}</p>}
              </div>
              <button
                onClick={onClose}
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors ${app ? "bg-white text-slate-600" : "bg-white/15 text-white hover:bg-white/25"}`}
              >
                <X size={15} />
              </button>
            </div>

            <div className="flex flex-1 flex-col overflow-y-auto p-5">
              <div className="min-h-0 flex-1">
                <CodePracticeCanvas
                  key={`${html.length}-${css.length}-${js.length}`}
                  initialHtml={html}
                  initialCss={css}
                  initialJs={js}
                  minHeight={640}
                />
              </div>
            </div>

            {!isDone && (onTerima || onRevisi) && (
              <div className="flex shrink-0 items-center justify-end gap-3 border-t border-slate-100 px-5 py-4 dark:border-slate-700">
                {onRevisi && (
                  <button onClick={onRevisi}
                    className="flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-bold shadow-sm transition-transform hover:scale-[1.03]"
                    style={{ background: "#F26A3D", color: "#FFFFFF" }}>
                    <AlertCircle size={14} /> Minta Revisi
                  </button>
                )}
                {onTerima && (
                  <button onClick={onTerima}
                    className="flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-bold text-black shadow-sm transition-transform hover:scale-[1.03]"
                    style={{ background: "#F26A3D" }}>
                    <CheckCircle size={14} /> Terima
                  </button>
                )}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
