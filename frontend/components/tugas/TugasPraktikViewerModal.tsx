"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Code2 } from "lucide-react";
import { CodePracticeCanvas } from "@/components/materi/CodePracticeCanvas";
import { icon3dStyle } from "@/components/shared/Icon3D";

export function TugasPraktikViewerModal({
  open, onClose, title, subtitle, html, css, js,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  html: string;
  css: string;
  js: string;
}) {
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
            <div className="flex shrink-0 items-center gap-4 px-6 pb-3 pt-5 sm:px-8">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl" style={icon3dStyle("violet")}>
                <Code2 size={20} color="#fff" />
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-base font-extrabold text-slate-900 dark:text-white">{title}</h2>
                {subtitle && <p className="truncate text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>}
              </div>
              <button onClick={onClose} aria-label="Tutup"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F1EDFA] text-[#3E03B3]">
                <X size={18} />
              </button>
            </div>

            <div className="flex flex-1 flex-col overflow-y-auto px-6 pb-4 sm:px-8">
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

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
