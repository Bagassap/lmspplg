"use client";

import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

/**
 * Sheet dari bawah bergaya aplikasi: header putih (judul + tombol tutup), isi bisa digulir.
 * Tanpa warna tembus pandang; hanya putih, ungu, dan aksen palet.
 */
export function AppSheet({
  open, onClose, title, subtitle, children, footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  if (typeof document === "undefined") return null;
  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-100 flex items-end justify-center">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose} className="absolute inset-0 bg-black/50" />
          <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 320 }}
            className="relative z-10 flex w-full max-w-xl flex-col overflow-hidden rounded-t-[28px] bg-white dark:bg-[#1E293B]"
            style={{ maxHeight: "92vh" }}>
            <div className="flex shrink-0 items-center gap-3 px-5 pb-3 pt-5">
              <div className="min-w-0 flex-1">
                <p className="truncate text-base font-extrabold text-slate-900 dark:text-white">{title}</p>
                {subtitle && <p className="truncate text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>}
              </div>
              <button type="button" onClick={onClose} aria-label="Tutup"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F1EDFA] text-[#3E03B3]">
                <X size={16} />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5">{children}</div>
            {footer && <div className="shrink-0 px-5 pb-5 pt-2">{footer}</div>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
