import { useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CheckCircle2, ChevronDown, ChevronRight, Circle, GraduationCap, Plus, Trash2 } from "lucide-react";
import { useStore } from "../../store/store";
import { Badge, Button, Card, EmptyState, Field, IconButton, InlineText, PageHeader, Select, Tabs, confirmDialog, toast } from "../../components/ui";
import { useChartTheme } from "../../components/theme";
import { ChartTooltip } from "../dashboard/Dashboard";
import { LEVELS } from "../../lib/constants";
import { cn, fmtDateTime } from "../../lib/utils";
import { href } from "../../router";
import type { Skill } from "../../types";

export function Skills() {
  const skills = useStore((s) => s.skills);
  const addSkill = useStore((s) => s.addSkill);
  const ct = useChartTheme();
  const [tab, setTab] = useState<"roteiro" | "todas">("roteiro");
  const [open, setOpen] = useState<string | null>(null);

  const roadmap = skills.filter((s) => s.roadmapOrder).sort((a, b) => a.roadmapOrder! - b.roadmapOrder!);
  const list = tab === "roteiro" ? roadmap : [...skills].sort((a, b) => (a.category || "~").localeCompare(b.category || "~") || a.name.localeCompare(b.name));
  const chart = roadmap.map((s) => ({ name: s.name.replace(/ \(.*\)/, ""), Atual: s.level, Meta: s.target }));
  const done = roadmap.filter((s) => s.criterionMet).length;

  return (
    <div>
      <PageHeader
        icon={<GraduationCap size={18} />}
        title="Competências"
        subtitle="Acompanhe o roteiro de estudo e vincule cada competência aos projetos onde foi aplicada"
        actions={
          <Button
            variant="primary"
            icon={<Plus size={14} />}
            onClick={() => {
              const k = addSkill();
              setTab("todas");
              setOpen(k.id);
            }}
          >
            Nova competência
          </Button>
        }
      />

      {roadmap.length > 0 && (
        <div className="mb-4 grid gap-4 lg:grid-cols-3">
          <Card title="Nível atual × meta (roteiro)" className="lg:col-span-2">
            <div className="h-56 p-3">
              <ResponsiveContainer>
                <BarChart data={chart} margin={{ top: 4, right: 8, left: -20, bottom: 0 }} barGap={2} barCategoryGap="22%">
                  <CartesianGrid vertical={false} stroke={ct.grid} />
                  <XAxis dataKey="name" tick={{ fill: ct.text, fontSize: 10 }} axisLine={false} tickLine={false} interval={0} />
                  <YAxis domain={[0, 5]} ticks={[0, 1, 2, 3, 4, 5]} tick={{ fill: ct.axis, fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: ct.track, opacity: 0.5 }} content={<ChartTooltip fmt={(v) => `${v} · ${LEVELS[v]}`} />} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="Atual" fill={ct.series[0]} radius={[4, 4, 0, 0]} maxBarSize={18} isAnimationActive={false} />
                  <Bar dataKey="Meta" fill={ct.series[1]} radius={[4, 4, 0, 0]} maxBarSize={18} isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
          <Card title="Roteiro de estudo">
            <div className="p-4">
              <p className="text-2xl font-semibold tabular-nums">{done}<span className="text-base text-mute">/{roadmap.length}</span></p>
              <p className="text-xs text-mute">critérios de “concluído” atingidos</p>
              <ol className="mt-3 space-y-1">
                {roadmap.map((s) => (
                  <li key={s.id} className="flex items-center gap-2 text-xs">
                    {s.criterionMet ? <CheckCircle2 size={13} className="text-emerald-500" /> : <Circle size={13} className="text-mute" />}
                    <span className={cn("flex-1", s.criterionMet ? "text-mute line-through" : "text-sub")}>{s.roadmapOrder}. {s.name}</span>
                    {s.roadmapPhase && <span className="text-[10px] text-mute">Fase {s.roadmapPhase}</span>}
                  </li>
                ))}
              </ol>
            </div>
          </Card>
        </div>
      )}

      <Tabs tabs={[{ id: "roteiro", label: "Roteiro", count: roadmap.length }, { id: "todas", label: "Todas", count: skills.length }]} value={tab} onChange={setTab} />

      {list.length === 0 ? (
        <EmptyState title="Nenhuma competência" />
      ) : (
        <div className="space-y-2">
          {list.map((s) => <SkillRow key={s.id} s={s} open={open === s.id} onToggle={() => setOpen(open === s.id ? null : s.id)} />)}
        </div>
      )}
    </div>
  );
}

function LevelPicker({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
  return (
    <div className="flex items-center gap-0.5" role="radiogroup" aria-label={label}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          role="radio"
          aria-checked={value === n}
          title={LEVELS[n]}
          onClick={(e) => (e.stopPropagation(), onChange(value === n ? n - 1 : n))}
          className={cn("h-3.5 w-5 rounded-sm border transition", n <= value ? "border-accent bg-accent" : "border-line bg-elev hover:border-accent/60")}
        />
      ))}
    </div>
  );
}

function SkillRow({ s, open, onToggle }: { s: Skill; open: boolean; onToggle: () => void }) {
  const projects = useStore((st) => st.projects);
  const update = useStore((st) => st.updateSkill);
  const setLevel = useStore((st) => st.setSkillLevel);
  const link = useStore((st) => st.linkSkill);
  const unlink = useStore((st) => st.unlinkSkill);
  const remove = useStore((st) => st.removeSkill);
  const applied = s.links.filter((l) => l.status === "aplicada").length;
  const planned = s.links.length - applied;
  const available = projects.filter((p) => !s.links.some((l) => l.projectId === p.id));

  return (
    <div className="card">
      <div className="flex cursor-pointer flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3" onClick={onToggle}>
        <span className="text-mute">{open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}</span>
        <div className="min-w-[12rem] flex-1">
          <p className="flex items-center gap-2 text-sm font-medium text-ink">
            {s.roadmapOrder && <span className="text-xs text-mute">{s.roadmapOrder}.</span>}
            {s.name}
            {s.criterionMet && <CheckCircle2 size={13} className="text-emerald-500" aria-label="Critério atingido" />}
          </p>
          <p className="text-[11px] text-mute">{[s.category, s.roadmapPhase && `Fase ${s.roadmapPhase}`].filter(Boolean).join(" · ") || "—"}</p>
        </div>
        <div className="flex items-center gap-2">
          <LevelPicker value={s.level} onChange={(v) => setLevel(s.id, v)} label={`Nível atual de ${s.name}`} />
          <span className="w-24 text-xs text-sub">{LEVELS[s.level]}</span>
        </div>
        <span className="w-32 text-xs text-mute">Meta: {LEVELS[s.target]}</span>
        <div className="flex w-52 justify-end gap-1">
          <Badge>{applied} aplicada{applied !== 1 && "s"}</Badge>
          <Badge>{planned} planejada{planned !== 1 && "s"}</Badge>
        </div>
      </div>

      {open && (
        <div className="grid gap-4 border-t border-line p-4 lg:grid-cols-2">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Nome"><InlineText value={s.name} onCommit={(name) => update(s.id, { name })} className="input" /></Field>
              <Field label="Categoria"><InlineText value={s.category} onCommit={(category) => update(s.id, { category })} className="input" /></Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Meta de nível">
                <Select value={s.target} onChange={(e) => update(s.id, { target: Number(e.target.value) })}>
                  {LEVELS.map((l, i) => <option key={i} value={i}>{i} · {l}</option>)}
                </Select>
              </Field>
              <Field label="Posição no roteiro">
                <Select value={s.roadmapOrder ?? ""} onChange={(e) => update(s.id, { roadmapOrder: e.target.value ? Number(e.target.value) : undefined })}>
                  <option value="">Fora do roteiro</option>
                  {Array.from({ length: 12 }, (_, i) => <option key={i} value={i + 1}>Item {i + 1}</option>)}
                </Select>
              </Field>
            </div>
            <Field label="Conteúdo a estudar"><InlineText multiline value={s.content ?? s.description} onCommit={(content) => update(s.id, { content })} placeholder="Tópicos…" /></Field>
            <Field label="Por quê"><InlineText multiline value={s.why ?? ""} onCommit={(why) => update(s.id, { why })} placeholder="Por que essa competência importa para o seu objetivo?" /></Field>
            <Field label="Critério de “concluído”">
              <InlineText multiline value={s.doneCriterion ?? ""} onCommit={(doneCriterion) => update(s.id, { doneCriterion })} placeholder="Como você saberá que domina o suficiente?" />
            </Field>
            <label className="flex items-center gap-2 text-sm text-sub">
              <input type="checkbox" checked={!!s.criterionMet} onChange={(e) => update(s.id, { criterionMet: e.target.checked })} className="accent-[rgb(var(--accent))]" />
              Critério atingido
            </label>
          </div>

          <div className="space-y-3">
            <div>
              <p className="label">Projetos vinculados</p>
              <ul className="divide-y divide-line rounded-md border border-line">
                {s.links.map((l) => {
                  const p = projects.find((x) => x.id === l.projectId);
                  if (!p) return null;
                  return (
                    <li key={l.projectId} className="group flex flex-wrap items-center gap-2 px-3 py-2">
                      <a href={href("projeto", p.id)} className="min-w-0 flex-1 truncate text-sm text-ink hover:text-accent">{p.name}</a>
                      <Select value={l.status} onChange={(e) => link(s.id, p.id, e.target.value as "planejada" | "aplicada")} className="h-7 w-auto py-0 text-xs" aria-label="Status">
                        <option value="planejada">Planejada</option>
                        <option value="aplicada">Aplicada</option>
                      </Select>
                      <IconButton label="Desvincular" onClick={() => unlink(s.id, p.id)}><Trash2 size={12} /></IconButton>
                      <InlineText value={l.evidence} onCommit={(ev) => link(s.id, p.id, l.status, ev)} placeholder="Evidência: como foi aplicada (arquivo, commit, trecho)…" className="w-full text-xs text-sub" />
                    </li>
                  );
                })}
                {!s.links.length && <li className="px-3 py-2 text-xs text-mute">Nenhum projeto vinculado.</li>}
              </ul>
              {available.length > 0 && (
                <Select value="" onChange={(e) => e.target.value && link(s.id, e.target.value)} className="mt-2 w-auto text-xs" aria-label="Vincular projeto">
                  <option value="">+ Vincular a um projeto…</option>
                  {available.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </Select>
              )}
            </div>
            <Field label="Anotações"><InlineText multiline value={s.notes} onCommit={(notes) => update(s.id, { notes })} placeholder="Cursos, materiais, dúvidas…" /></Field>
            {s.history.length > 0 && (
              <div>
                <p className="label">Histórico de nível</p>
                <ul className="space-y-0.5 text-[11px] text-mute">
                  {[...s.history].reverse().slice(0, 6).map((h, i) => <li key={i}>{fmtDateTime(h.at)} → {LEVELS[h.level]}</li>)}
                </ul>
              </div>
            )}
            <div className="flex justify-end">
              <Button
                size="sm"
                variant="danger"
                icon={<Trash2 size={13} />}
                onClick={async () => {
                  if (await confirmDialog({ title: "Excluir competência?", body: `"${s.name}" será removida, junto com seus vínculos.`, confirmLabel: "Excluir", danger: true })) {
                    remove(s.id);
                    toast("Competência excluída");
                  }
                }}
              >
                Excluir
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
