import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { CheckCircle2, AlertTriangle, Info, X, MapPin, LogOut } from "lucide-react";
import { Toast } from "../types";

interface ToastContainerProps {
  toasts: Toast[];
  onCloseToast: (id: string) => void;
}

export default function ToastContainer({ toasts, onCloseToast }: ToastContainerProps) {
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => {
          const isCheckIn = toast.message.toLowerCase().includes("checked in") || toast.message.toLowerCase().includes("started");
          const isCheckOut = toast.message.toLowerCase().includes("checked out") || toast.message.toLowerCase().includes("availability");

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.15 } }}
              layout
              className="pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-xl bg-[#1A1D26] text-gray-200 border-gray-800 backdrop-blur-md"
            >
              {/* Icon Selection */}
              <div className="mt-0.5 shrink-0">
                {isCheckIn ? (
                  <div className="p-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20">
                    <MapPin className="w-4 h-4 animate-bounce" />
                  </div>
                ) : isCheckOut ? (
                  <div className="p-1.5 bg-amber-500/10 text-amber-400 rounded-lg border border-amber-500/20">
                    <LogOut className="w-4 h-4" />
                  </div>
                ) : toast.type === "success" ? (
                  <div className="p-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                ) : toast.type === "error" ? (
                  <div className="p-1.5 bg-rose-500/10 text-rose-400 rounded-lg border border-rose-500/20">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                ) : toast.type === "warning" ? (
                  <div className="p-1.5 bg-amber-500/10 text-amber-400 rounded-lg border border-amber-500/20">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                ) : (
                  <div className="p-1.5 bg-blue-500/10 text-blue-400 rounded-lg border border-blue-500/20">
                    <Info className="w-4 h-4" />
                  </div>
                )}
              </div>

              {/* Message Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                    {isCheckIn ? "Check-In Alert" : isCheckOut ? "Check-Out Alert" : "System Notification"}
                  </span>
                  <span className="text-[9px] font-mono text-gray-500">{toast.timestamp}</span>
                </div>
                <p className="text-xs text-gray-300 mt-1 leading-relaxed font-sans font-medium">
                  {toast.message}
                </p>
              </div>

              {/* Close Button */}
              <button
                onClick={() => onCloseToast(toast.id)}
                className="shrink-0 p-1 hover:bg-gray-800 text-gray-500 hover:text-gray-300 rounded-lg transition"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
