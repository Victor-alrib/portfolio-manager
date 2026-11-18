import { useRef, useState, type ReactNode } from "react";
import { ArrowDown, ArrowLeft, ArrowUp, BookText, Calendar, Copy, ExternalLink, File, FileUp, GraduationCap, Link2, MessagesSquare, Plus, StickyNote, Trash2, ListChecks, History, Target } from "lucide-react";
import { useProject, useStore } from "../../store/store";
import { Badge, Button, Card, EmptyState, Field, IconButton, InlineText, Input, Progress, Select, TagInput, confirmDialog, toast } from "../../components/ui";
import { useChartTheme } from "../../components/theme";
import { LEVELS, STAGES, STAGE_LABEL, STAGE_SLOT } from "../../lib/constants";
import { projectProgress, readmeCompleteness, techUsage } from "../../lib/metrics";
import { cn, daysUntil, fmtBytes, fmtDate, fmtDateTime, nowIso, pct, relDays, uid } from "../../lib/utils";
import { href, navigate } from "../../router";
import { saveFile } from "../../lib/download";
import type { Priority, Project, Stage } from "../../types";

const MAX_UPLOAD = 150 * 1024; // mantém cada projeto abaixo do limite de sincronização

export function ProjectDetail({ id }: { id: string }) {
  const p = useProject(id);
  const update = useStore((s) => s.updateProject);
  const move = useStore((s) => s.moveProject);
  const remove = useStore((s) => s.removeProject);
  const duplicate = useStore((s) => s.duplicateProject);
  const projects = useStore((s) => s.projects);
  const ct = useChartTheme();

  if (!p)
    return (
      <EmptyState title="Projeto não encontrado" action={<Button onClick={() => navigate("projetos")}>Voltar aos projetos</Button>}>
        Ele pode ter sido removido.
      </EmptyState>
    );

  const set = (patch: Partial<Project> | ((c: Project) => Partial<Project>)) => update(p.id, patch);
  const progress = projectProgress(p);

  return (
    <div>
      <a href={href("projetos")} className="mb-3 inline-flex items-center gap-1 text-xs text-mute hover:text-ink">
        <ArrowLeft size={12} /> Projetos
      </a>

      {/* Cabeçalho */}
      <div className="mb-6">
        <InlineText value={p.name} onCommit={(name) => set({ name: name.trim() || p.name })} className="-ml-1 text-2xl font-semibold tracking-tight text-ink" />
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Select value={p.stage} onChange={(e) => move(p.id, e.target.value as Stage)} className="h-7 w-auto py-0 text-xs" aria-label="Etapa">
            {STAGES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </Select>
          <Select value={p.priority} onChange={(e) => set({ priority: e.target.value as Priority })} className="h-7 w-auto py-0 text-xs" aria-label="Prioridade">
            <option value="alta">Prioridade alta</option>
            <option value="media">Prioridade média</option>
            <option value="baixa">Prioridade baixa</option>
          </Select>
          <Badge color={ct.series[STAGE_SLOT[p.stage]]}>{STAGE_LABEL[p.stage]}</Badge>
          {p.roadmapPhase && <Badge>Fase {p.roadmapPhase} do roadmap</Badge>}
          <span className="text-xs text-mute">Atualizado {fmtDateTime(p.updatedAt)}</span>
          <div className="ml-auto flex flex-wrap gap-1.5">
            <Button size="sm" icon={<BookText size={13} />} onClick={() => navigate("readme", p.id)}>README</Button>
            <Button size="sm" icon={<MessagesSquare size={13} />} onClick={() => navigate("entrevistas", p.id)}>Entrevista</Button>
            <Button
              size="sm"
              variant="ghost"
              icon={<Copy size={13} />}
              onClick={() => {
                const c = duplicate(p.id);
                if (c) (toast("Projeto duplicado"), navigate("projeto", c.id));
              }}
            >
              Duplicar
            </Button>
            <Button
              size="sm"
              variant="danger"
              icon={<Trash2 size={13} />}
              onClick={async () => {
                if (await confirmDialog({ title: "Excluir projeto?", body: `"${p.name}" e todos os seus dados serão removidos. Essa ação não pode ser desfeita (exporte um backup JSON antes, se quiser).`, confirmLabel: "Excluir", danger: true })) {
                  remove(p.id);
                  toast("Projeto excluído");
                  navigate("projetos");
                }
              }}
            >
              Excluir
            </Button>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <Progress value={progress} className="max-w-sm" />
          <span className="text-xs tabular-nums text-sub">{pct(progress)} · {p.steps.filter((s) => s.done).length}/{p.steps.length} etapas · README {pct(readmeCompleteness(p))}</span>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card title={<Title icon={<Target size={14} />}>Visão geral</Title>}>
            <div className="space-y-3 p-4">
              <Field label="Descrição"><InlineText multiline value={p.description} onCommit={(description) => set({ description })} placeholder="O que é o projeto?" /></Field>
              <Field label="Objetivo"><InlineText multiline value={p.objective} onCommit={(objective) => set({ objective })} placeholder="O que ele demonstra?" /></Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Área / categoria"><InlineText value={p.area} onCommit={(area) => set({ area })} className="input" placeholder="Ex.: Energia" /></Field>
                <Field label="Fase do roadmap">
                  <Select value={p.roadmapPhase ?? ""} onChange={(e) => set({ roadmapPhase: e.target.value ? Number(e.target.value) : undefined })}>
                    <option value="">Sem fase</option>
                    {[1, 2, 3, 4].map((n) => <option key={n} value={n}>Fase {n}</option>)}
                  </Select>
                </Field>
              </div>
              <Field label="Tecnologias">
                <TagInput value={p.technologies} onChange={(technologies) => set({ technologies })} suggestions={techUsage(projects).map((t) => t.name)} />
              </Field>
              <Field label="Entregáveis">
                <TagInput value={p.deliverables} onChange={(deliverables) => set({ deliverables })} placeholder="Ex.: Repositório GitHub" />
              </Field>
            </div>
          </Card>

          <Steps p={p} set={set} />
          <SkillsPanel p={p} />
          <Card title={<Title icon={<StickyNote size={14} />}>Anotações</Title>}>
            <div className="p-4">
              <InlineText multiline value={p.notes} onCommit={(notes) => set({ notes })} placeholder="Ideias, decisões, referências, dúvidas…" className="min-h-[8rem] font-mono text-[13px]" />
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Dates p={p} set={set} />
          <Links p={p} set={set} />
          <Files p={p} set={set} />
          <Card title={<Title icon={<History size={14} />}>Histórico de etapas</Title>}>
            <ol className="space-y-2 p-4">
              {[...p.stageHistory].reverse().map((h, i) => (
                <li key={i} className="flex items-center gap-2 text-xs">
                  <span className="h-2 w-2 rounded-full" style={{ background: ct.series[STAGE_SLOT[h.stage]] }} />
                  <span className="text-ink">{STAGE_LABEL[h.stage]}</span>
                  <span className="ml-auto text-mute">{fmtDateTime(h.at)}</span>
                </li>
              ))}
            </ol>
          </Card>
        </div>
      </div>
    </div>
  );
}

const Title = ({ icon, children }: { icon: ReactNode; children: ReactNode }) => (
  <span className="flex items-center gap-1.5"><span className="text-mute">{icon}</span>{children}</span>
);

type Setter = (patch: Partial<Project> | ((c: Project) => Partial<Project>)) => void;

/* ───────── Etapas ───────── */
function Steps({ p, set }: { p: Project; set: Setter }) {
  const [t, setT] = useState("");
  const add = () => {
    if (!t.trim()) return;
    set((c) => ({ steps: [...c.steps, { id: uid("st"), title: t.trim(), done: false }] }));
    setT("");
  };
  const moveStep = (i: number, d: -1 | 1) =>
    set((c) => {
      const s = [...c.steps];
      const j = i + d;
      if (j < 0 || j >= s.length) return {};
      [s[i], s[j]] = [s[j], s[i]];
      return { steps: s };
    });
  return (
    <Card title={<Title icon={<ListChecks size={14} />}>Etapas de desenvolvimento</Title>} action={<span className="text-xs text-mute">{p.steps.filter((s) => s.done).length}/{p.steps.length}</span>}>
      <ul className="divide-y divide-line">
        {p.steps.map((s, i) => (
          <li key={s.id} className="group flex items-center gap-2 px-4 py-1.5">
            <input
              type="checkbox"
              checked={s.done}
              onChange={() => set((c) => ({ steps: c.steps.map((x) => (x.id === s.id ? { ...x, done: !x.done } : x)) }))}
              className="h-4 w-4 shrink-0 cursor-pointer accent-[rgb(var(--accent))]"
              aria-label={`Concluir ${s.title}`}
            />
            <InlineText
              value={s.title}
              onCommit={(title) => set((c) => ({ steps: c.steps.map((x) => (x.id === s.id ? { ...x, title } : x)) }))}
              className={cn("flex-1 py-1 text-sm", s.done && "text-mute line-through")}
            />
            <input
              type="date"
              value={s.dueDate ?? ""}
              onChange={(e) => set((c) => ({ steps: c.steps.map((x) => (x.id === s.id ? { ...x, dueDate: e.target.value || undefined } : x)) }))}
              className={cn(
                "w-[8.5rem] rounded border border-transparent bg-transparent px-1 text-xs outline-none hover:border-line focus:border-accent",
                s.dueDate && !s.done && daysUntil(s.dueDate) < 0 ? "text-red-500" : "text-sub",
                !s.dueDate && "opacity-0 group-hover:opacity-100 focus:opacity-100",
              )}
              aria-label="Data da etapa"
            />
            <div className="flex opacity-0 transition group-hover:opacity-100">
              <IconButton label="Subir" onClick={() => moveStep(i, -1)}><ArrowUp size={12} /></IconButton>
              <IconButton label="Descer" onClick={() => moveStep(i, 1)}><ArrowDown size={12} /></IconButton>
              <IconButton label="Remover etapa" onClick={() => set((c) => ({ steps: c.steps.filter((x) => x.id !== s.id) }))}><Trash2 size={12} /></IconButton>
            </div>
          </li>
        ))}
      </ul>
      <div className="flex gap-2 border-t border-line p-3">
        <Input value={t} onChange={(e) => setT(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} placeholder="Nova etapa…" />
        <Button onClick={add} icon={<Plus size={14} />} disabled={!t.trim()}>Adicionar</Button>
      </div>
    </Card>
  );
}

/* ───────── Datas ───────── */
function Dates({ p, set }: { p: Project; set: Setter }) {
  const [label, setLabel] = useState("");
  const [date, setDate] = useState("");
  return (
    <Card title={<Title icon={<Calendar size={14} />}>Datas importantes</Title>}>
      <div className="space-y-3 p-4">
        <div className="grid grid-cols-2 gap-2">
          <Field label="Início"><Input type="date" value={p.startDate ?? ""} onChange={(e) => set({ startDate: e.target.value || undefined })} /></Field>
          <Field label="Prazo final"><Input type="date" value={p.targetDate ?? ""} onChange={(e) => set({ targetDate: e.target.value || undefined })} /></Field>
        </div>
        {p.targetDate && p.stage !== "publicado" && (
          <p className={cn("text-xs", daysUntil(p.targetDate) < 0 ? "text-red-500" : "text-mute")}>Prazo {relDays(p.targetDate)}</p>
        )}
        {p.dates.length > 0 && (
          <ul className="space-y-1 border-t border-line pt-3">
            {[...p.dates].sort((a, b) => a.date.localeCompare(b.date)).map((d) => (
              <li key={d.id} className="group flex items-center gap-2 text-sm">
                <input type="checkbox" checked={!!d.done} onChange={() => set((c) => ({ dates: c.dates.map((x) => (x.id === d.id ? { ...x, done: !x.done } : x)) }))} className="accent-[rgb(var(--accent))]" aria-label="Marcar como concluída" />
                <span className="w-20 shrink-0 text-xs text-mute">{fmtDate(d.date)}</span>
                <span className={cn("flex-1 truncate text-xs", d.done ? "text-mute line-through" : "text-ink")} title={d.label}>{d.label}</span>
                <IconButton label="Remover data" className="opacity-0 group-hover:opacity-100" onClick={() => set((c) => ({ dates: c.dates.filter((x) => x.id !== d.id) }))}><Trash2 size={12} /></IconButton>
              </li>
            ))}
          </ul>
        )}
        <div className="flex gap-1.5">
          <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Marco (ex.: entrega TCC)" />
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-36" />
          <IconButton
            label="Adicionar data"
            className="h-8 w-8 border border-line"
            onClick={() => {
              if (!label.trim() || !date) return toast("Informe o marco e a data", "erro");
              set((c) => ({ dates: [...c.dates, { id: uid("d"), label: label.trim(), date }] }));
              setLabel("");
              setDate("");
            }}
          >
            <Plus size={14} />
          </IconButton>
        </div>
      </div>
    </Card>
  );
}

/* ───────── Links ───────── */
function Links({ p, set }: { p: Project; set: Setter }) {
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");
  const add = () => {
    let u = url.trim();
    if (!u) return;
    if (!/^https?:\/\//i.test(u)) u = "https://" + u;
    set((c) => ({ links: [...c.links, { id: uid("l"), label: label.trim() || u.replace(/^https?:\/\//, ""), url: u }] }));
    setLabel("");
    setUrl("");
  };
  return (
    <Card title={<Title icon={<Link2 size={14} />}>Links externos</Title>}>
      <div className="space-y-2 p-4">
        {p.links.map((l) => (
          <div key={l.id} className="group flex items-center gap-2">
            <ExternalLink size={12} className="shrink-0 text-mute" />
            <a href={l.url} target="_blank" rel="noreferrer" className="flex-1 truncate text-sm text-accent hover:underline" title={l.url}>{l.label}</a>
            <IconButton label="Remover link" className="opacity-0 group-hover:opacity-100" onClick={() => set((c) => ({ links: c.links.filter((x) => x.id !== l.id) }))}><Trash2 size={12} /></IconButton>
          </div>
        ))}
        {!p.links.length && <p className="text-xs text-mute">GitHub, dataset, artigo, post…</p>}
        <div className="space-y-1.5 border-t border-line pt-3">
          <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Rótulo (ex.: Repositório)" />
          <div className="flex gap-1.5">
            <Input value={url} onChange={(e) => setUrl(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} placeholder="https://…" />
            <IconButton label="Adicionar link" className="h-8 w-8 border border-line" onClick={add}><Plus size={14} /></IconButton>
          </div>
        </div>
      </div>
    </Card>
  );
}

/* ───────── Arquivos ───────── */
function Files({ p, set }: { p: Project; set: Setter }) {
  const input = useRef<HTMLInputElement>(null);
  const [ref, setRef] = useState("");
  const onFiles = (list: FileList | null) => {
    if (!list) return;
    [...list].forEach((f) => {
      if (f.size > MAX_UPLOAD) {
        toast(`"${f.name}" tem ${fmtBytes(f.size)}. Para arquivos acima de ${fmtBytes(MAX_UPLOAD)}, registre como referência (caminho ou link).`, "erro");
        return;
      }
      const r = new FileReader();
      r.onload = () =>
        set((c) => ({ files: [...c.files, { id: uid("f"), name: f.name, kind: "upload", dataUrl: String(r.result), size: f.size, mime: f.type, addedAt: nowIso() }] }));
      r.readAsDataURL(f);
    });
  };
  const download = async (dataUrl: string, name: string) => {
    const blob = await (await fetch(dataUrl)).blob();
    const out = await saveFile(name, blob);
    if (out === "failed") toast("Não foi possível baixar o arquivo", "erro");
  };
  return (
    <Card title={<Title icon={<File size={14} />}>Arquivos relacionados</Title>}>
      <div
        className="space-y-2 p-4"
        onDragOver={(e) => (e.preventDefault(), e.currentTarget.classList.add("drop-target"))}
        onDragLeave={(e) => e.currentTarget.classList.remove("drop-target")}
        onDrop={(e) => (e.preventDefault(), e.currentTarget.classList.remove("drop-target"), onFiles(e.dataTransfer.files))}
      >
        {p.files.map((f) => (
          <div key={f.id} className="group flex items-center gap-2 text-sm">
            <File size={13} className="shrink-0 text-mute" />
            {f.kind === "upload" && f.dataUrl ? (
              <button onClick={() => download(f.dataUrl!, f.name)} className="flex-1 truncate text-left text-ink hover:text-accent" title="Baixar">{f.name}</button>
            ) : f.url && /^https?:/i.test(f.url) ? (
              <a href={f.url} target="_blank" rel="noreferrer" className="flex-1 truncate text-accent hover:underline">{f.name}</a>
            ) : (
              <span className="flex-1 truncate font-mono text-xs text-sub" title={f.url}>{f.name}</span>
            )}
            <span className="text-[11px] text-mute">{f.kind === "upload" ? fmtBytes(f.size) : "ref."}</span>
            <IconButton label="Remover arquivo" className="opacity-0 group-hover:opacity-100" onClick={() => set((c) => ({ files: c.files.filter((x) => x.id !== f.id) }))}><Trash2 size={12} /></IconButton>
          </div>
        ))}
        {!p.files.length && <p className="text-xs text-mute">Arraste arquivos pequenos aqui (até {fmtBytes(MAX_UPLOAD)}) ou registre caminhos/links de notebooks, datasets e relatórios.</p>}
        <div className="flex gap-1.5 border-t border-line pt-3">
          <Input
            value={ref}
            onChange={(e) => setRef(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && ref.trim()) {
                const v = ref.trim();
                set((c) => ({ files: [...c.files, { id: uid("f"), name: v.split(/[\\/]/).filter(Boolean).pop() || v, kind: "referencia", url: v, addedAt: nowIso() }] }));
                setRef("");
              }
            }}
            placeholder="Caminho ou link + Enter"
          />
          <IconButton label="Enviar arquivo" className="h-8 w-8 border border-line" onClick={() => input.current?.click()}><FileUp size={14} /></IconButton>
          <input ref={input} type="file" multiple hidden onChange={(e) => (onFiles(e.target.files), (e.target.value = ""))} />
        </div>
      </div>
    </Card>
  );
}

/* ───────── Competências ───────── */
function SkillsPanel({ p }: { p: Project }) {
  const skills = useStore((s) => s.skills);
  const link = useStore((s) => s.linkSkill);
  const unlink = useStore((s) => s.unlinkSkill);
  const linked = skills.filter((s) => s.links.some((l) => l.projectId === p.id));
  const available = skills.filter((s) => !linked.includes(s));
  return (
    <Card title={<Title icon={<GraduationCap size={14} />}>Competências</Title>} action={<a href={href("competencias")} className="text-xs text-mute hover:text-ink">Gerenciar</a>}>
      <ul className="divide-y divide-line">
        {linked.map((s) => {
          const l = s.links.find((x) => x.projectId === p.id)!;
          return (
            <li key={s.id} className="group flex flex-wrap items-center gap-2 px-4 py-2">
              <span className="w-44 truncate text-sm text-ink">{s.name}</span>
              <span className="text-[11px] text-mute">{LEVELS[s.level]}</span>
              <Select value={l.status} onChange={(e) => link(s.id, p.id, e.target.value as "planejada" | "aplicada")} className="h-7 w-auto py-0 text-xs" aria-label="Status do vínculo">
                <option value="planejada">Planejada</option>
                <option value="aplicada">Aplicada</option>
              </Select>
              <InlineText value={l.evidence} onCommit={(ev) => link(s.id, p.id, l.status, ev)} placeholder="Como foi/será aplicada…" className="min-w-[10rem] flex-1 text-xs text-sub" />
              <IconButton label="Desvincular" className="opacity-0 group-hover:opacity-100" onClick={() => unlink(s.id, p.id)}><Trash2 size={12} /></IconButton>
            </li>
          );
        })}
      </ul>
      {!linked.length && <p className="px-4 pt-3 text-xs text-mute">Nenhuma competência vinculada.</p>}
      {available.length > 0 && (
        <div className="p-3">
          <Select value="" onChange={(e) => e.target.value && link(e.target.value, p.id)} className="w-auto text-xs" aria-label="Vincular competência">
            <option value="">+ Vincular competência…</option>
            {available.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </Select>
        </div>
      )}
    </Card>
  );
}

