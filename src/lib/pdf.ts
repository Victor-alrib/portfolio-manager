import { jsPDF } from "jspdf";
import type { AppData, Project } from "../types";
import { LEVELS, STAGE_LABEL } from "./constants";
import { isActive, isCompleted, isPublished, portfolioStats, projectProgress, readmeCompleteness, upcomingDeadlines } from "./metrics";
import { fmtDate, pct } from "./utils";

const ACCENT: [number, number, number] = [98, 80, 214];
const INK: [number, number, number] = [20, 20, 22];
const SUB: [number, number, number] = [95, 94, 90];
const LINE: [number, number, number] = [225, 225, 220];

/** Pequeno "layout engine" sobre o jsPDF: fluxo vertical com quebra de página. */
class Doc {
  pdf = new jsPDF({ unit: "pt", format: "a4" });
  y = 56;
  readonly m = 48;
  readonly w = this.pdf.internal.pageSize.getWidth() - 96;
  readonly h = this.pdf.internal.pageSize.getHeight();

  ensure(space: number) {
    if (this.y + space > this.h - 56) {
      this.pdf.addPage();
      this.y = 56;
    }
  }
  text(t: string, size = 10, color = SUB, style: "normal" | "bold" = "normal", indent = 0) {
    this.pdf.setFont("helvetica", style).setFontSize(size).setTextColor(...color);
    const lines = this.pdf.splitTextToSize(clean(t), this.w - indent) as string[];
    for (const l of lines) {
      this.ensure(size * 1.4);
      this.pdf.text(l, this.m + indent, this.y);
      this.y += size * 1.4;
    }
  }
  h1(t: string) {
    this.ensure(40);
    this.text(t, 20, INK, "bold");
    this.y += 4;
  }
  h2(t: string) {
    this.ensure(48);
    this.y += 10;
    this.text(t, 13, INK, "bold");
    this.pdf.setDrawColor(...LINE).line(this.m, this.y - 6, this.m + this.w, this.y - 6);
    this.y += 6;
  }
  h3(t: string) {
    this.ensure(36);
    this.y += 6;
    this.text(t, 11, INK, "bold");
  }
  gap(n = 6) {
    this.y += n;
  }
  bullet(t: string) {
    this.pdf.setFillColor(...ACCENT).circle(this.m + 4, this.y - 3, 1.6, "F");
    this.text(t, 10, SUB, "normal", 14);
  }
  kv(pairs: [string, string][]) {
    const colW = this.w / pairs.length;
    this.ensure(40);
    pairs.forEach(([k, v], i) => {
      const x = this.m + i * colW;
      this.pdf.setFont("helvetica", "normal").setFontSize(8).setTextColor(...SUB).text(clean(k).toUpperCase(), x, this.y);
      this.pdf.setFont("helvetica", "bold").setFontSize(16).setTextColor(...INK).text(clean(v), x, this.y + 20);
    });
    this.y += 36;
  }
  bar(label: string, value: number) {
    this.ensure(22);
    this.pdf.setFont("helvetica", "normal").setFontSize(9).setTextColor(...SUB);
    const maxW = this.w * 0.6;
    let t = clean(label);
    if (this.pdf.getTextWidth(t) > maxW) {
      while (t.length > 4 && this.pdf.getTextWidth(t + "...") > maxW) t = t.slice(0, -1);
      t += "...";
    }
    this.pdf.text(t, this.m, this.y);
    const bx = this.m + this.w * 0.63;
    const bw = this.w * 0.28;
    this.pdf.setFillColor(...LINE).roundedRect(bx, this.y - 7, bw, 6, 3, 3, "F");
    if (value > 0) this.pdf.setFillColor(...ACCENT).roundedRect(bx, this.y - 7, Math.max(6, bw * value), 6, 3, 3, "F");
    this.pdf.setTextColor(...INK).text(pct(value), this.m + this.w, this.y, { align: "right" });
    this.y += 16;
  }
  table(head: string[], rows: string[][], widths: number[]) {
    const draw = (cells: string[], bold: boolean) => {
      const wrapped = cells.map((c, i) => this.pdf.setFontSize(9).splitTextToSize(clean(c), widths[i] * this.w - 6) as string[]);
      const hgt = Math.max(...wrapped.map((w) => w.length)) * 12 + 6;
      this.ensure(hgt);
      let x = this.m;
      wrapped.forEach((lines, i) => {
        this.pdf.setFont("helvetica", bold ? "bold" : "normal").setFontSize(9).setTextColor(...(bold ? INK : SUB));
        lines.forEach((l, j) => this.pdf.text(l, x + 3, this.y + 9 + j * 12));
        x += widths[i] * this.w;
      });
      this.y += hgt;
      this.pdf.setDrawColor(...LINE).line(this.m, this.y - 2, this.m + this.w, this.y - 2);
    };
    draw(head, true);
    rows.forEach((r) => draw(r, false));
    this.y += 6;
  }
  footer(title: string) {
    const n = this.pdf.getNumberOfPages();
    for (let i = 1; i <= n; i++) {
      this.pdf.setPage(i);
      this.pdf.setFont("helvetica", "normal").setFontSize(8).setTextColor(...SUB);
      this.pdf.text(clean(title), this.m, this.h - 28);
      this.pdf.text(`${i} / ${n}`, this.m + this.w, this.h - 28, { align: "right" });
    }
  }
  out(): ArrayBuffer {
    return this.pdf.output("arraybuffer");
  }
}

/** Fontes padrão do PDF não têm emoji / alguns símbolos. */
const clean = (s: string) =>
  s
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/gu, "")
    .replace(/[–—]/g, "-")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[•·]/g, "-")
    .replace(/\*\*|__|`/g, "");

function projectBlock(doc: Doc, p: Project, d: AppData) {
  doc.h3(p.name);
  doc.text(`${STAGE_LABEL[p.stage]}  |  Progresso ${pct(projectProgress(p))}  |  Prioridade ${p.priority}${p.area ? `  |  ${p.area}` : ""}`, 9, ACCENT);
  if (p.description) doc.text(p.description);
  if (p.objective) doc.text(`Objetivo: ${p.objective}`);
  if (p.technologies.length) doc.text(`Tecnologias: ${p.technologies.join(", ")}`);
  const skills = d.skills.filter((s) => s.links.some((l) => l.projectId === p.id));
  if (skills.length) doc.text(`Competências: ${skills.map((s) => s.name).join(", ")}`);
  if (p.readme.resultados.trim() && p.readme.resultadosVerificados) doc.text(`Resultados (verificados pelo autor): ${p.readme.resultados.trim()}`);
  if (p.links.length) doc.text(`Links: ${p.links.map((l) => l.url).join("  ")}`, 9);
  doc.gap(6);
}

export function portfolioPdf(d: AppData): ArrayBuffer {
  const doc = new Doc();
  const st = portfolioStats(d);
  doc.h1(`Resumo de projetos${d.settings.ownerName ? ` - ${d.settings.ownerName}` : ""}`);
  if (d.settings.headline) doc.text(d.settings.headline, 11);
  doc.text(`Gerado em ${new Date().toLocaleDateString("pt-BR", { dateStyle: "long" })}`, 9);
  doc.gap(10);
  doc.kv([
    ["Projetos", String(st.total)],
    ["Ativos", String(st.active)],
    ["Concluídos", String(st.completed)],
    ["Publicados", String(st.published)],
  ]);
  const groups: [string, Project[]][] = [
    ["Publicados", d.projects.filter(isPublished)],
    ["Concluídos", d.projects.filter((p) => isCompleted(p) && !isPublished(p))],
    ["Em andamento", d.projects.filter((p) => isActive(p) && !isCompleted(p))],
    ["Ideias", d.projects.filter((p) => p.stage === "ideias")],
  ];
  for (const [t, ps] of groups) {
    if (!ps.length) continue;
    doc.h2(`${t} (${ps.length})`);
    ps.forEach((p) => projectBlock(doc, p, d));
  }
  doc.footer("Portfolio Manager - Resumo de projetos");
  return doc.out();
}

export function progressPdf(d: AppData): ArrayBuffer {
  const doc = new Doc();
  const st = portfolioStats(d);
  doc.h1("Relatório de progresso");
  doc.text(`${new Date().toLocaleDateString("pt-BR", { dateStyle: "long" })}${d.settings.ownerName ? ` - ${d.settings.ownerName}` : ""}`, 9);
  doc.gap(10);
  doc.kv([
    ["Progresso geral", pct(st.progress)],
    ["Etapas", `${st.stepsDone}/${st.stepsTotal}`],
    ["Ativos", String(st.active)],
    ["Publicados", String(st.published)],
  ]);
  doc.h2("Progresso por projeto");
  d.projects.forEach((p) => doc.bar(`${p.name} (${STAGE_LABEL[p.stage]})`, projectProgress(p)));
  doc.h2("Projetos");
  doc.table(
    ["Projeto", "Etapa", "Progresso", "README"],
    d.projects.map((p) => [p.name, STAGE_LABEL[p.stage], pct(projectProgress(p)), pct(readmeCompleteness(p))]),
    [0.52, 0.2, 0.14, 0.14],
  );
  doc.h2("Próximas entregas");
  const dl = upcomingDeadlines(d.projects).slice(0, 15);
  if (dl.length) dl.forEach((x) => doc.bullet(`${fmtDate(x.date)} - ${x.label} (${x.projectName})`));
  else doc.text("Nenhuma data cadastrada.");
  doc.h2("Competências");
  doc.table(
    ["Competência", "Nível", "Meta", "Aplicada / planejada"],
    d.skills.map((s) => [
      s.name,
      LEVELS[s.level],
      LEVELS[s.target],
      `${s.links.filter((l) => l.status === "aplicada").length} / ${s.links.filter((l) => l.status === "planejada").length}`,
    ]),
    [0.34, 0.22, 0.22, 0.22],
  );
  doc.gap(8);
  doc.text("Indicadores calculados a partir das etapas e status registrados no Portfolio Manager.", 8);
  doc.footer("Portfolio Manager - Relatório de progresso");
  return doc.out();
}
