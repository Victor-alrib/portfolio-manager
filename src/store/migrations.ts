import type { AppData, Job, Project, Skill } from "../types";
import { SCHEMA_VERSION } from "../types";
import { defaultCareer, emptyInterview, emptyReadme, seedData } from "./seed";
import { nowIso } from "../lib/utils";

/**
 * Normaliza dados vindos do localStorage, da nuvem ou de um JSON importado.
 * Preenche campos ausentes para que versões antigas continuem abrindo.
 */
export function migrate(raw: unknown): AppData {
  const base = seedData();
  if (!raw || typeof raw !== "object") return base;
  const r = raw as Partial<AppData>;

  const projects = (Array.isArray(r.projects) ? r.projects : []).map((p: Partial<Project>, i): Project => ({
    id: p.id!,
    name: p.name ?? "Sem nome",
    description: p.description ?? "",
    objective: p.objective ?? "",
    area: p.area ?? "",
    technologies: p.technologies ?? [],
    stage: p.stage ?? "ideias",
    priority: p.priority ?? "media",
    steps: p.steps ?? [],
    dates: p.dates ?? [],
    links: p.links ?? [],
    files: p.files ?? [],
    notes: p.notes ?? "",
    readme: { ...emptyReadme(), ...(p.readme ?? {}) },
    interview: { ...emptyInterview(), ...(p.interview ?? {}) },
    stageHistory: p.stageHistory ?? [{ stage: p.stage ?? "ideias", at: p.createdAt ?? nowIso() }],
    startDate: p.startDate,
    targetDate: p.targetDate,
    roadmapPhase: p.roadmapPhase,
    deliverables: p.deliverables ?? [],
    order: p.order ?? i,
    createdAt: p.createdAt ?? nowIso(),
    updatedAt: p.updatedAt ?? nowIso(),
  }));

  return {
    version: SCHEMA_VERSION,
    projects: projects.filter((p) => p.id),
    skills: (r.skills ?? []).map((s): Skill => ({ links: [], history: [], notes: "", description: "", category: "", target: 3, level: 0, ...(s as Partial<Skill>) } as Skill)),
    jobs: (r.jobs ?? []).map((j): Job => ({ requirements: [], notes: "", location: "", url: "", salary: "", stage: "interesse", ...(j as Partial<Job>) } as Job)),
    posts: r.posts ?? [],
    settings: { ...base.settings, ...(r.settings ?? {}), career: { ...defaultCareer(), ...(r.settings?.career ?? {}) } },
  };
}
