"use client";

import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { X } from "lucide-react";

export function MobileDetailModal({ onClose, accent, children, className = "" }: { onClose: () => void; accent: string; children: React.ReactNode; className?: string }) {
  return createPortal(
    <div className={`fixed inset-0 z-50 flex items-end justify-center ${className}`}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose} />
      <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        className="relative z-10 w-full overflow-hidden rounded-t-3xl"
        style={{ background: accent }}>
        <button type="button" onClick={onClose}
          className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm">
          <X size={15} />
        </button>
        <div className="overflow-y-auto" style={{ maxHeight: "92vh" }}>
          {children}
        </div>
      </motion.div>
    </div>,
    document.body
  );
}
