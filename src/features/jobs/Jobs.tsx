import { useMemo, useState } from "react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowLeft, Briefcase, CheckCircle2, ClipboardPaste, ExternalLink, Plus, Trash2, XCircle, MinusCircle } from "lucide-react";
import { useStore } from "../../store/store";
import { Badge, Button, Card, EmptyState, Field, IconButton, InlineText, Input, Modal, PageHeader, Progress, Select, Textarea, confirmDialog, toast } from "../../components/ui";
import { useChartTheme } from "../../components/theme";
import { ChartTooltip } from "../dashboard/Dashboard";
import { JOB_STAGES, LEVELS } from "../../lib/constants";
import { jobMatch } from "../../lib/metrics";
import { cn, fmtDate, pct, uid } from "../../lib/utils";
import { href, navigate } from "../../router";
import type { Job, JobStage, Skill } from "../../types";

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
/** Tenta associar um requisito textual a uma competência existente. */
export function guessSkill(name: string, skills: Skill[]): string | undefined {
  const n = norm(name);
  const STOP = new Set(["com", "para", "experiencia", "conhecimento", "dados", "basico", "classico"]);
  const words = (x: string) => x.split(/[^a-z0-9+#]+/).filter((w) => w.length > 2 && !STOP.has(w));
  const nw = new Set(words(n));
  const hit = skills.find((s) => {
    const sn = norm(s.name).replace(/\(.*\)/, "").trim();
    return n.includes(sn) || words(norm(s.name)).some((w) => nw.has(w));
  });
  return hit?.id;
}

export function Jobs({ jobId }: { jobId?: string }) {
  const jobs = useStore((s) => s.jobs);
  const skills = useStore((s) => s.skills);
  const addJob = useStore((s) => s.addJob);
  const roles = useStore((s) => s.settings.career.targetRoles);
  const ct = useChartTheme();
  const job = jobs.find((j) => j.id === jobId);

  const demand = useMemo(() => {
    const m = new Map<string, number>();
    jobs.forEach((j) => j.requirements.forEach((r) => {
      const k = r.skillId ? skills.find((s) => s.id === r.skillId)?.name ?? r.name : r.name;
      m.set(k, (m.get(k) ?? 0) + 1);
    }));
    return [...m.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 10);
  }, [jobs, skills]);

  if (job) return <JobDetail job={job} />;

  return (
    <div>
      <PageHeader
        icon={<Briefcase size={18} />}
        title="Vagas de interesse"
        subtitle="Registre requisitos técnicos e compare com as competências que você já desenvolveu"
        actions={<Button variant="primary" icon={<Plus size={14} />} onClick={() => navigate("vagas", addJob().id)}>Nova vaga</Button>}
      />

      {roles.length > 0 && (
        <p className="mb-4 text-xs text-mute">
          Perfil-alvo da fase atual: {roles.map((r) => <Badge key={r} className="mr-1">{r}</Badge>)}
        </p>
      )}

      {jobs.length === 0 ? (
        <EmptyState icon={<Briefcase size={22} />} title="Nenhuma vaga cadastrada" action={<Button icon={<Plus size={14} />} onClick={() => navigate("vagas", addJob().id)}>Cadastrar vaga</Button>}>
          Cole os requisitos de uma vaga real para ver quais competências você já tem e quais são lacunas.
        </EmptyState>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="space-y-2 lg:col-span-2">
            {jobs.map((j) => {
              const m = jobMatch(j, skills);
              return (
                <a key={j.id} href={href("vagas", j.id)} className="card flex items-center gap-4 p-4 transition hover:border-accent/40">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">{j.title}</p>
                    <p className="truncate text-xs text-mute">{[j.company, j.location, j.salary].filter(Boolean).join(" · ") || "—"}</p>
                    <div className="mt-1.5 flex gap-1.5">
                      <Badge>{JOB_STAGES.find((s) => s.id === j.stage)?.label}</Badge>
                      {m.mandatoryMissing.length > 0 && <Badge className="border-amber-500/30 text-amber-600 dark:text-amber-400">{m.mandatoryMissing.length} obrigatório(s) abaixo do nível</Badge>}
                    </div>
                  </div>
                  <div className="w-32 text-right">
                    <p className="text-lg font-semibold tabular-nums text-ink">{j.requirements.length ? pct(m.score) : "—"}</p>
                    <p className="text-[11px] text-mute">aderência</p>
                    <Progress value={m.score} className="mt-1" />
                  </div>
                </a>
              );
            })}
          </div>
          <Card title="Requisitos mais pedidos">
            {demand.length ? (
              <div className="h-72 p-3">
                <ResponsiveContainer>
                  <BarChart data={demand} layout="vertical" margin={{ left: 0, right: 16 }}>
                    <XAxis type="number" allowDecimals={false} tick={{ fill: ct.axis, fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" width={120} interval={0} tick={{ fill: ct.text, fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip cursor={{ fill: ct.track, opacity: 0.5 }} content={<ChartTooltip fmt={(v) => `${v} vaga(s)`} />} />
                    <Bar dataKey="count" name="Vagas" fill={ct.series[2]} radius={[0, 4, 4, 0]} maxBarSize={12} isAnimationActive={false} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="p-4 text-xs text-mute">Adicione requisitos às vagas para ver a demanda agregada.</p>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}

function JobDetail({ job }: { job: Job }) {
  const skills = useStore((s) => s.skills);
  const update = useStore((s) => s.updateJob);
  const remove = useStore((s) => s.removeJob);
  const addSkill = useStore((s) => s.addSkill);
  const [paste, setPaste] = useState(false);
  const [text, setText] = useState("");
  const [newReq, setNewReq] = useState("");
  const m = jobMatch(job, skills);
  const set = (patch: Partial<Job> | ((j: Job) => Partial<Job>)) => update(job.id, patch);

  const addReqs = (names: string[], type: "obrigatorio" | "desejavel" = "obrigatorio") =>
    set((j) => ({
      requirements: [
        ...j.requirements,
        ...names.map((name) => ({ id: uid("r"), name, skillId: guessSkill(name, skills), requiredLevel: 3, type })),
      ],
    }));

  return (
    <div>
      <a href={href("vagas")} className="mb-3 inline-flex items-center gap-1 text-xs text-mute hover:text-ink"><ArrowLeft size={12} /> Vagas</a>
      <InlineText value={job.title} onCommit={(title) => set({ title: title || job.title })} className="-ml-1 mb-4 text-2xl font-semibold tracking-tight" />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="Dados da vaga">
          <div className="space-y-3 p-4">
            <Field label="Empresa"><InlineText value={job.company} onCommit={(company) => set({ company })} className="input" /></Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Local / modelo"><InlineText value={job.location} onCommit={(location) => set({ location })} className="input" placeholder="Remoto, SP…" /></Field>
              <Field label="Faixa salarial"><InlineText value={job.salary} onCommit={(salary) => set({ salary })} className="input" placeholder="Se informada" /></Field>
            </div>
            <Field label="Link da vaga">
              <div className="flex gap-1.5">
                <InlineText value={job.url} onCommit={(url) => set({ url })} className="input" placeholder="https://…" />
                {/^https?:/.test(job.url) && <a href={job.url} target="_blank" rel="noreferrer" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-line text-mute hover:text-ink" aria-label="Abrir vaga"><ExternalLink size={13} /></a>}
              </div>
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Status">
                <Select value={job.stage} onChange={(e) => set({ stage: e.target.value as JobStage })}>
                  {JOB_STAGES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                </Select>
              </Field>
              <Field label="Prazo" hint={job.deadline ? fmtDate(job.deadline) : undefined}>
                <Input type="date" value={job.deadline ?? ""} onChange={(e) => set({ deadline: e.target.value || undefined })} />
              </Field>
            </div>
            <Field label="Anotações"><InlineText multiline value={job.notes} onCommit={(notes) => set({ notes })} placeholder="Contato, etapas do processo, impressões…" /></Field>
            <Button
              size="sm"
              variant="danger"
              icon={<Trash2 size={13} />}
              onClick={async () => {
                if (await confirmDialog({ title: "Excluir vaga?", body: `"${job.title}" será removida.`, confirmLabel: "Excluir", danger: true })) {
                  remove(job.id);
                  navigate("vagas");
                }
              }}
            >
              Excluir vaga
            </Button>
          </div>
        </Card>

        <div className="space-y-4 lg:col-span-2">
          <Card
            title="Requisitos × suas competências"
            action={<Button size="sm" icon={<ClipboardPaste size={13} />} onClick={() => setPaste(true)}>Colar lista</Button>}
          >
            <div className="flex flex-wrap items-center gap-6 border-b border-line px-4 py-3">
              <div>
                <p className="text-2xl font-semibold tabular-nums">{job.requirements.length ? pct(m.score) : "—"}</p>
                <p className="text-[11px] text-mute">aderência ponderada (obrigatórios valem 2×)</p>
              </div>
              <div className="text-xs text-sub">
                <p>{m.rows.filter((r) => r.met).length} de {m.rows.length} requisitos atendidos</p>
                <p>{m.mandatoryMissing.length} obrigatório(s) com lacuna · {m.unmapped.length} sem competência mapeada</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wide text-mute">
                    <th className="px-4 py-2 font-medium">Requisito</th>
                    <th className="px-2 py-2 font-medium">Tipo</th>
                    <th className="px-2 py-2 font-medium">Competência</th>
                    <th className="px-2 py-2 font-medium">Exigido</th>
                    <th className="px-2 py-2 font-medium">Você</th>
                    <th className="px-2 py-2 font-medium" />
                  </tr>
                </thead>
                <tbody>
                  {m.rows.map(({ req, skill, level, met, applied }) => (
                    <tr key={req.id} className="border-t border-line">
                      <td className="px-4 py-1.5">
                        <InlineText value={req.name} onCommit={(name) => set((j) => ({ requirements: j.requirements.map((r) => (r.id === req.id ? { ...r, name } : r)) }))} className="text-sm" />
                      </td>
                      <td className="px-2">
                        <Select value={req.type} onChange={(e) => set((j) => ({ requirements: j.requirements.map((r) => (r.id === req.id ? { ...r, type: e.target.value as "obrigatorio" | "desejavel" } : r)) }))} className="h-7 w-28 py-0 text-xs" aria-label="Tipo">
                          <option value="obrigatorio">Obrigatório</option>
                          <option value="desejavel">Desejável</option>
                        </Select>
                      </td>
                      <td className="px-2">
                        <div className="flex items-center gap-1">
                          <Select value={req.skillId ?? ""} onChange={(e) => set((j) => ({ requirements: j.requirements.map((r) => (r.id === req.id ? { ...r, skillId: e.target.value || undefined } : r)) }))} className="h-7 w-44 py-0 text-xs" aria-label="Competência">
                            <option value="">— não mapeado —</option>
                            {skills.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                          </Select>
                          {!skill && (
                            <IconButton
                              label="Criar competência a partir do requisito"
                              onClick={() => {
                                const k = addSkill({ name: req.name, category: "Vagas", target: req.requiredLevel });
                                set((j) => ({ requirements: j.requirements.map((r) => (r.id === req.id ? { ...r, skillId: k.id } : r)) }));
                                toast(`Competência "${req.name}" criada`);
                              }}
                            >
                              <Plus size={12} />
                            </IconButton>
                          )}
                        </div>
                      </td>
                      <td className="px-2">
                        <Select value={req.requiredLevel} onChange={(e) => set((j) => ({ requirements: j.requirements.map((r) => (r.id === req.id ? { ...r, requiredLevel: Number(e.target.value) } : r)) }))} className="h-7 w-36 py-0 text-xs" aria-label="Nível exigido">
                          {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n} · {LEVELS[n]}</option>)}
                        </Select>
                      </td>
                      <td className="px-2 text-xs">
                        <span className={cn("flex items-center gap-1", met ? "text-emerald-600 dark:text-emerald-400" : skill ? "text-amber-600 dark:text-amber-400" : "text-mute")}>
                          {met ? <CheckCircle2 size={13} /> : skill ? <MinusCircle size={13} /> : <XCircle size={13} />}
                          {skill ? `${level} · ${LEVELS[level]}` : "—"}
                        </span>
                        {skill && <span className="block pl-[18px] text-[10px] text-mute">{applied} projeto(s) com aplicação</span>}
                      </td>
                      <td className="px-2">
                        <IconButton label="Remover requisito" onClick={() => set((j) => ({ requirements: j.requirements.filter((r) => r.id !== req.id) }))}><Trash2 size={12} /></IconButton>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex gap-2 border-t border-line p-3">
              <Input value={newReq} onChange={(e) => setNewReq(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && newReq.trim()) { addReqs([newReq.trim()]); setNewReq(""); } }} placeholder="Novo requisito (ex.: SQL avançado)" />
              <Button icon={<Plus size={14} />} disabled={!newReq.trim()} onClick={() => { addReqs([newReq.trim()]); setNewReq(""); }}>Adicionar</Button>
            </div>
          </Card>

          {m.rows.some((r) => !r.met) && (
            <Card title="Plano para fechar lacunas">
              <ul className="space-y-1.5 p-4 text-sm">
                {m.rows.filter((r) => !r.met).sort((a, b) => (a.req.type === "obrigatorio" ? -1 : 1) - (b.req.type === "obrigatorio" ? -1 : 1)).map(({ req, skill, gap }) => (
                  <li key={req.id} className="flex items-start gap-2">
                    <span className={cn("mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full", req.type === "obrigatorio" ? "bg-amber-500" : "bg-mute")} />
                    <span className="text-sub">
                      <strong className="text-ink">{req.name}</strong>{" "}
                      {skill ? `— subir ${gap} nível(is) em ${skill.name}${skill.links.length ? `; projetos onde aplicar: ${skill.links.length}` : "; vincule a um projeto do portfólio"}.` : "— sem competência mapeada: crie ou associe uma competência."}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      </div>

      <Modal
        open={paste}
        onClose={() => setPaste(false)}
        title="Colar requisitos da vaga"
        footer={
          <>
            <Button variant="ghost" onClick={() => setPaste(false)}>Cancelar</Button>
            <Button
              variant="primary"
              onClick={() => {
                const items = text.split(/\n|;|•/).map((l) => l.replace(/^[\s\-*\d.)]+/, "").trim()).filter((l) => l.length > 1);
                if (items.length) addReqs(items);
                toast(`${items.length} requisito(s) adicionados`);
                setText("");
                setPaste(false);
              }}
            >
              Adicionar
            </Button>
          </>
        }
      >
        <p className="mb-2 text-xs text-mute">Um requisito por linha. O app tenta associar cada um às suas competências pelo nome — revise depois.</p>
        <Textarea value={text} onChange={(e) => setText(e.target.value)} className="min-h-[10rem] font-mono text-xs" placeholder={"Python\nSQL\nSéries temporais\nExperiência com Azure ou Databricks"} />
      </Modal>
    </div>
  );
}
