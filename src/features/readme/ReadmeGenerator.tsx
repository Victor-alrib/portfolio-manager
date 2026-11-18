import { useMemo, useState } from "react";
import { AlertTriangle, BookText, Check, ClipboardCopy, Download, HelpCircle, ShieldCheck, Wand2 } from "lucide-react";
import { useStore } from "../../store/store";
import { Button, Card, EmptyState, MarkdownView, PageHeader, Select, Textarea, Tabs, toast } from "../../components/ui";
import { README_SECTIONS, STAGE_INDEX, STAGE_LABEL } from "../../lib/constants";
import { findNumericClaims, readmeCompleteness } from "../../lib/metrics";
import { readmeMarkdown } from "../../lib/markdown";
import { copyWithToast, saveWithToast } from "../../lib/actions";
import { cn, pct, slugify } from "../../lib/utils";
import { navigate } from "../../router";
import type { ReadmeDraft } from "../../types";

type Key = (typeof README_SECTIONS)[number]["key"];

export function ReadmeGenerator({ projectId }: { projectId?: string }) {
  const projects = useStore((s) => s.projects);
  const update = useStore((s) => s.updateProject);
  const p = projects.find((x) => x.id === projectId) ?? projects[0];
  const [view, setView] = useState<"preview" | "raw">("preview");
  const [placeholders, setPlaceholders] = useState(true);
  const [openHint, setOpenHint] = useState<Key | null>(null);
  const [draft, setDraft] = useState<Record<string, string>>({});

  const md = useMemo(() => (p ? readmeMarkdown({ ...p, readme: { ...p.readme, ...draft } as ReadmeDraft }, { includePlaceholders: placeholders }) : ""), [p, draft, placeholders]);

  if (!p)
    return <EmptyState icon={<BookText size={22} />} title="Nenhum projeto cadastrado">Crie um projeto para gerar o README.</EmptyState>;

  const r = { ...p.readme, ...draft } as ReadmeDraft;
  const setField = (k: Key, v: string) => setDraft((d) => ({ ...d, [k]: v }));
  const commit = (k: Key) => {
    if (draft[k] === undefined) return;
    update(p.id, (c) => ({ readme: { ...c.readme, [k]: draft[k], updatedAt: new Date().toISOString() } }));
    setDraft(({ [k]: _drop, ...rest }) => rest);
  };

  const claims = findNumericClaims(r.resultados);
  const earlyStage = STAGE_INDEX[p.stage] < STAGE_INDEX.testes;

  /** Preenche apenas campos vazios com dados factuais já registrados no projeto. */
  const prefill = () => {
    const pending = p.steps.filter((s) => !s.done).map((s) => `- ${s.title}`).join("\n");
    const fill: Partial<ReadmeDraft> = {};
    if (!p.readme.problema.trim() && (p.description || p.objective)) fill.problema = [p.description, p.objective].filter(Boolean).join("\n\n");
    if (!p.readme.tecnologias.trim() && p.technologies.length) fill.tecnologias = p.technologies.map((t) => `- ${t}`).join("\n");
    if (!p.readme.proximosPassos.trim() && pending) fill.proximosPassos = pending;
    if (!Object.keys(fill).length) return toast("Nada a preencher: os campos já têm conteúdo ou o projeto não tem dados para isso.", "info");
    update(p.id, (c) => ({ readme: { ...c.readme, ...fill } }));
    toast(`Preenchido: ${Object.keys(fill).length} seção(ões) com dados do próprio projeto`);
  };

  const filename = `README-${slugify(p.name)}.md`;

  return (
    <div>
      <PageHeader
        title="Gerador de README"
        subtitle="Estrutura: problema → dados → abordagem → tecnologias → metodologia → resultados → aprendizados → próximos passos"
        actions={
          <Select value={p.id} onChange={(e) => (setDraft({}), navigate("readme", e.target.value))} className="w-72" aria-label="Projeto">
            {projects.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
          </Select>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-lg border border-line bg-panel px-4 py-2.5 text-xs">
        <ShieldCheck size={15} className="text-accent" />
        <p className="flex-1 text-sub">
          O gerador <strong className="text-ink">nunca cria métricas, resultados ou experiências</strong>. Ele só organiza o que você escreve; seções vazias ficam marcadas como pendentes e “Resultados” vazio vira um aviso explícito.
        </p>
        <span className="text-mute">Completo: <span className="font-medium text-ink">{pct(readmeCompleteness(p))}</span></span>
        <Button size="sm" icon={<Wand2 size={13} />} onClick={prefill} title="Usa descrição, objetivo, tecnologias e etapas pendentes do projeto">Usar dados do projeto</Button>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="space-y-3">
          {README_SECTIONS.map((s, i) => (
            <Card key={s.key}>
              <div className="p-3">
                <div className="mb-1.5 flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded bg-elev text-[10px] font-semibold text-sub">{i + 1}</span>
                  <h3 className="text-sm font-medium text-ink">{s.title}</h3>
                  {r[s.key].trim() ? <Check size={13} className="text-emerald-500" aria-label="Preenchido" /> : <span className="text-[11px] text-mute">pendente</span>}
                  <button onClick={() => setOpenHint(openHint === s.key ? null : s.key)} className="ml-auto flex items-center gap-1 text-[11px] text-mute hover:text-ink" aria-expanded={openHint === s.key}>
                    <HelpCircle size={12} /> Guia
                  </button>
                </div>
                {openHint === s.key && (
                  <ul className="mb-2 list-disc space-y-0.5 rounded-md bg-elev/60 py-2 pl-7 pr-3 text-[11px] text-sub">
                    {s.guide.map((g) => <li key={g}>{g}</li>)}
                  </ul>
                )}
                <Textarea
                  value={r[s.key]}
                  onChange={(e) => setField(s.key, e.target.value)}
                  onBlur={() => commit(s.key)}
                  placeholder={s.guide[0]}
                  className="min-h-[4.5rem] text-[13px]"
                />
                {s.key === "resultados" && (
                  <div className="mt-2 space-y-2">
                    <label className="flex items-start gap-2 text-xs text-sub">
                      <input
                        type="checkbox"
                        checked={p.readme.resultadosVerificados}
                        onChange={(e) => update(p.id, (c) => ({ readme: { ...c.readme, resultadosVerificados: e.target.checked } }))}
                        className="mt-0.5 accent-[rgb(var(--accent))]"
                      />
                      Confirmo que estes resultados foram medidos por mim, são reproduzíveis e informam métrica, conjunto avaliado e baseline.
                    </label>
                    {claims.length > 0 && !p.readme.resultadosVerificados && (
                      <Warn>
                        Encontrei possíveis métricas ({claims.map((c) => `“${c}”`).join(", ")}). Elas só serão apresentadas como definitivas depois que você marcar a confirmação acima; até lá, o README as rotula como preliminares.
                      </Warn>
                    )}
                    {r.resultados.trim() && earlyStage && (
                      <Warn>O projeto está em “{STAGE_LABEL[p.stage]}”. Confira se esses resultados já existem de fato.</Warn>
                    )}
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>

        <div className="xl:sticky xl:top-4 xl:self-start">
          <Card
            title={<Tabs tabs={[{ id: "preview", label: "Pré-visualização" }, { id: "raw", label: "Markdown" }]} value={view} onChange={setView} />}
            action={
              <div className="flex items-center gap-1.5">
                <label className="mr-2 flex items-center gap-1.5 text-[11px] text-mute">
                  <input type="checkbox" checked={placeholders} onChange={(e) => setPlaceholders(e.target.checked)} className="accent-[rgb(var(--accent))]" />
                  Mostrar pendências
                </label>
                <Button size="sm" icon={<ClipboardCopy size={13} />} onClick={() => copyWithToast(md, "README copiado")}>Copiar</Button>
                <Button size="sm" variant="primary" icon={<Download size={13} />} onClick={() => saveWithToast(filename, md)}>.md</Button>
              </div>
            }
          >
            <div className="max-h-[75vh] overflow-y-auto p-5">
              {view === "preview" ? <MarkdownView md={md} /> : <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-sub">{md}</pre>}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

const Warn = ({ children }: { children: React.ReactNode }) => (
  <p className={cn("flex items-start gap-1.5 rounded-md border border-amber-500/30 bg-amber-500/5 px-2.5 py-1.5 text-[11px] text-amber-700 dark:text-amber-400")}>
    <AlertTriangle size={12} className="mt-0.5 shrink-0" />
    <span>{children}</span>
  </p>
);
