/**
 * Geradores de texto (README, relatórios, posts, fichas de entrevista).
 * REGRA: nada aqui inventa métricas, resultados ou experiências. Campos
 * vazios viram avisos explícitos ou marcadores [entre colchetes] para o autor.
 */
import type { AppData, Post, Project, Skill } from "../types";
import { LEVELS, README_SECTIONS, STAGE_LABEL } from "./constants";
import { isActive, isCompleted, isPublished, portfolioStats, projectProgress, readmeCompleteness, upcomingDeadlines } from "./metrics";
import { fmtDate, pct } from "./utils";

const PLACEHOLDER = (title: string) => `_[A preencher: ${title.toLowerCase()}]_`;

export function readmeMarkdown(p: Project, opts: { includePlaceholders?: boolean } = {}): string {
  const r = p.readme;
  const placeholders = opts.includePlaceholders ?? true;
  const out: string[] = [];
  out.push(`# ${p.name}`);
  if (p.description.trim()) out.push("", p.description.trim());
  out.push("", `> **Status:** ${STAGE_LABEL[p.stage]}${p.stage !== "publicado" ? " — projeto em andamento" : ""}`);

  for (const s of README_SECTIONS) {
    let body = r[s.key].trim();
    if (s.key === "tecnologias" && !body && p.technologies.length) body = p.technologies.map((t) => `- ${t}`).join("\n");
    if (s.key === "resultados") {
      if (!body) {
        body =
          "> ⚠️ Ainda não há resultados medidos para este projeto. Esta seção será atualizada quando os experimentos forem concluídos e validados.";
      } else if (!r.resultadosVerificados) {
        body = `${body}\n\n> ℹ️ Resultados preliminares — ainda em verificação pelo autor.`;
      }
    }
    if (!body && !placeholders) continue;
    out.push("", `## ${s.title}`, "", body || PLACEHOLDER(s.title));
  }

  if (p.links.length) {
    out.push("", "## Links", "");
    p.links.forEach((l) => out.push(`- [${l.label || l.url}](${l.url})`));
  }
  return out.join("\n") + "\n";
}

export function projectSummaryMarkdown(p: Project, skills: Skill[]): string {
  const linked = skills.filter((s) => s.links.some((l) => l.projectId === p.id));
  const lines = [
    `## ${p.name}`,
    "",
    `**Etapa:** ${STAGE_LABEL[p.stage]} · **Progresso:** ${pct(projectProgress(p))} · **Prioridade:** ${p.priority}`,
  ];
  if (p.area) lines.push(`**Área:** ${p.area}`);
  if (p.description) lines.push("", p.description);
  if (p.objective) lines.push("", `**Objetivo:** ${p.objective}`);
  if (p.technologies.length) lines.push("", `**Tecnologias:** ${p.technologies.join(", ")}`);
  if (linked.length)
    lines.push("", `**Competências:** ${linked.map((s) => `${s.name} (${s.links.find((l) => l.projectId === p.id)!.status})`).join(", ")}`);
  if (p.steps.length) {
    lines.push("", "**Etapas:**");
    p.steps.forEach((s) => lines.push(`- [${s.done ? "x" : " "}] ${s.title}${s.dueDate ? ` — ${fmtDate(s.dueDate)}` : ""}`));
  }
  return lines.join("\n");
}

export function progressReportMarkdown(d: AppData): string {
  const st = portfolioStats(d);
  const today = new Date().toLocaleDateString("pt-BR", { dateStyle: "long" });
  const dl = upcomingDeadlines(d.projects).slice(0, 15);
  const out = [
    `# Relatório de progresso do portfólio`,
    "",
    `Gerado em ${today}${d.settings.ownerName ? ` · ${d.settings.ownerName}` : ""}`,
    "",
    "## Visão geral",
    "",
    `| Indicador | Valor |`,
    `|---|---|`,
    `| Projetos cadastrados | ${st.total} |`,
    `| Ideias | ${st.ideas} |`,
    `| Ativos | ${st.active} |`,
    `| Concluídos | ${st.completed} |`,
    `| Publicados | ${st.published} |`,
    `| Etapas concluídas | ${st.stepsDone} de ${st.stepsTotal} |`,
    `| Progresso geral | ${pct(st.progress)} |`,
    `| READMEs completos | ${st.readmeReady} |`,
    "",
    "## Projetos",
    "",
    `| Projeto | Etapa | Progresso | README |`,
    `|---|---|---|---|`,
    ...d.projects.map((p) => `| ${p.name} | ${STAGE_LABEL[p.stage]} | ${pct(projectProgress(p))} | ${pct(readmeCompleteness(p))} |`),
    "",
    "## Próximas entregas",
    "",
    ...(dl.length ? dl.map((x) => `- **${fmtDate(x.date)}** — ${x.label} _(${x.projectName})_`) : ["_Nenhuma data cadastrada._"]),
    "",
    "## Competências",
    "",
    `| Competência | Nível atual | Meta | Projetos (aplicada / planejada) |`,
    `|---|---|---|---|`,
    ...d.skills.map(
      (s) =>
        `| ${s.name} | ${LEVELS[s.level]} | ${LEVELS[s.target]} | ${s.links.filter((l) => l.status === "aplicada").length} / ${s.links.filter((l) => l.status === "planejada").length} |`,
    ),
  ];
  if (d.jobs.length) {
    out.push("", "## Vagas acompanhadas", "", ...d.jobs.map((j) => `- ${j.title}${j.company ? ` — ${j.company}` : ""} (${j.stage})`));
  }
  out.push("", "---", "", "_Indicadores calculados a partir das etapas e status registrados no Portfolio Manager._");
  return out.join("\n") + "\n";
}

export function portfolioMarkdown(d: AppData) {
  const groups: [string, Project[]][] = [
    ["Publicados", d.projects.filter(isPublished)],
    ["Concluídos (não publicados)", d.projects.filter((p) => isCompleted(p) && !isPublished(p))],
    ["Em andamento", d.projects.filter((p) => isActive(p) && !isCompleted(p))],
    ["Ideias", d.projects.filter((p) => p.stage === "ideias")],
  ];
  const out = [`# Portfólio de projetos${d.settings.ownerName ? ` — ${d.settings.ownerName}` : ""}`, ""];
  if (d.settings.headline) out.push(d.settings.headline, "");
  for (const [title, ps] of groups) {
    if (!ps.length) continue;
    out.push(`# ${title}`, "");
    ps.forEach((p) => out.push(projectSummaryMarkdown(p, d.skills), ""));
  }
  return out.join("\n");
}

export function interviewMarkdown(p: Project): string {
  const i = p.interview;
  const f = (label: string, v: string) => `### ${label}\n\n${v.trim() || PLACEHOLDER(label)}\n`;
  return [
    `# Ficha de entrevista — ${p.name}`,
    "",
    `> Etapa atual: ${STAGE_LABEL[p.stage]}. Fale sobre o projeto no estágio em que ele realmente está.`,
    "",
    f("Pitch de 60 segundos", i.pitch),
    "## STAR",
    "",
    f("Situação / Contexto", i.contexto),
    f("Tarefa / Desafio", i.desafio),
    f("Ação", i.acao),
    f("Resultado", i.resultado),
    f("Decisões técnicas e trade-offs", i.decisoes),
    f("Perguntas prováveis e respostas", i.perguntas),
  ].join("\n");
}

/** Templates de posts — resultados só entram se verificados pelo autor. */
export function linkedinTemplate(kind: Post["kind"], p?: Project): string {
  const name = p?.name ?? "[nome do projeto]";
  const tech = p?.technologies.length ? p.technologies.join(", ") : "[tecnologias]";
  const problem = p?.readme.problema.trim() || p?.description.trim() || "[qual problema o projeto resolve]";
  const learned = p?.readme.aprendizados.trim() || "[o que você aprendeu de verdade — um ponto concreto]";
  const results =
    p && p.readme.resultados.trim() && p.readme.resultadosVerificados
      ? p.readme.resultados.trim()
      : "[Descreva aqui um resultado real e medido — ou remova esta linha se ainda não houver]";
  const link = p?.links[0]?.url ?? "[link do repositório]";
  const hashtags = p ? p.technologies.slice(0, 4).map((t) => "#" + t.replace(/[^\p{L}\p{N}]/gu, "")).join(" ") : "#[tags]";

  switch (kind) {
    case "lancamento":
      return `🚀 Publiquei um novo projeto: ${name}\n\nO problema: ${problem}\n\nComo abordei:\n• [abordagem em uma linha]\n• Stack: ${tech}\n\nResultado: ${results}\n\nO que aprendi: ${learned}\n\nCódigo e documentação: ${link}\n\nFeedbacks são muito bem-vindos!\n\n${hashtags}`;
    case "aprendizado":
      return `Uma coisa que aprendi construindo ${name}:\n\n${learned}\n\nContexto: ${problem}\n\nComo isso muda minha forma de trabalhar: [sua reflexão]\n\n${hashtags}`;
    case "progresso":
      return `Atualização do projeto ${name} (${p ? STAGE_LABEL[p.stage].toLowerCase() : "[etapa]"}):\n\n✅ Concluído: ${
        p?.steps.filter((s) => s.done).map((s) => s.title).join("; ") || "[o que já foi feito]"
      }\n🔜 Próximo: ${p?.steps.find((s) => !s.done)?.title ?? "[próximo passo]"}\n\nMaior desafio até aqui: [descreva]\n\n${hashtags}`;
    default:
      return "";
  }
}
