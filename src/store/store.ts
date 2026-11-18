import { create } from "zustand";
import type { AppData, Job, Post, Project, Settings, Skill, SkillLinkStatus, Stage } from "../types";
import { nowIso, uid } from "../lib/utils";
import { newProject, seedData } from "./seed";
import { loadLocal } from "./persistence";

type Patch<T> = Partial<T> | ((cur: T) => Partial<T>);
const apply = <T,>(cur: T, p: Patch<T>): T => ({ ...cur, ...(typeof p === "function" ? p(cur) : p) });

export interface Store extends AppData {
  // Projetos
  addProject: (partial?: Partial<Project>) => Project;
  updateProject: (id: string, patch: Patch<Project>) => void;
  removeProject: (id: string) => void;
  duplicateProject: (id: string) => Project | undefined;
  moveProject: (id: string, stage: Stage, beforeId?: string | null) => void;
  // Competências
  addSkill: (partial?: Partial<Skill>) => Skill;
  updateSkill: (id: string, patch: Patch<Skill>) => void;
  setSkillLevel: (id: string, level: number) => void;
  removeSkill: (id: string) => void;
  linkSkill: (skillId: string, projectId: string, status?: SkillLinkStatus, evidence?: string) => void;
  unlinkSkill: (skillId: string, projectId: string) => void;
  // Vagas
  addJob: (partial?: Partial<Job>) => Job;
  updateJob: (id: string, patch: Patch<Job>) => void;
  removeJob: (id: string) => void;
  // Posts
  addPost: (partial?: Partial<Post>) => Post;
  updatePost: (id: string, patch: Patch<Post>) => void;
  removePost: (id: string) => void;
  // Geral
  updateSettings: (patch: Partial<Settings>) => void;
  replaceAll: (data: AppData) => void;
  resetToSeed: () => void;
}

const data = (s: Store): AppData => ({
  version: s.version,
  projects: s.projects,
  skills: s.skills,
  jobs: s.jobs,
  posts: s.posts,
  settings: s.settings,
});
export const selectData = data;

export const useStore = create<Store>((set, get) => ({
  ...(loadLocal() ?? seedData()),

  addProject: (partial = {}) => {
    const stage = partial.stage ?? "ideias";
    const maxOrder = Math.max(-1, ...get().projects.filter((p) => p.stage === stage).map((p) => p.order));
    const p = newProject({ ...partial, stage, order: maxOrder + 1 });
    set((s) => ({ projects: [...s.projects, p] }));
    return p;
  },

  updateProject: (id, patch) =>
    set((s) => ({
      projects: s.projects.map((p) => (p.id === id ? { ...apply(p, patch), updatedAt: nowIso() } : p)),
    })),

  removeProject: (id) =>
    set((s) => ({
      projects: s.projects.filter((p) => p.id !== id),
      skills: s.skills.map((k) => ({ ...k, links: k.links.filter((l) => l.projectId !== id) })),
      posts: s.posts.map((po) => (po.projectId === id ? { ...po, projectId: undefined } : po)),
    })),

  duplicateProject: (id) => {
    const src = get().projects.find((p) => p.id === id);
    if (!src) return;
    const copy = JSON.parse(JSON.stringify(src)) as Project;
    const p = newProject({
      ...copy,
      id: uid("p"),
      name: `${src.name} (cópia)`,
      stage: "ideias",
      stageHistory: [{ stage: "ideias", at: nowIso() }],
      steps: copy.steps.map((st) => ({ ...st, id: uid("st"), done: false })),
    });
    set((s) => ({ projects: [...s.projects, p] }));
    return p;
  },

  moveProject: (id, stage, beforeId) =>
    set((s) => {
      const moving = s.projects.find((p) => p.id === id);
      if (!moving) return {};
      const column = s.projects
        .filter((p) => p.stage === stage && p.id !== id)
        .sort((a, b) => a.order - b.order);
      const idx = beforeId ? column.findIndex((p) => p.id === beforeId) : -1;
      const updated: Project = {
        ...moving,
        stage,
        updatedAt: nowIso(),
        stageHistory: moving.stage === stage ? moving.stageHistory : [...moving.stageHistory, { stage, at: nowIso() }],
      };
      column.splice(idx < 0 ? column.length : idx, 0, updated);
      const orderMap = new Map(column.map((p, i) => [p.id, i]));
      return {
        projects: s.projects.map((p) =>
          p.id === id ? { ...updated, order: orderMap.get(id)! } : orderMap.has(p.id) ? { ...p, order: orderMap.get(p.id)! } : p,
        ),
      };
    }),

  addSkill: (partial = {}) => {
    const k: Skill = {
      id: uid("s"),
      name: "Nova competência",
      category: "",
      description: "",
      level: 0,
      target: 3,
      notes: "",
      links: [],
      history: [],
      ...partial,
    };
    set((s) => ({ skills: [...s.skills, k] }));
    return k;
  },
  updateSkill: (id, patch) => set((s) => ({ skills: s.skills.map((k) => (k.id === id ? apply(k, patch) : k)) })),
  setSkillLevel: (id, level) =>
    set((s) => ({
      skills: s.skills.map((k) =>
        k.id === id && k.level !== level ? { ...k, level, history: [...k.history, { at: nowIso(), level }] } : k,
      ),
    })),
  removeSkill: (id) =>
    set((s) => ({
      skills: s.skills.filter((k) => k.id !== id),
      jobs: s.jobs.map((j) => ({
        ...j,
        requirements: j.requirements.map((r) => (r.skillId === id ? { ...r, skillId: undefined } : r)),
      })),
    })),
  linkSkill: (skillId, projectId, status = "planejada", evidence) =>
    set((s) => ({
      skills: s.skills.map((k) => {
        if (k.id !== skillId) return k;
        const exists = k.links.find((l) => l.projectId === projectId);
        return {
          ...k,
          links: exists
            ? k.links.map((l) => (l.projectId === projectId ? { ...l, status, evidence: evidence ?? l.evidence } : l))
            : [...k.links, { projectId, status, evidence: evidence ?? "" }],
        };
      }),
    })),
  unlinkSkill: (skillId, projectId) =>
    set((s) => ({
      skills: s.skills.map((k) => (k.id === skillId ? { ...k, links: k.links.filter((l) => l.projectId !== projectId) } : k)),
    })),

  addJob: (partial = {}) => {
    const now = nowIso();
    const j: Job = {
      id: uid("j"),
      title: "Nova vaga",
      company: "",
      location: "",
      url: "",
      salary: "",
      stage: "interesse",
      notes: "",
      requirements: [],
      createdAt: now,
      updatedAt: now,
      ...partial,
    };
    set((s) => ({ jobs: [...s.jobs, j] }));
    return j;
  },
  updateJob: (id, patch) =>
    set((s) => ({ jobs: s.jobs.map((j) => (j.id === id ? { ...apply(j, patch), updatedAt: nowIso() } : j)) })),
  removeJob: (id) => set((s) => ({ jobs: s.jobs.filter((j) => j.id !== id) })),

  addPost: (partial = {}) => {
    const now = nowIso();
    const p: Post = { id: uid("po"), title: "Novo rascunho", kind: "livre", body: "", status: "rascunho", createdAt: now, updatedAt: now, ...partial };
    set((s) => ({ posts: [...s.posts, p] }));
    return p;
  },
  updatePost: (id, patch) =>
    set((s) => ({ posts: s.posts.map((p) => (p.id === id ? { ...apply(p, patch), updatedAt: nowIso() } : p)) })),
  removePost: (id) => set((s) => ({ posts: s.posts.filter((p) => p.id !== id) })),

  updateSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),
  replaceAll: (d) => set(() => ({ ...d })),
  resetToSeed: () => set(() => ({ ...seedData() })),
}));

/** Hooks de conveniência */
export const useProject = (id: string) => useStore((s) => s.projects.find((p) => p.id === id));
