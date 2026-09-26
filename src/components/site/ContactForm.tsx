"use client";

import { ArrowRight, Check, LoaderCircle } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useActionState, useEffect, useState, type InputHTMLAttributes } from "react";
import { sendContactMessage } from "@/lib/contact/actions";
import type { ContactField, ContactState } from "@/lib/contact/schema";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { cn } from "@/lib/cn";

const initial: ContactState = { status: "idle" };
const empty: Record<ContactField, string> = { name: "", contact: "", message: "" };

function Field({
  label,
  error,
  multiline,
  ...props
}: { label: string; error?: string; multiline?: boolean } & InputHTMLAttributes<HTMLInputElement> &
  InputHTMLAttributes<HTMLTextAreaElement>) {
  const control = cn(
    "peer w-full rounded-card-sm border bg-bg px-3.5 pb-2 pt-6 text-[15px] outline-none transition-[border-color,box-shadow] duration-300 placeholder:text-transparent focus:border-accent focus:ring-4 focus:ring-accent/15",
    error ? "border-red-500/70" : "border-border",
    multiline && "min-h-28 resize-y",
  );
  return (
    <label className="relative block">
      {multiline ? <textarea {...props} placeholder={label} className={control} /> : <input {...props} placeholder={label} className={control} />}
      <span className="pointer-events-none absolute left-3.5 top-2 text-[11px] font-medium text-muted transition-all duration-200 peer-placeholder-shown:top-4 peer-placeholder-shown:text-[15px] peer-focus:top-2 peer-focus:text-[11px]">
        {label}
      </span>
      {error && <span className="mt-1.5 block text-sm text-red-500">{error}</span>}
    </label>
  );
}

export function ContactForm({ locale, dict }: { locale: Locale; dict: Dictionary["contact"] }) {
  const [state, formAction, pending] = useActionState(sendContactMessage, initial);
  const [values, setValues] = useState(empty);
  const [startedAt, setStartedAt] = useState(0);
  const [done, setDone] = useState(false);

  // Timestamp is taken on the client after mount (the bot "speed trap").
  useEffect(() => setStartedAt(Date.now()), []);
  useEffect(() => {
    if (state.status === "success") {
      setDone(true);
      setValues(empty);
    }
  }, [state]);

  const bind = (name: ContactField) => ({
    name,
    value: values[name],
    onChange: (e: { target: { value: string } }) => setValues((v) => ({ ...v, [name]: e.target.value })),
    error: state.status === "invalid" && state.fields[name] ? dict.errors[name] : undefined,
  });

  return (
    <div className="relative">
      <AnimatePresence mode="wait" initial={false}>
        {done ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center py-8 text-center"
          >
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.1 }}
              className="grid size-14 place-items-center rounded-full bg-accent text-accent-fg"
            >
              <Check className="size-8" strokeWidth={2.5} />
            </motion.span>
            <h3 className="mt-6 font-display text-2xl font-bold">{dict.successTitle}</h3>
            <p className="mt-2 max-w-sm text-muted">{dict.successText}</p>
            <button
              type="button"
              onClick={() => {
                setDone(false);
                setStartedAt(Date.now());
              }}
              className="mt-6 text-sm font-semibold text-accent hover:underline"
            >
              {dict.sendAnother}
            </button>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            action={formAction}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid gap-3"
            noValidate
          >
            <input type="hidden" name="locale" value={locale} />
            <input type="hidden" name="startedAt" value={startedAt} />
            {/* Honeypot: invisible to people, irresistible to bots. */}
            <input type="text" name="company" tabIndex={-1} autoComplete="off" aria-hidden className="absolute -left-[9999px] h-0 w-0 opacity-0" />

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label={dict.name} autoComplete="name" required {...bind("name")} />
              {/* Accepts e-mail or phone, so no inputMode — either keyboard may be needed. */}
              <Field label={dict.contact} required {...bind("contact")} />
            </div>
            <Field label={dict.message} multiline required {...bind("message")} />

            {state.status === "error" && <p className="text-sm text-red-500">{dict.errors[state.reason]}</p>}

            <button
              type="submit"
              disabled={pending}
              className="group mt-1 inline-flex items-center justify-center gap-2 justify-self-start rounded-full bg-accent px-6 py-3 text-[15px] font-semibold text-accent-fg transition-[transform,opacity] duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 max-sm:w-full"
            >
              {pending ? (
                <>
                  <LoaderCircle className="size-5 animate-spin" />
                  {dict.sending}
                </>
              ) : (
                <>
                  {dict.submit}
                  <ArrowRight className="size-5 transition-transform duration-300 group-hover:translate-x-1" />
                </>
              )}
            </button>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
