// ─────────────────────────────────────────────────────────────
// Modelo de dados do Portfolio Manager
// Toda alteração de esquema deve incrementar SCHEMA_VERSION e
// ganhar uma migração em store/migrations.ts.
// ─────────────────────────────────────────────────────────────

export const SCHEMA_VERSION = 1;

export type Stage =
  | "ideias"
  | "planejamento"
  | "desenvolvimento"
  | "testes"
  | "documentacao"
  | "publicado";

export type Priority = "baixa" | "media" | "alta";

export interface Step {
  id: string;
  title: string;
  done: boolean;
  dueDate?: string; // ISO yyyy-mm-dd
}

export interface KeyDate {
  id: string;
  label: string;
  date: string; // ISO yyyy-mm-dd
  done?: boolean;
}

export interface ProjectLink {
  id: string;
  label: string;
  url: string;
}

export interface ProjectFile {
  id: string;
  name: string;
  kind: "referencia" | "upload";
  /** Caminho local, link do Drive/GitHub etc. */
  url?: string;
  /** Conteúdo embutido (apenas arquivos pequenos). */
  dataUrl?: string;
  size?: number;
  mime?: string;
  note?: string;
  addedAt: string;
}

export interface ReadmeDraft {
  problema: string;
  dados: string;
  abordagem: string;
  tecnologias: string;
  metodologia: string;
  resultados: string;
  aprendizados: string;
  proximosPassos: string;
  /** Declaração explícita do autor de que os resultados foram medidos. */
  resultadosVerificados: boolean;
  updatedAt?: string;
}

export interface InterviewPrep {
  pitch: string;
  contexto: string;
  desafio: string;
  acao: string;
  resultado: string;
  decisoes: string;
  perguntas: string;
}

export interface StageEvent {
  stage: Stage;
  at: string; // ISO datetime
}

export interface Project {
  id: string;
  name: string;
  description: string;
  objective: string;
  area: string;
  technologies: string[];
  stage: Stage;
  priority: Priority;
  steps: Step[];
  dates: KeyDate[];
  links: ProjectLink[];
  files: ProjectFile[];
  notes: string;
  readme: ReadmeDraft;
  interview: InterviewPrep;
  stageHistory: StageEvent[];
  startDate?: string;
  targetDate?: string;
  /** Fase do sequenciamento do roadmap (1–4), se houver. */
  roadmapPhase?: number;
  /** Entregáveis esperados (ex.: repositório GitHub, post no LinkedIn). */
  deliverables: string[];
  order: number; // posição dentro da coluna do Kanban
  createdAt: string;
  updatedAt: string;
}

export type SkillLinkStatus = "planejada" | "aplicada";

export interface SkillLink {
  projectId: string;
  status: SkillLinkStatus;
  evidence: string;
}

export interface SkillLevelEvent {
  at: string;
  level: number;
}

export interface Skill {
  id: string;
  name: string;
  category: string;
  description: string;
  /** 0 = não avaliado, 1..5 = iniciante → avançado */
  level: number;
  target: number;
  notes: string;
  links: SkillLink[];
  history: SkillLevelEvent[];
  /** Faz parte do roteiro de estudo (ordem 1..n) */
  roadmapOrder?: number;
  roadmapPhase?: number;
  /** Conteúdo a estudar, motivo e critério de "concluído" (do roteiro). */
  content?: string;
  why?: string;
  doneCriterion?: string;
  criterionMet?: boolean;
}

export type JobStage = "interesse" | "candidatura" | "entrevista" | "oferta" | "encerrada";

export interface JobRequirement {
  id: string;
  name: string;
  skillId?: string;
  requiredLevel: number; // 1..5
  type: "obrigatorio" | "desejavel";
}

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  url: string;
  stage: JobStage;
  deadline?: string;
  salary: string;
  notes: string;
  requirements: JobRequirement[];
  createdAt: string;
  updatedAt: string;
}

export type PostKind = "lancamento" | "aprendizado" | "progresso" | "livre";
export type PostStatus = "rascunho" | "revisao" | "publicado";

export interface Post {
  id: string;
  title: string;
  projectId?: string;
  kind: PostKind;
  body: string;
  status: PostStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CareerPlan {
  currentPhase: 1 | 2;
  phaseTitle: string;
  focus: string;
  targetRoles: string[];
  phase2Options: { title: string; note: string }[];
  rules: string[];
}

export interface Settings {
  theme: "dark" | "light";
  ownerName: string;
  headline: string;
  githubUser: string;
  linkedinUrl: string;
  career: CareerPlan;
}

export interface AppData {
  version: number;
  projects: Project[];
  skills: Skill[];
  jobs: Job[];
  posts: Post[];
  settings: Settings;
}
