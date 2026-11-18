import type { AppData, Job, Project, Skill } from "../types";
import { STAGES, STAGE_INDEX } from "./constants";
import { daysUntil } from "./utils";

/** Progresso do projeto: etapas concluídas; sem etapas, usa a posição no fluxo. */
export function projectProgress(p: Project): number {
  if (p.steps.length) return p.steps.filter((s) => s.done).length / p.steps.length;
  return STAGE_INDEX[p.stage] / (STAGES.length - 1);
}

export const isActive = (p: Project) => ["planejamento", "desenvolvimento", "testes", "documentacao"].includes(p.stage);
/** Concluído = todas as etapas de desenvolvimento marcadas (ou publicado). */
export const isCompleted = (p: Project) =>
  p.stage === "publicado" || (p.steps.length > 0 && p.steps.every((s) => s.done));
export const isPublished = (p: Project) => p.stage === "publicado";

export interface Deadline {
  projectId: string;
  projectName: string;
  label: string;
  date: string;
  kind: "etapa" | "data" | "prazo";
  days: number;
}

export function upcomingDeadlines(projects: Project[], horizonDays = 9999): Deadline[] {
  const out: Deadline[] = [];
  for (const p of projects) {
    p.steps.forEach((s) => {
      if (s.dueDate && !s.done) out.push({ projectId: p.id, projectName: p.name, label: s.title, date: s.dueDate, kind: "etapa", days: daysUntil(s.dueDate) });
    });
    p.dates.forEach((d) => {
      if (d.date && !d.done) out.push({ projectId: p.id, projectName: p.name, label: d.label, date: d.date, kind: "data", days: daysUntil(d.date) });
    });
    if (p.targetDate && p.stage !== "publicado")
      out.push({ projectId: p.id, projectName: p.name, label: "Prazo final do projeto", date: p.targetDate, kind: "prazo", days: daysUntil(p.targetDate) });
  }
  return out.filter((d) => d.days <= horizonDays).sort((a, b) => a.date.localeCompare(b.date));
}

export function techUsage(projects: Project[]) {
  const m = new Map<string, number>();
  projects.forEach((p) => p.technologies.forEach((t) => m.set(t, (m.get(t) ?? 0) + 1)));
  return [...m.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

export function portfolioStats(d: AppData) {
  const ps = d.projects;
  const progress = ps.length ? ps.reduce((a, p) => a + projectProgress(p), 0) / ps.length : 0;
  const steps = ps.flatMap((p) => p.steps);
  return {
    total: ps.length,
    active: ps.filter(isActive).length,
    completed: ps.filter(isCompleted).length,
    published: ps.filter(isPublished).length,
    ideas: ps.filter((p) => p.stage === "ideias").length,
    progress,
    stepsDone: steps.filter((s) => s.done).length,
    stepsTotal: steps.length,
    readmeReady: ps.filter((p) => readmeCompleteness(p) === 1).length,
  };
}

export function readmeCompleteness(p: Project) {
  const keys = ["problema", "dados", "abordagem", "tecnologias", "metodologia", "resultados", "aprendizados", "proximosPassos"] as const;
  return keys.filter((k) => p.readme[k].trim()).length / keys.length;
}

/** Compatibilidade de uma vaga com as competências registradas. */
export function jobMatch(job: Job, skills: Skill[]) {
  const byId = new Map(skills.map((s) => [s.id, s]));
  const rows = job.requirements.map((r) => {
    const s = r.skillId ? byId.get(r.skillId) : undefined;
    const level = s?.level ?? 0;
    const applied = s ? s.links.filter((l) => l.status === "aplicada").length : 0;
    return { req: r, skill: s, level, gap: Math.max(0, r.requiredLevel - level), met: !!s && level >= r.requiredLevel, applied };
  });
  const weight = (t: string) => (t === "obrigatorio" ? 2 : 1);
  const totalW = rows.reduce((a, r) => a + weight(r.req.type) * r.req.requiredLevel, 0);
  const gotW = rows.reduce((a, r) => a + weight(r.req.type) * Math.min(r.level, r.req.requiredLevel), 0);
  return {
    rows,
    score: totalW ? gotW / totalW : 0,
    mandatoryMissing: rows.filter((r) => r.req.type === "obrigatorio" && !r.met),
    unmapped: rows.filter((r) => !r.skill),
  };
}

/** Detecta números/percentuais que parecem métricas. */
export function findNumericClaims(text: string): string[] {
  const re = /(\d+[.,]?\d*\s?%|\b(?:acur[aá]cia|precis[aã]o|recall|f1|rmse|mae|mape|r2|r²|auc)\b[^.\n]{0,40}\d)/gi;
  return [...new Set(text.match(re) ?? [])].slice(0, 6);
}
