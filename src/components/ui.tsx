import { forwardRef, useEffect, useLayoutEffect, useRef, useState, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { create } from "zustand";
import { X } from "lucide-react";
import { cn } from "../lib/utils";

/* ───────────── Botões ───────────── */
type Variant = "primary" | "secondary" | "ghost" | "danger";
export const Button = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: "sm" | "md"; icon?: ReactNode }>(
  ({ variant = "secondary", size = "md", icon, className, children, ...rest }, ref) => (
    <button
      ref={ref}
      {...rest}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md font-medium transition disabled:cursor-not-allowed disabled:opacity-50",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40",
        size === "sm" ? "h-7 px-2 text-xs" : "h-8 px-3 text-sm",
        variant === "primary" && "bg-accent text-white hover:brightness-110 dark:text-[#0e0e0f]",
        variant === "secondary" && "border border-line bg-panel text-ink hover:bg-elev",
        variant === "ghost" && "text-sub hover:bg-elev hover:text-ink",
        variant === "danger" && "border border-red-500/30 text-red-500 hover:bg-red-500/10",
        className,
      )}
    >
      {icon}
      {children}
    </button>
  ),
);

export const IconButton = ({ label, className, children, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) => (
  <button
    aria-label={label}
    title={label}
    {...rest}
    className={cn("inline-flex h-7 w-7 items-center justify-center rounded-md text-mute transition hover:bg-elev hover:text-ink", className)}
  >
    {children}
  </button>
);

/* ───────────── Campos ───────────── */
export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(({ className, ...p }, ref) => (
  <input ref={ref} {...p} className={cn("input", className)} />
));

export function Textarea({ className, autoGrow = true, ...p }: TextareaHTMLAttributes<HTMLTextAreaElement> & { autoGrow?: boolean }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    if (!autoGrow || !ref.current) return;
    ref.current.style.height = "auto";
    ref.current.style.height = ref.current.scrollHeight + 2 + "px";
  }, [p.value, autoGrow]);
  return <textarea ref={ref} rows={3} {...p} className={cn("input resize-y leading-relaxed", className)} />;
}

export const Select = ({ className, children, ...p }: SelectHTMLAttributes<HTMLSelectElement>) => (
  <select {...p} className={cn("input cursor-pointer pr-7", className)}>
    {children}
  </select>
);

export const Field = ({ label, hint, children, className }: { label: string; hint?: ReactNode; children: ReactNode; className?: string }) => (
  <label className={cn("block", className)}>
    <span className="label">{label}</span>
    {children}
    {hint && <span className="mt-1 block text-[11px] text-mute">{hint}</span>}
  </label>
);

/** Campo que só grava no store ao sair (evita escrita a cada tecla). */
export function InlineText({ value, onCommit, className, placeholder, multiline }: { value: string; onCommit: (v: string) => void; className?: string; placeholder?: string; multiline?: boolean }) {
  const [v, setV] = useState(value);
  useEffect(() => setV(value), [value]);
  const commit = () => v !== value && onCommit(v);
  if (multiline)
    return <Textarea value={v} placeholder={placeholder} onChange={(e) => setV(e.target.value)} onBlur={commit} className={className} />;
  return (
    <input
      value={v}
      placeholder={placeholder}
      onChange={(e) => setV(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => e.key === "Enter" && (e.currentTarget as HTMLInputElement).blur()}
      className={cn("w-full rounded-md bg-transparent px-1 outline-none hover:bg-elev/60 focus:bg-elev", className)}
    />
  );
}

/** Tags com autocomplete simples. */
export function TagInput({ value, onChange, suggestions = [], placeholder = "Adicionar…" }: { value: string[]; onChange: (v: string[]) => void; suggestions?: string[]; placeholder?: string }) {
  const [t, setT] = useState("");
  const add = (raw: string) => {
    const s = raw.trim();
    if (s && !value.some((x) => x.toLowerCase() === s.toLowerCase())) onChange([...value, s]);
    setT("");
  };
  const opts = suggestions.filter((s) => !value.includes(s) && s.toLowerCase().includes(t.toLowerCase())).slice(0, 6);
  return (
    <div className="input flex flex-wrap items-center gap-1 py-1">
      {value.map((tag) => (
        <span key={tag} className="inline-flex items-center gap-1 rounded bg-elev px-1.5 py-0.5 text-xs text-ink">
          {tag}
          <button type="button" aria-label={`Remover ${tag}`} onClick={() => onChange(value.filter((x) => x !== tag))} className="text-mute hover:text-ink">
            <X size={11} />
          </button>
        </span>
      ))}
      <div className="relative min-w-[8rem] flex-1">
        <input
          value={t}
          onChange={(e) => setT(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              add(t);
            } else if (e.key === "Backspace" && !t && value.length) onChange(value.slice(0, -1));
          }}
          onBlur={() => t && add(t)}
          placeholder={placeholder}
          className="w-full bg-transparent py-0.5 text-sm outline-none placeholder:text-mute"
        />
        {t && opts.length > 0 && (
          <div className="absolute left-0 top-full z-30 mt-1 w-48 rounded-md border border-line bg-panel p-1 shadow-pop">
            {opts.map((o) => (
              <button key={o} type="button" onMouseDown={(e) => (e.preventDefault(), add(o))} className="block w-full rounded px-2 py-1 text-left text-sm hover:bg-elev">
                {o}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ───────────── Exibição ───────────── */
export const Badge = ({ children, color, className }: { children: ReactNode; color?: string; className?: string }) => (
  <span className={cn("inline-flex items-center gap-1 rounded-full border border-line px-2 py-0.5 text-[11px] font-medium text-sub", className)}>
    {color && <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />}
    {children}
  </span>
);

export const Card = ({ children, className, title, action }: { children: ReactNode; className?: string; title?: ReactNode; action?: ReactNode }) => (
  <section className={cn("card", className)}>
    {(title || action) && (
      <header className="flex items-center justify-between gap-2 border-b border-line px-4 py-2.5">
        <h3 className="text-sm font-medium text-ink">{title}</h3>
        {action}
      </header>
    )}
    {children}
  </section>
);

export const Progress = ({ value, className, color }: { value: number; className?: string; color?: string }) => (
  <div className={cn("h-1.5 w-full overflow-hidden rounded-full bg-elev", className)} role="progressbar" aria-valuenow={Math.round(value * 100)} aria-valuemin={0} aria-valuemax={100}>
    <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${Math.round(value * 100)}%`, background: color }} />
  </div>
);

export const EmptyState = ({ icon, title, children, action }: { icon?: ReactNode; title: string; children?: ReactNode; action?: ReactNode }) => (
  <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-line px-6 py-10 text-center">
    {icon && <div className="text-mute">{icon}</div>}
    <p className="text-sm font-medium text-ink">{title}</p>
    {children && <p className="max-w-sm text-xs text-mute">{children}</p>}
    {action && <div className="mt-2">{action}</div>}
  </div>
);

export const PageHeader = ({ title, subtitle, actions, icon }: { title: string; subtitle?: ReactNode; actions?: ReactNode; icon?: ReactNode }) => (
  <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
    <div>
      <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight text-ink">
        {icon && <span className="text-mute">{icon}</span>}
        {title}
      </h1>
      {subtitle && <p className="mt-1 text-sm text-mute">{subtitle}</p>}
    </div>
    {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
  </div>
);

export function Tabs<T extends string>({ tabs, value, onChange }: { tabs: { id: T; label: string; count?: number }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="mb-4 flex gap-1 overflow-x-auto border-b border-line" role="tablist">
      {tabs.map((t) => (
        <button
          key={t.id}
          role="tab"
          aria-selected={value === t.id}
          onClick={() => onChange(t.id)}
          className={cn(
            "-mb-px whitespace-nowrap border-b-2 px-3 py-2 text-sm transition",
            value === t.id ? "border-accent text-ink" : "border-transparent text-mute hover:text-ink",
          )}
        >
          {t.label}
          {t.count !== undefined && <span className="ml-1.5 text-xs text-mute">{t.count}</span>}
        </button>
      ))}
    </div>
  );
}

/* ───────────── Modal ───────────── */
export function Modal({ open, onClose, title, children, footer, wide }: { open: boolean; onClose: () => void; title: ReactNode; children: ReactNode; footer?: ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 pt-[8vh] backdrop-blur-sm" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal className={cn("w-full rounded-xl border border-line bg-panel shadow-pop", wide ? "max-w-3xl" : "max-w-lg")}>
        <div className="flex items-center justify-between border-b border-line px-5 py-3">
          <h2 className="text-sm font-semibold text-ink">{title}</h2>
          <IconButton label="Fechar" onClick={onClose}>
            <X size={15} />
          </IconButton>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-line px-5 py-3">{footer}</div>}
      </div>
    </div>
  );
}

/* ───────────── Confirmação (substitui window.confirm) ───────────── */
interface ConfirmReq { title: string; body?: string; confirmLabel?: string; danger?: boolean; resolve: (ok: boolean) => void }
const useConfirmStore = create<{ req?: ConfirmReq }>(() => ({}));
export const confirmDialog = (o: Omit<ConfirmReq, "resolve">) =>
  new Promise<boolean>((resolve) => useConfirmStore.setState({ req: { ...o, resolve } }));

export function ConfirmHost() {
  const req = useConfirmStore((s) => s.req);
  const close = (ok: boolean) => {
    req?.resolve(ok);
    useConfirmStore.setState({ req: undefined });
  };
  return (
    <Modal
      open={!!req}
      onClose={() => close(false)}
      title={req?.title}
      footer={
        <>
          <Button variant="ghost" onClick={() => close(false)}>Cancelar</Button>
          <Button variant={req?.danger ? "danger" : "primary"} onClick={() => close(true)} autoFocus>
            {req?.confirmLabel ?? "Confirmar"}
          </Button>
        </>
      }
    >
      <p className="text-sm text-sub">{req?.body}</p>
    </Modal>
  );
}

/* ───────────── Toasts ───────────── */
interface ToastItem { id: number; text: string; tone: "ok" | "erro" | "info" }
const useToastStore = create<{ items: ToastItem[] }>(() => ({ items: [] }));
let tid = 0;
export const toast = (text: string, tone: ToastItem["tone"] = "ok") => {
  const id = ++tid;
  useToastStore.setState((s) => ({ items: [...s.items, { id, text, tone }] }));
  setTimeout(() => useToastStore.setState((s) => ({ items: s.items.filter((i) => i.id !== id) })), 3200);
};
export function ToastHost() {
  const items = useToastStore((s) => s.items);
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex flex-col gap-2" aria-live="polite">
      {items.map((t) => (
        <div key={t.id} className={cn("pointer-events-auto rounded-lg border bg-panel px-3.5 py-2 text-sm shadow-pop", t.tone === "erro" ? "border-red-500/40 text-red-500" : "border-line text-ink")}>
          {t.text}
        </div>
      ))}
    </div>
  );
}

/* ───────────── Markdown (renderização segura e mínima) ───────────── */
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const inline = (s: string) =>
  esc(s)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*])_([^_]+)_/g, "$1<em>$2</em>")
    .replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>');

export function renderMarkdown(md: string): string {
  const lines = md.split("\n");
  const html: string[] = [];
  let list: "ul" | "ol" | null = null;
  let table: string[][] | null = null;
  const closeList = () => list && (html.push(`</${list}>`), (list = null));
  const closeTable = () => {
    if (!table) return;
    const [h, , ...rows] = table;
    html.push(
      `<table class="mb-3 w-full text-left text-xs"><thead><tr>${h.map((c) => `<th class="border-b border-line py-1 pr-2 font-semibold">${inline(c)}</th>`).join("")}</tr></thead><tbody>${rows
        .map((r) => `<tr>${r.map((c) => `<td class="border-b border-line py-1 pr-2 text-sub">${inline(c)}</td>`).join("")}</tr>`)
        .join("")}</tbody></table>`,
    );
    table = null;
  };
  for (const raw of lines) {
    const l = raw.trimEnd();
    if (/^\|.*\|$/.test(l)) {
      closeList();
      (table ??= []).push(l.slice(1, -1).split("|").map((c) => c.trim()));
      continue;
    }
    closeTable();
    let m;
    if ((m = l.match(/^(#{1,3})\s+(.*)/))) {
      closeList();
      html.push(`<h${m[1].length}>${inline(m[2])}</h${m[1].length}>`);
    } else if ((m = l.match(/^\s*[-*]\s+(?:\[( |x)\]\s+)?(.*)/))) {
      if (list !== "ul") (closeList(), html.push("<ul>"), (list = "ul"));
      html.push(`<li>${m[1] !== undefined ? (m[1] === "x" ? "☑ " : "☐ ") : ""}${inline(m[2])}</li>`);
    } else if ((m = l.match(/^\s*\d+\.\s+(.*)/))) {
      if (list !== "ol") (closeList(), html.push("<ol>"), (list = "ol"));
      html.push(`<li>${inline(m[1])}</li>`);
    } else if ((m = l.match(/^>\s?(.*)/))) {
      closeList();
      html.push(`<blockquote>${inline(m[1])}</blockquote>`);
    } else if (/^---+$/.test(l)) {
      closeList();
      html.push('<hr class="my-3 border-line" />');
    } else if (l.trim()) {
      closeList();
      html.push(`<p>${inline(l)}</p>`);
    } else closeList();
  }
  closeList();
  closeTable();
  return html.join("\n");
}

export const MarkdownView = ({ md, className }: { md: string; className?: string }) => (
  <div className={cn("md-preview", className)} dangerouslySetInnerHTML={{ __html: renderMarkdown(md) }} />
);
