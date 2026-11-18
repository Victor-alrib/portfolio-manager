import { useMemo, useState } from "react";
import { FolderKanban, LayoutGrid, List, Plus, Search } from "lucide-react";
import { useStore } from "../../store/store";
import { Badge, Button, EmptyState, Input, PageHeader, Progress, Select } from "../../components/ui";
import { useChartTheme } from "../../components/theme";
import { PRIORITY, STAGES, STAGE_INDEX, STAGE_LABEL, STAGE_SLOT } from "../../lib/constants";
import { projectProgress, techUsage, upcomingDeadlines } from "../../lib/metrics";
import { cn, fmtShort } from "../../lib/utils";
import { href } from "../../router";
import type { Stage } from "../../types";

type Sort = "updated" | "name" | "stage" | "progress";

export function ProjectsList({ onNew }: { onNew: () => void }) {
  const projects = useStore((s) => s.projects);
  const ct = useChartTheme();
  const [q, setQ] = useState("");
  const [stage, setStage] = useState<Stage | "">("");
  const [tech, setTech] = useState("");
  const [sort, setSort] = useState<Sort>("stage");
  const [view, setView] = useState<"list" | "grid">("list");

  const techs = techUsage(projects);
  const list = useMemo(() => {
    const t = q.toLowerCase();
    const out = projects.filter(
      (p) =>
        (!stage || p.stage === stage) &&
        (!tech || p.technologies.includes(tech)) &&
        (!t || [p.name, p.description, p.area, p.objective, ...p.technologies].join(" ").toLowerCase().includes(t)),
    );
    const cmp: Record<Sort, (a: typeof out[0], b: typeof out[0]) => number> = {
      updated: (a, b) => b.updatedAt.localeCompare(a.updatedAt),
      name: (a, b) => a.name.localeCompare(b.name),
      stage: (a, b) => STAGE_INDEX[b.stage] - STAGE_INDEX[a.stage] || a.order - b.order,
      progress: (a, b) => projectProgress(b) - projectProgress(a),
    };
    return out.sort(cmp[sort]);
  }, [projects, q, stage, tech, sort]);

  return (
    <div>
      <PageHeader
        title="Projetos"
        subtitle={`${projects.length} projeto(s) no portfólio`}
        actions={<Button variant="primary" icon={<Plus size={14} />} onClick={onNew}>Novo projeto</Button>}
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[14rem] flex-1">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-mute" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filtrar por nome, área, tecnologia…" className="pl-8" />
        </div>
        <Select value={stage} onChange={(e) => setStage(e.target.value as Stage | "")} className="w-auto">
          <option value="">Todas as etapas</option>
          {STAGES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
        </Select>
        <Select value={tech} onChange={(e) => setTech(e.target.value)} className="w-auto">
          <option value="">Todas as tecnologias</option>
          {techs.map((t) => <option key={t.name} value={t.name}>{t.name} ({t.count})</option>)}
        </Select>
        <Select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="w-auto" aria-label="Ordenar">
          <option value="stage">Ordenar: etapa</option>
          <option value="updated">Ordenar: atualização</option>
          <option value="name">Ordenar: nome</option>
          <option value="progress">Ordenar: progresso</option>
        </Select>
        <div className="flex rounded-md border border-line p-0.5">
          <button aria-label="Lista" onClick={() => setView("list")} className={cn("rounded p-1", view === "list" ? "bg-elev text-ink" : "text-mute")}><List size={14} /></button>
          <button aria-label="Grade" onClick={() => setView("grid")} className={cn("rounded p-1", view === "grid" ? "bg-elev text-ink" : "text-mute")}><LayoutGrid size={14} /></button>
        </div>
      </div>

      {list.length === 0 ? (
        <EmptyState icon={<FolderKanban size={22} />} title="Nenhum projeto encontrado" action={<Button onClick={onNew} icon={<Plus size={14} />}>Criar projeto</Button>}>
          Ajuste os filtros ou crie um novo projeto.
        </EmptyState>
      ) : view === "list" ? (
        <div className="card overflow-hidden">
          <div className="hidden grid-cols-[1fr_9rem_6rem_9rem_6rem] gap-3 border-b border-line px-4 py-2 text-[11px] font-medium uppercase tracking-wide text-mute md:grid">
            <span>Projeto</span><span>Etapa</span><span>Prioridade</span><span>Progresso</span><span>Próx. data</span>
          </div>
          {list.map((p) => {
            const next = upcomingDeadlines([p])[0];
            return (
              <a key={p.id} href={href("projeto", p.id)} className="grid grid-cols-1 gap-1 border-b border-line px-4 py-3 last:border-0 hover:bg-elev/50 md:grid-cols-[1fr_9rem_6rem_9rem_6rem] md:items-center md:gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink">{p.name}</p>
                  <p className="truncate text-xs text-mute">{p.area || p.description || "—"}</p>
                </div>
                <div><Badge color={ct.series[STAGE_SLOT[p.stage]]}>{STAGE_LABEL[p.stage]}</Badge></div>
                <span className={cn("text-xs", PRIORITY[p.priority].cls)}>{PRIORITY[p.priority].label}</span>
                <div className="flex items-center gap-2"><Progress value={projectProgress(p)} /><span className="w-9 text-right text-xs tabular-nums text-sub">{Math.round(projectProgress(p) * 100)}%</span></div>
                <span className="text-xs text-sub">{next ? fmtShort(next.date) : "—"}</span>
              </a>
            );
          })}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((p) => (
            <a key={p.id} href={href("projeto", p.id)} className="card flex flex-col gap-2 p-4 transition hover:border-accent/40">
              <div className="flex items-center justify-between">
                <Badge color={ct.series[STAGE_SLOT[p.stage]]}>{STAGE_LABEL[p.stage]}</Badge>
                <span className={cn("text-[11px]", PRIORITY[p.priority].cls)}>{PRIORITY[p.priority].label}</span>
              </div>
              <p className="text-sm font-medium leading-snug text-ink">{p.name}</p>
              <p className="line-clamp-3 text-xs text-mute">{p.description}</p>
              <div className="mt-auto flex flex-wrap gap-1 pt-1">
                {p.technologies.slice(0, 5).map((t) => <span key={t} className="rounded bg-elev px-1.5 py-0.5 text-[10px] text-sub">{t}</span>)}
              </div>
              <Progress value={projectProgress(p)} />
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
