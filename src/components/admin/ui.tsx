/** Presentational admin primitives — no hooks, so usable from server and client components. */
import { LoaderCircle } from "lucide-react";
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

// ── Buttons ──────────────────────────────────────────────────

const buttonVariants = {
  primary: "bg-accent text-accent-fg hover:brightness-110",
  secondary: "border border-border bg-surface text-fg hover:bg-white/5",
  ghost: "text-muted hover:bg-white/5 hover:text-fg",
  danger: "text-red-400 hover:bg-red-500/10",
} as const;

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof buttonVariants;
  size?: "sm" | "md";
  loading?: boolean;
  icon?: ReactNode;
}

/** Button styling, also usable on links (`<a>` / `<Link>`). */
export function buttonClass(variant: keyof typeof buttonVariants = "secondary", size: "sm" | "md" = "md", className?: string) {
  return cn(
    "inline-flex shrink-0 items-center justify-center gap-2 rounded-xl font-semibold transition-[background-color,filter,opacity,transform] duration-200 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
    size === "md" ? "h-10 px-4 text-sm" : "h-9 px-3 text-[13px]",
    buttonVariants[variant],
    className,
  );
}

export function Button({ variant = "secondary", size = "md", loading, icon, className, children, disabled, ...props }: ButtonProps) {
  return (
    <button type="button" disabled={disabled || loading} className={buttonClass(variant, size, className)} {...props}>
      {loading ? <LoaderCircle className="size-4 animate-spin" /> : icon}
      {children}
    </button>
  );
}

export function IconButton({ label, className, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        "grid size-9 shrink-0 place-items-center rounded-lg text-muted transition-colors hover:bg-white/5 hover:text-fg disabled:opacity-40",
        className,
      )}
      {...props}
    />
  );
}

// ── Form controls ────────────────────────────────────────────

const controlClass =
  "w-full rounded-xl border border-border bg-bg px-3.5 text-[15px] outline-none transition-[border-color,box-shadow] placeholder:text-muted/60 focus:border-accent focus:ring-4 focus:ring-accent/15";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(controlClass, "h-11", className)} {...props} />;
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(controlClass, "min-h-20 resize-y py-2.5 leading-relaxed", className)} {...props} />;
}

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(controlClass, "h-11 cursor-pointer", className)} {...props}>
      {children}
    </select>
  );
}

export function Field({ label, hint, children, className }: { label: string; hint?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1.5 block text-sm font-semibold">{label}</span>
      {children}
      {hint && <span className="mt-1.5 block text-xs text-muted">{hint}</span>}
    </label>
  );
}

export function Switch({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 py-1">
      <span>
        <span className="block text-sm font-semibold sm:text-[15px]">{label}</span>
        {description && <span className="mt-0.5 block text-xs text-muted">{description}</span>}
      </span>
      <span className="relative mt-0.5 shrink-0">
        <input type="checkbox" className="peer sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <span className="block h-6 w-11 rounded-full bg-border transition-colors peer-checked:bg-accent peer-focus-visible:ring-4 peer-focus-visible:ring-accent/30" />
        <span className="absolute left-0.5 top-0.5 size-5 rounded-full bg-white shadow transition-transform duration-200 peer-checked:translate-x-5" />
      </span>
    </label>
  );
}

// ── Layout ───────────────────────────────────────────────────

export function Card({ title, description, actions, children, className }: {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-xl border border-border bg-surface p-3.5 sm:rounded-2xl sm:p-6", className)}>
      {(title || actions) && (
        <header className="mb-4 flex flex-wrap items-start justify-between gap-2 sm:mb-5 sm:gap-3">
          <div>
            {title && <h2 className="text-base font-bold sm:text-lg">{title}</h2>}
            {description && <p className="mt-1 text-xs leading-snug text-muted sm:text-sm">{description}</p>}
          </div>
          {actions}
        </header>
      )}
      {children}
    </section>
  );
}

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <header className="mb-4 flex flex-wrap items-end justify-between gap-3 sm:mb-6">
      <div>
        <h1 className="text-lg font-bold tracking-tight sm:text-3xl">{title}</h1>
        {description && <p className="mt-1 text-[13px] leading-snug text-muted sm:mt-1.5 sm:text-base">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
  );
}

export function EmptyState({ icon, title, children }: { icon: ReactNode; title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-border px-6 py-12 text-center">
      <span className="grid size-14 place-items-center rounded-2xl bg-white/5 text-muted">{icon}</span>
      <p className="mt-4 font-semibold">{title}</p>
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}

/** Sticky save bar at the bottom of long forms. */
export function SaveBar({ children, status }: { children: ReactNode; status?: ReactNode }) {
  return (
    <div className="sticky bottom-3 z-20 mt-6 flex flex-wrap items-center justify-end gap-2 rounded-2xl border border-border bg-surface/90 p-2.5 shadow-2xl shadow-black/40 backdrop-blur-xl sm:justify-between sm:pl-4">
      <div className="min-w-0 flex-1 basis-full text-sm text-muted sm:basis-auto">{status}</div>
      <div className="flex shrink-0 flex-wrap justify-end gap-2">{children}</div>
    </div>
  );
}
