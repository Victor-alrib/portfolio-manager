import { useState } from "react";
import { ClipboardCopy, Download, Lightbulb, MessagesSquare, Plus } from "lucide-react";
import { useStore } from "../../store/store";
import { Button, Card, EmptyState, InlineText, MarkdownView, PageHeader, Select } from "../../components/ui";
import { STAGE_INDEX, STAGE_LABEL } from "../../lib/constants";
import { interviewMarkdown } from "../../lib/markdown";
import { copyWithToast, saveWithToast } from "../../lib/actions";
import { slugify } from "../../lib/utils";
import { navigate } from "../../router";
import type { InterviewPrep, Project } from "../../types";

const FIELDS: { key: keyof InterviewPrep; label: string; hint: string }[] = [
  { key: "pitch", label: "Pitch de 60 segundos", hint: "Problema, o que você construiu, por que importa — em linguagem simples." },
  { key: "contexto", label: "Situação / contexto", hint: "Onde o problema aparece? Conecte com sua experiência real (estágio, iniciação científica, curso)." },
  { key: "desafio", label: "Tarefa / desafio", hint: "O que precisava ser resolvido e qual era a dificuldade técnica?" },
  { key: "acao", label: "Ação", hint: "O que VOCÊ fez: decisões, ferramentas, etapas." },
  { key: "resultado", label: "Resultado", hint: "Somente o que foi medido. Se ainda não há, diga o que pretende validar e como." },
  { key: "decisoes", label: "Decisões técnicas e trade-offs", hint: "Por que esse modelo/métrica/arquitetura e não outro?" },
  { key: "perguntas", label: "Perguntas prováveis e respostas", hint: "Use as sugestões ao lado para treinar." },
];

/** Perguntas genéricas, guiadas pelo conteúdo do projeto (não são respostas). */
function likelyQuestions(p: Project): string[] {
  const t = p.technologies.join(" ").toLowerCase();
  const q = [
    "Qual problema esse projeto resolve e para quem?",
    "De onde vieram os dados e quais são as limitações deles?",
    "Qual foi o baseline e por que ele é uma comparação justa?",
    "Como você garantiu que não houve vazamento de dados entre treino e teste?",
    "Que métrica você escolheu e por quê?",
    "O que você faria diferente se começasse de novo?",
    "Como esse projeto iria para produção?",
  ];
  if (/s[ée]ries|lstm|arima|prophet/.test(t)) q.push("Como você dividiu os dados no tempo? Por que não um k-fold aleatório?");
  if (/xgboost|random forest|scikit/.test(t)) q.push("Como você lidou com desbalanceamento de classes (falhas são raras)?");
  if (/pytorch|lstm|autoencoder/.test(t)) q.push("Por que uma rede neural aqui? O ganho justifica a complexidade frente a um modelo clássico?");
  if (/modbus|opc|pymodbus/.test(t)) q.push("Explique como um dado sai de um CLP/SCADA até virar uma tabela analisável.", "Quais anomalias você simulou e como evitou que o modelo apenas decorasse o simulador?");
  if (/otimiza|modos deslizantes|controle/.test(t)) q.push("Qual função de custo você otimizou e como garantiu estabilidade do controlador?");
  if (/sql/.test(t)) q.push("Mostre uma query que você escreveu para preparar os dados.");
  return q;
}

export function Interview({ projectId }: { projectId?: string }) {
  const projects = useStore((s) => s.projects);
  const update = useStore((s) => s.updateProject);
  const p = projects.find((x) => x.id === projectId) ?? projects[0];
  const [showPreview, setShowPreview] = useState(false);

  if (!p) return <EmptyState icon={<MessagesSquare size={22} />} title="Nenhum projeto cadastrado" />;
  const set = (k: keyof InterviewPrep, v: string) => update(p.id, (c) => ({ interview: { ...c.interview, [k]: v } }));
  const early = STAGE_INDEX[p.stage] < STAGE_INDEX.testes;
  const md = interviewMarkdown(p);

  return (
    <div>
      <PageHeader
        icon={<MessagesSquare size={18} />}
        title="Preparação para entrevistas"
        subtitle="Monte a narrativa de cada projeto no formato STAR"
        actions={
          <>
            <Select value={p.id} onChange={(e) => navigate("entrevistas", e.target.value)} className="w-72" aria-label="Projeto">
              {projects.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
            </Select>
            <Button onClick={() => setShowPreview((v) => !v)}>{showPreview ? "Editar" : "Ver ficha"}</Button>
          </>
        }
      />

      {early && (
        <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-2.5 text-xs text-amber-700 dark:text-amber-400">
          Este projeto está em <strong>{STAGE_LABEL[p.stage]}</strong>. Em entrevista, apresente-o como projeto em andamento: fale do problema, do plano e das decisões — não de resultados que ainda não existem.
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {showPreview ? (
            <Card
              title="Ficha de entrevista"
              action={
                <div className="flex gap-1.5">
                  <Button size="sm" icon={<ClipboardCopy size={13} />} onClick={() => copyWithToast(md, "Ficha copiada")}>Copiar</Button>
                  <Button size="sm" variant="primary" icon={<Download size={13} />} onClick={() => saveWithToast(`entrevista-${slugify(p.name)}.md`, md)}>.md</Button>
                </div>
              }
            >
              <div className="p-5"><MarkdownView md={md} /></div>
            </Card>
          ) : (
            <div className="space-y-3">
              {FIELDS.map((f) => (
                <Card key={f.key}>
                  <div className="p-3">
                    <p className="text-sm font-medium text-ink">{f.label}</p>
                    <p className="mb-1.5 text-[11px] text-mute">{f.key === "resultado" && early ? "Projeto em andamento: descreva o que você pretende validar e como medir." : f.hint}</p>
                    <InlineText multiline value={p.interview[f.key]} onCommit={(v) => set(f.key, v)} className="min-h-[4rem] text-[13px]" />
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <Card title={<span className="flex items-center gap-1.5"><Lightbulb size={14} className="text-mute" /> Perguntas prováveis</span>}>
            <ul className="space-y-1 p-3">
              {likelyQuestions(p).map((q) => (
                <li key={q} className="group flex items-start gap-2 rounded px-1.5 py-1 text-xs text-sub hover:bg-elev">
                  <span className="flex-1">{q}</span>
                  <button
                    aria-label="Adicionar à lista de perguntas"
                    title="Adicionar às suas perguntas"
                    onClick={() => set("perguntas", `${p.interview.perguntas ? p.interview.perguntas + "\n\n" : ""}**P:** ${q}\n**R:** `)}
                    className="text-mute opacity-0 hover:text-ink group-hover:opacity-100"
                  >
                    <Plus size={13} />
                  </button>
                </li>
              ))}
            </ul>
          </Card>
          <Card title="Base factual do projeto">
            <div className="space-y-2 p-4 text-xs text-sub">
              <p><span className="text-mute">Etapa:</span> {STAGE_LABEL[p.stage]}</p>
              <p><span className="text-mute">Objetivo:</span> {p.objective || "—"}</p>
              <p><span className="text-mute">Tecnologias:</span> {p.technologies.join(", ") || "—"}</p>
              <p><span className="text-mute">Etapas concluídas:</span> {p.steps.filter((s) => s.done).length}/{p.steps.length}</p>
              <p>
                <span className="text-mute">Resultados registrados no README:</span>{" "}
                {p.readme.resultados.trim() ? (p.readme.resultadosVerificados ? "sim (verificados)" : "preliminares") : "nenhum"}
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
