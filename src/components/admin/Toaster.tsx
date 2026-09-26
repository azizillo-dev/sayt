"use client";

import { CircleAlert, CircleCheck, TriangleAlert, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type { ActionResult } from "@/lib/admin/result";

type Tone = "success" | "error" | "warning";
interface Toast {
  id: number;
  tone: Tone;
  message: string;
}

interface ToastApi {
  show: (message: string, tone?: Tone) => void;
  /** Shows the right toast for an action result; returns whether it succeeded. */
  result: <T>(result: ActionResult<T>, successMessage: string) => result is Extract<ActionResult<T>, { ok: true }>;
}

const ToastContext = createContext<ToastApi | null>(null);

const icons = { success: CircleCheck, error: CircleAlert, warning: TriangleAlert };
const tones = { success: "text-emerald-400", error: "text-red-400", warning: "text-amber-400" };
const DURATION = { success: 3000, error: 6000, warning: 8000 };

let nextId = 0;

export function Toaster({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => setToasts((all) => all.filter((t) => t.id !== id)), []);

  const show = useCallback(
    (message: string, tone: Tone = "success") => {
      const id = ++nextId;
      setToasts((all) => [...all.slice(-3), { id, tone, message }]);
      setTimeout(() => dismiss(id), DURATION[tone]);
    },
    [dismiss],
  );

  const api = useMemo<ToastApi>(
    () => ({
      show,
      result: <T,>(r: ActionResult<T>, successMessage: string): r is Extract<ActionResult<T>, { ok: true }> => {
        if (!r.ok) show(r.error, "error");
        else if (r.warning) show(r.warning, "warning");
        else show(successMessage);
        return r.ok;
      },
    }),
    [show],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[200] flex w-[min(92vw,380px)] flex-col gap-2" aria-live="polite">
        <AnimatePresence initial={false}>
          {toasts.map((t) => {
            const Icon = icons[t.tone];
            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, y: 16, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: 40 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className="pointer-events-auto flex items-start gap-3 rounded-xl border border-border bg-surface p-4 shadow-2xl shadow-black/50"
              >
                <Icon className={`mt-0.5 size-5 shrink-0 ${tones[t.tone]}`} />
                <p className="flex-1 text-sm leading-relaxed">{t.message}</p>
                <button type="button" onClick={() => dismiss(t.id)} className="text-muted hover:text-fg" aria-label="Yopish">
                  <X className="size-4" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <Toaster>");
  return ctx;
}
