import { useMemo } from "react";
import { Bar, BarChart, Cell, Pie, PieChart, PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts";
import { AlertCircle, ArrowRight, CalendarClock, CheckCircle2, CircleDot, Lightbulb, Plus, Rocket, Sparkles } from "lucide-react";
import { useStore } from "../../store/store";
import { Badge, Button, Card, EmptyState, PageHeader, Progress } from "../../components/ui";
import { useChartTheme } from "../../components/theme";
import { STAGES, STAGE_LABEL, STAGE_SLOT, LEVELS } from "../../lib/constants";
import { isActive, isCompleted, isPublished, portfolioStats, projectProgress, readmeCompleteness, techUsage, upcomingDeadlines } from "../../lib/metrics";
import { cn, fmtShort, pct, relDays } from "../../lib/utils";
import { href, navigate } from "../../router";

export function ChartTooltip({ active, payload, label, fmt }: { active?: boolean; payload?: { name: string; value: number; color?: string; payload?: { fill?: string } }[]; label?: string; fmt?: (v: number, n: string) => string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-line bg-panel px-2.5 py-1.5 text-xs shadow-pop">
      {label && <p className="mb-0.5 font-medium text-ink">{label}</p>}
      {payload.map((p) => (
        <p key={p.name} className="flex items-center gap-1.5 text-sub">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color ?? p.payload?.fill }} />
          {p.name}: <span className="font-medium text-ink">{fmt ? fmt(p.value, p.name) : p.value}</span>
        </p>
      ))}
    </div>
  );
}

export function Dashboard({ onNew }: { onNew: () => void }) {
  const projects = useStore((s) => s.projects);
  const skills = useStore((s) => s.skills);
  const jobs = useStore((s) => s.jobs);
  const settings = useStore((s) => s.settings);
  const ct = useChartTheme();

  const stats = useMemo(() => portfolioStats({ projects, skills, jobs, posts: [], settings, version: 1 }), [projects, skills, jobs, settings]);
  const byStage = STAGES.map((s) => ({ id: s.id, name: s.label, value: projects.filter((p) => p.stage === s.id).length, fill: ct.series[STAGE_SLOT[s.id]] }));
  const techs = techUsage(projects).slice(0, 10);
  const deadlines = upcomingDeadlines(projects).slice(0, 7);
  const active = projects.filter(isActive).sort((a, b) => projectProgress(b) - projectProgress(a));
  const radar = skills.map((s) => ({ name: s.name, Atual: s.level, Meta: s.target }));

  const suggestions = useMemo(() => {
    const out: { text: string; to: string }[] = [];
    const noDates = projects.filter((p) => isActive(p) && !p.targetDate && !p.dates.length && !p.steps.some((s) => s.dueDate));
    if (noDates.length) out.push({ text: `${noDates.length} projeto(s) ativo(s) sem prazos — defina datas para acompanhar entregas.`, to: href("projeto", noDates[0].id) });
    const nextStudy = skills.filter((s) => s.roadmapOrder && !s.criterionMet).sort((a, b) => a.roadmapOrder! - b.roadmapOrder!)[0];
    if (nextStudy) out.push({ text: `Próximo item do roteiro de estudo: ${nextStudy.roadmapOrder}. ${nextStudy.name}.`, to: href("competencias") });
    const docs = projects.filter((p) => ["testes", "documentacao", "publicado"].includes(p.stage) && readmeCompleteness(p) < 1);
    if (docs.length) out.push({ text: `README incompleto em "${docs[0].name}".`, to: href("readme", docs[0].id) });
    const pub = projects.filter((p) => p.stage === "publicado" && !p.links.length);
    if (pub.length) out.push({ text: `"${pub[0].name}" está publicado mas sem link externo.`, to: href("projeto", pub[0].id) });
    if (!jobs.length) out.push({ text: "Cadastre vagas de interesse para comparar requisitos com suas competências.", to: href("vagas") });
    return out.slice(0, 4);
  }, [projects, skills, jobs]);

  const greeting = settings.ownerName ? `Olá, ${settings.ownerName.split(" ")[0]}` : "Dashboard";

  return (
    <div>
      <PageHeader
        title={greeting}
        subtitle="Visão geral do seu portfólio técnico"
        actions={<Button variant="primary" icon={<Plus size={14} />} onClick={onNew}>Novo projeto</Button>}
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <Kpi icon={<CircleDot size={14} />} label="Projetos ativos" value={stats.active} to={href("kanban")} />
        <Kpi icon={<CheckCircle2 size={14} />} label="Concluídos" value={stats.completed} to={href("projetos")} />
        <Kpi icon={<Rocket size={14} />} label="Publicados" value={stats.published} to={href("kanban")} />
        <Kpi icon={<Lightbulb size={14} />} label="Ideias" value={stats.ideas} to={href("kanban")} />
        <div className="card col-span-2 p-4 md:col-span-1">
          <p className="text-xs text-mute">Progresso geral</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{pct(stats.progress)}</p>
          <Progress value={stats.progress} className="mt-2" />
          <p className="mt-1.5 text-[11px] text-mute">{stats.stepsDone} de {stats.stepsTotal} etapas concluídas</p>
        </div>
      </div>

      {suggestions.length > 0 && (
        <div className="mt-4 rounded-lg border border-accent/30 bg-accent/5 p-3">
          <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-accent"><Sparkles size={13} /> Próximas ações sugeridas</p>
          <ul className="grid gap-1 md:grid-cols-2">
            {suggestions.map((s) => (
              <li key={s.text}>
                <a href={s.to} className="group flex items-center gap-1.5 text-xs text-sub hover:text-ink">
                  <ArrowRight size={11} className="text-mute group-hover:text-accent" /> {s.text}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      <RoadmapCard />

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        {/* Etapas */}
        <Card title="Projetos por etapa">
          <div className="flex items-center gap-2 p-3">
            <div className="h-44 w-44 shrink-0">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={byStage.filter((d) => d.value)} dataKey="value" nameKey="name" innerRadius={48} outerRadius={72} paddingAngle={2} stroke={ct.surface} strokeWidth={2} cursor="pointer" onClick={() => navigate("kanban")} isAnimationActive={false}>
                    {byStage.filter((d) => d.value).map((d) => <Cell key={d.id} fill={d.fill} />)}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                  <text x="50%" y="47%" textAnchor="middle" fill={ct.text} fontSize={22} fontWeight={600}>{projects.length}</text>
                  <text x="50%" y="60%" textAnchor="middle" fill={ct.axis} fontSize={10}>projetos</text>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="flex-1 space-y-1">
              {byStage.map((d) => (
                <li key={d.id} className="flex items-center gap-2 text-xs">
                  <span className="h-2 w-2 rounded-full" style={{ background: d.fill }} />
                  <span className="flex-1 text-sub">{d.name}</span>
                  <span className="tabular-nums text-ink">{d.value}</span>
                </li>
              ))}
            </ul>
          </div>
        </Card>

        {/* Tecnologias */}
        <Card title="Tecnologias utilizadas" className="lg:col-span-2">
          {techs.length ? (
            <div className="p-3" style={{ height: techs.length * 26 + 40 }}>
              <ResponsiveContainer>
                <BarChart data={techs} layout="vertical" margin={{ left: 8, right: 24, top: 4, bottom: 4 }} barCategoryGap={4}>
                  <XAxis type="number" allowDecimals={false} tick={{ fill: ct.axis, fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" width={150} interval={0} tick={{ fill: ct.text, fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: ct.track, opacity: 0.5 }} content={<ChartTooltip fmt={(v) => `${v} projeto(s)`} />} />
                  <Bar dataKey="count" name="Projetos" fill={ct.series[0]} radius={[0, 4, 4, 0]} maxBarSize={14} isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="p-4"><EmptyState title="Nenhuma tecnologia cadastrada" /></div>
          )}
        </Card>

        {/* Próximas entregas */}
        <Card title={<span className="flex items-center gap-1.5"><CalendarClock size={14} /> Próximas entregas</span>}>
          <div className="p-2">
            {deadlines.length ? (
              <ul>
                {deadlines.map((d, i) => (
                  <li key={i}>
                    <a href={href("projeto", d.projectId)} className="flex items-start gap-3 rounded-md px-2 py-2 hover:bg-elev">
                      <div className={cn("w-12 shrink-0 text-center text-[11px] font-medium", d.days < 0 ? "text-red-500" : d.days <= 7 ? "text-amber-600 dark:text-amber-400" : "text-sub")}>
                        {fmtShort(d.date)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm text-ink">{d.label}</p>
                        <p className="truncate text-[11px] text-mute">{d.projectName} · {relDays(d.date)}</p>
                      </div>
                      {d.days < 0 && <AlertCircle size={13} className="mt-0.5 text-red-500" aria-label="Atrasado" />}
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState title="Nenhuma entrega agendada">Adicione datas às etapas ou um prazo final nos projetos.</EmptyState>
            )}
          </div>
        </Card>

        {/* Progresso por projeto */}
        <Card title="Projetos ativos" className="lg:col-span-2" action={<a href={href("projetos")} className="text-xs text-mute hover:text-ink">Ver todos</a>}>
          <div className="divide-y divide-line">
            {active.length ? active.map((p) => (
              <a key={p.id} href={href("projeto", p.id)} className="flex items-center gap-4 px-4 py-2.5 hover:bg-elev/50">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-ink">{p.name}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    <Badge color={ct.series[STAGE_SLOT[p.stage]]}>{STAGE_LABEL[p.stage]}</Badge>
                    {p.technologies.slice(0, 3).map((t) => <span key={t} className="text-[11px] text-mute">{t}</span>)}
                  </div>
                </div>
                <div className="w-36 shrink-0">
                  <div className="mb-1 flex justify-between text-[11px] text-mute">
                    <span>{p.steps.filter((s) => s.done).length}/{p.steps.length || "—"} etapas</span>
                    <span className="tabular-nums text-ink">{pct(projectProgress(p))}</span>
                  </div>
                  <Progress value={projectProgress(p)} />
                </div>
              </a>
            )) : <div className="p-4"><EmptyState title="Nenhum projeto ativo">Mova uma ideia para Planejamento no Kanban.</EmptyState></div>}
          </div>
        </Card>

        {/* Competências */}
        <Card title="Competências: atual × meta" className="lg:col-span-2" action={<a href={href("competencias")} className="text-xs text-mute hover:text-ink">Gerenciar</a>}>
          {radar.length >= 3 ? (
            <div className="h-72 p-2">
              <ResponsiveContainer>
                <RadarChart data={radar} outerRadius="72%">
                  <PolarGrid stroke={ct.grid} />
                  <PolarAngleAxis dataKey="name" tick={{ fill: ct.text, fontSize: 11 }} />
                  <PolarRadiusAxis domain={[0, 5]} tickCount={6} tick={{ fill: ct.axis, fontSize: 9 }} axisLine={false} />
                  <Radar name="Meta" dataKey="Meta" stroke={ct.series[1]} fill={ct.series[1]} fillOpacity={0.08} strokeWidth={2} strokeDasharray="4 3" isAnimationActive={false} />
                  <Radar name="Atual" dataKey="Atual" stroke={ct.series[0]} fill={ct.series[0]} fillOpacity={0.25} strokeWidth={2} isAnimationActive={false} />
                  <Legend wrapperStyle={{ fontSize: 11, color: ct.text }} iconType="plainline" />
                  <Tooltip content={<ChartTooltip fmt={(v) => `${v} · ${LEVELS[v]}`} />} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="p-4"><EmptyState title="Cadastre ao menos 3 competências para ver o radar" /></div>
          )}
        </Card>

        <Card title="Status do portfólio">
          <ul className="space-y-3 p-4 text-sm">
            <StatusRow label="READMEs completos" value={`${stats.readmeReady}/${stats.total}`} />
            <StatusRow label="Projetos concluídos" value={`${projects.filter(isCompleted).length}`} />
            <StatusRow label="Publicados com link" value={`${projects.filter((p) => isPublished(p) && p.links.length).length}/${stats.published}`} />
            <StatusRow label="Competências aplicadas" value={`${skills.filter((s) => s.links.some((l) => l.status === "aplicada")).length}/${skills.length}`} />
            <StatusRow label="Vagas acompanhadas" value={`${jobs.length}`} />
          </ul>
        </Card>
      </div>
    </div>
  );
}

const Kpi = ({ icon, label, value, to }: { icon: JSX.Element; label: string; value: number; to: string }) => (
  <a href={to} className="card group p-4 transition hover:border-accent/40">
    <p className="flex items-center gap-1.5 text-xs text-mute">{icon} {label}</p>
    <p className="mt-1 text-2xl font-semibold tabular-nums text-ink">{value}</p>
  </a>
);

const StatusRow = ({ label, value }: { label: string; value: string }) => (
  <li className="flex items-center justify-between">
    <span className="text-sub">{label}</span>
    <span className="font-medium tabular-nums text-ink">{value}</span>
  </li>
);

/** Plano de carreira + sequenciamento em fases do roadmap (estudo → projeto). */
function RoadmapCard() {
  const career = useStore((s) => s.settings.career);
  const skills = useStore((s) => s.skills);
  const projects = useStore((s) => s.projects);
  const ct = useChartTheme();
  const phases = [1, 2, 3, 4].map((n) => ({
    n,
    skills: skills.filter((k) => k.roadmapPhase === n).sort((a, b) => (a.roadmapOrder ?? 0) - (b.roadmapOrder ?? 0)),
    projects: projects.filter((p) => p.roadmapPhase === n),
  }));
  const hasRoadmap = phases.some((p) => p.skills.length || p.projects.length);
  return (
    <section className="card mt-4">
      <div className="flex flex-wrap items-start gap-4 border-b border-line px-4 py-3">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-accent">Plano de carreira · Fase {career.currentPhase}</p>
          <p className="mt-0.5 text-sm font-medium text-ink">{career.phaseTitle}</p>
          <p className="mt-1 max-w-3xl text-xs text-sub">{career.focus}</p>
        </div>
        <div className="flex max-w-sm flex-wrap gap-1">
          {career.targetRoles.map((r) => <Badge key={r}>{r}</Badge>)}
        </div>
      </div>
      {hasRoadmap && (
        <div className="grid divide-y divide-line md:grid-cols-4 md:divide-x md:divide-y-0">
          {phases.map((ph) => {
            const doneSkills = ph.skills.filter((k) => k.criterionMet).length;
            return (
              <div key={ph.n} className="p-4">
                <p className="text-xs font-medium text-ink">Fase {ph.n}</p>
                <p className="mb-2 text-[11px] text-mute">Estudo: {doneSkills}/{ph.skills.length} critérios</p>
                <ul className="mb-2 space-y-0.5">
                  {ph.skills.map((k) => (
                    <li key={k.id} className={cn("text-xs", k.criterionMet ? "text-mute line-through" : "text-sub")}>
                      {k.roadmapOrder}. {k.name}
                    </li>
                  ))}
                </ul>
                {ph.projects.map((p) => (
                  <a key={p.id} href={href("projeto", p.id)} className="mt-1 flex items-center gap-1.5 rounded-md bg-elev/60 px-2 py-1.5 text-xs text-ink hover:bg-elev">
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: ct.series[STAGE_SLOT[p.stage]] }} />
                    <span className="truncate">{p.name}</span>
                  </a>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
