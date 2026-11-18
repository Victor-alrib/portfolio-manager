import clsx, { type ClassValue } from "clsx";

export const cn = (...v: ClassValue[]) => clsx(v);

export const uid = (prefix = "") =>
  prefix + Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);

export const nowIso = () => new Date().toISOString();
/** yyyy-mm-dd no fuso local (não em UTC). */
export const localIso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export const todayIso = () => localIso(new Date());

const dateFmt = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
const shortFmt = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" });

/** Converte "yyyy-mm-dd" em Date local (evita deslocamento de fuso). */
export const parseDay = (d: string) => {
  const [y, m, day] = d.slice(0, 10).split("-").map(Number);
  return new Date(y, (m || 1) - 1, day || 1);
};

export const fmtDate = (d?: string) => (d ? dateFmt.format(parseDay(d)) : "—");
export const fmtShort = (d?: string) => (d ? shortFmt.format(parseDay(d)) : "—");
export const fmtDateTime = (iso?: string) =>
  iso ? new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }) : "—";

/** Dias entre hoje e a data (negativo = atrasado). */
export const daysUntil = (d: string) => {
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  return Math.round((parseDay(d).getTime() - t.getTime()) / 86400000);
};

export const relDays = (d: string) => {
  const n = daysUntil(d);
  if (n === 0) return "hoje";
  if (n === 1) return "amanhã";
  if (n === -1) return "ontem";
  return n > 0 ? `em ${n} dias` : `${Math.abs(n)} dias atrás`;
};

export const slugify = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60) || "projeto";

export const pct = (n: number) => `${Math.round(n * 100)}%`;

export const fmtBytes = (n?: number) => {
  if (!n && n !== 0) return "";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
};

export const isUrl = (s: string) => /^https?:\/\//i.test(s.trim());

export function debounce<A extends unknown[]>(fn: (...a: A) => void, ms: number) {
  let t: ReturnType<typeof setTimeout> | undefined;
  const d = (...a: A) => {
    if (t) clearTimeout(t);
    t = setTimeout(() => fn(...a), ms);
  };
  d.flush = (...a: A) => {
    if (t) clearTimeout(t);
    fn(...a);
  };
  return d;
}

export const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v));
