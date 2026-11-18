import { useMemo, useState } from "react";
import { CalendarClock, ChevronLeft, ChevronRight, GripVertical, ListChecks, Plus, Search } from "lucide-react";
import { useStore } from "../../store/store";
import { Input, PageHeader, Progress, Select, Button } from "../../components/ui";
import { useChartTheme } from "../../components/theme";
import { PRIORITY, STAGES, STAGE_INDEX, STAGE_SLOT } from "../../lib/constants";
import { projectProgress, upcomingDeadlines } from "../../lib/metrics";
import { cn, fmtShort } from "../../lib/utils";
import { navigate } from "../../router";
import type { Project, Stage } from "../../types";

export function Kanban({ onNew }: { onNew: (stage?: Stage) => void }) {
  const projects = useStore((s) => s.projects);
  const move = useStore((s) => s.moveProject);
  const ct = useChartTheme();
  const [dragId, setDragId] = useState<string | null>(null);
  const [overCol, setOverCol] = useState<Stage | null>(null);
  const [overCard, setOverCard] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [prio, setPrio] = useState("");

  const filtered = useMemo(
    () =>
      projects.filter(
        (p) => (!prio || p.priority === prio) && (!q || [p.name, p.area, ...p.technologies].join(" ").toLowerCase().includes(q.toLowerCase())),
      ),
    [projects, q, prio],
  );

  const drop = (stage: Stage, beforeId: string | null) => {
    if (dragId) move(dragId, stage, beforeId);
    setDragId(null);
    setOverCol(null);
    setOverCard(null);
  };

  const shift = (p: Project, d: -1 | 1) => {
    const i = STAGE_INDEX[p.stage] + d;
    if (i >= 0 && i < STAGES.length) move(p.id, STAGES[i].id);
  };

  return (
    <div>
      <PageHeader
        title="Kanban"
        subtitle="Arraste os cards entre as colunas (ou use as setas) para mudar a etapa do projeto"
        actions={<Button variant="primary" icon={<Plus size={14} />} onClick={() => onNew("ideias")}>Nova ideia</Button>}
      />
      <div className="mb-4 flex flex-wrap gap-2">
        <div className="relative w-64">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-mute" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filtrar cards…" className="pl-8" />
        </div>
        <Select value={prio} onChange={(e) => setPrio(e.target.value)} className="w-auto">
          <option value="">Todas as prioridades</option>
          <option value="alta">Alta</option>
          <option value="media">Média</option>
          <option value="baixa">Baixa</option>
        </Select>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-4">
        {STAGES.map((stage) => {
          const cards = filtered.filter((p) => p.stage === stage.id).sort((a, b) => a.order - b.order);
          const color = ct.series[STAGE_SLOT[stage.id]];
          return (
            <section
              key={stage.id}
              aria-label={stage.label}
              className={cn("flex w-72 shrink-0 flex-col rounded-lg border border-line bg-panel/60", overCol === stage.id && !overCard && "drop-target")}
              onDragOver={(e) => {
                e.preventDefault();
                setOverCol(stage.id);
              }}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) setOverCol(null);
              }}
              onDrop={(e) => {
                e.preventDefault();
                drop(stage.id, overCard);
              }}
            >
              <header className="flex items-center gap-2 px-3 pb-2 pt-3">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
                <h2 className="text-sm font-medium text-ink">{stage.label}</h2>
                <span className="text-xs text-mute">{cards.length}</span>
                <button onClick={() => onNew(stage.id)} aria-label={`Novo projeto em ${stage.label}`} className="ml-auto rounded p-1 text-mute hover:bg-elev hover:text-ink">
                  <Plus size={14} />
                </button>
              </header>
              <p className="px-3 pb-2 text-[11px] text-mute">{stage.hint}</p>
              <div className="flex min-h-[8rem] flex-1 flex-col gap-2 px-2 pb-2">
                {cards.map((p) => {
                  const next = upcomingDeadlines([p])[0];
                  const done = p.steps.filter((s) => s.done).length;
                  return (
                    <article
                      key={p.id}
                      draggable
                      onDragStart={(e) => {
                        setDragId(p.id);
                        e.dataTransfer.effectAllowed = "move";
                        e.dataTransfer.setData("text/plain", p.id);
                      }}
                      onDragEnd={() => (setDragId(null), setOverCol(null), setOverCard(null))}
                      onDragOver={(e) => {
                        e.preventDefault();
                        if (dragId && dragId !== p.id) setOverCard(p.id);
                      }}
                      onDragLeave={() => setOverCard((c) => (c === p.id ? null : c))}
                      onClick={() => navigate("projeto", p.id)}
                      className={cn(
                        "group cursor-pointer rounded-md border border-line bg-panel p-3 shadow-sm transition hover:border-accent/40",
                        dragId === p.id && "opacity-40",
                        overCard === p.id && "border-t-2 border-t-accent",
                      )}
                    >
                      <div className="flex items-start gap-1.5">
                        <GripVertical size={13} className="mt-0.5 shrink-0 cursor-grab text-mute opacity-0 group-hover:opacity-100" />
                        <p className="flex-1 text-sm font-medium leading-snug text-ink">{p.name}</p>
                      </div>
                      {p.area && <p className="mt-1 truncate pl-5 text-[11px] text-mute">{p.area}</p>}
                      <div className="mt-2 flex flex-wrap gap-1 pl-5">
                        {p.technologies.slice(0, 3).map((t) => <span key={t} className="rounded bg-elev px-1.5 py-0.5 text-[10px] text-sub">{t}</span>)}
                        {p.technologies.length > 3 && <span className="text-[10px] text-mute">+{p.technologies.length - 3}</span>}
                      </div>
                      <div className="mt-2.5 pl-5">
                        <Progress value={projectProgress(p)} color={color} />
                      </div>
                      <div className="mt-2 flex items-center gap-3 pl-5 text-[11px] text-mute">
                        <span className={PRIORITY[p.priority].cls}>● {PRIORITY[p.priority].label}</span>
                        {p.steps.length > 0 && <span className="flex items-center gap-1"><ListChecks size={11} />{done}/{p.steps.length}</span>}
                        {next && <span className={cn("flex items-center gap-1", next.days < 0 && "text-red-500")}><CalendarClock size={11} />{fmtShort(next.date)}</span>}
                        <span className="ml-auto flex opacity-0 transition group-hover:opacity-100 focus-within:opacity-100">
                          <button aria-label="Mover para etapa anterior" disabled={STAGE_INDEX[p.stage] === 0} onClick={(e) => (e.stopPropagation(), shift(p, -1))} className="rounded p-0.5 hover:bg-elev hover:text-ink disabled:opacity-30">
                            <ChevronLeft size={13} />
                          </button>
                          <button aria-label="Mover para próxima etapa" disabled={STAGE_INDEX[p.stage] === STAGES.length - 1} onClick={(e) => (e.stopPropagation(), shift(p, 1))} className="rounded p-0.5 hover:bg-elev hover:text-ink disabled:opacity-30">
                            <ChevronRight size={13} />
                          </button>
                        </span>
                      </div>
                    </article>
                  );
                })}
                {!cards.length && <div className="flex flex-1 items-center justify-center rounded-md border border-dashed border-line text-[11px] text-mute">Solte aqui</div>}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
