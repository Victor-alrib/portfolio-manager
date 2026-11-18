import { useRef, useState } from "react";
import { BarChart3, BookText, ClipboardCopy, Download, FileJson, FileText, Upload } from "lucide-react";
import { selectData, useStore } from "../../store/store";
import { Button, Card, MarkdownView, Modal, PageHeader, Select, confirmDialog, toast } from "../../components/ui";
import { portfolioMarkdown, progressReportMarkdown, readmeMarkdown } from "../../lib/markdown";
import { portfolioPdf, progressPdf } from "../../lib/pdf";
import { copyWithToast, saveWithToast } from "../../lib/actions";
import { migrate } from "../../store/migrations";
import { slugify, todayIso } from "../../lib/utils";

export function ExportPage() {
  const state = useStore();
  const data = selectData(state);
  const [pid, setPid] = useState(data.projects[0]?.id ?? "");
  const [preview, setPreview] = useState<{ title: string; md: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const p = data.projects.find((x) => x.id === pid);
  const stamp = todayIso();

  const importJson = async (f: File) => {
    try {
      const parsed = JSON.parse(await f.text());
      if (!parsed || !Array.isArray(parsed.projects)) throw new Error("formato");
      const next = migrate(parsed);
      const ok = await confirmDialog({
        title: "Importar backup?",
        body: `O arquivo tem ${next.projects.length} projeto(s), ${next.skills.length} competência(s), ${next.jobs.length} vaga(s) e ${next.posts.length} rascunho(s). Os dados atuais serão substituídos.`,
        confirmLabel: "Substituir dados",
        danger: true,
      });
      if (!ok) return;
      state.replaceAll(next);
      toast("Backup importado");
    } catch {
      toast("Arquivo inválido: use um JSON exportado pelo Portfolio Manager", "erro");
    }
  };

  return (
    <div>
      <PageHeader icon={<Download size={18} />} title="Exportação" subtitle="Leve seus dados para o GitHub, para recrutadores ou para um backup" />

      <div className="grid gap-4 md:grid-cols-2">
        <ExportCard icon={<BookText size={16} />} title="README em Markdown" desc="O README de um projeto, pronto para o repositório.">
          <Select value={pid} onChange={(e) => setPid(e.target.value)} aria-label="Projeto">
            {data.projects.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
          </Select>
          <div className="flex flex-wrap gap-2">
            <Button variant="primary" icon={<Download size={13} />} disabled={!p} onClick={() => p && saveWithToast(`README-${slugify(p.name)}.md`, readmeMarkdown(p))}>Baixar README.md</Button>
            <Button icon={<ClipboardCopy size={13} />} disabled={!p} onClick={() => p && copyWithToast(readmeMarkdown(p), "README copiado")}>Copiar</Button>
            <Button variant="ghost" disabled={!p} onClick={() => p && setPreview({ title: `README — ${p.name}`, md: readmeMarkdown(p) })}>Pré-visualizar</Button>
          </div>
        </ExportCard>

        <ExportCard icon={<FileText size={16} />} title="Resumo dos projetos em PDF" desc="Portfólio agrupado por status: publicados, concluídos, em andamento e ideias. Resultados só aparecem se verificados.">
          <div className="flex flex-wrap gap-2">
            <Button variant="primary" icon={<Download size={13} />} onClick={() => saveWithToast(`resumo-projetos-${stamp}.pdf`, portfolioPdf(data))}>Baixar PDF</Button>
            <Button icon={<Download size={13} />} onClick={() => saveWithToast(`portfolio-${stamp}.md`, portfolioMarkdown(data))}>Versão .md</Button>
            <Button variant="ghost" onClick={() => setPreview({ title: "Resumo dos projetos", md: portfolioMarkdown(data) })}>Pré-visualizar</Button>
          </div>
        </ExportCard>

        <ExportCard icon={<BarChart3 size={16} />} title="Relatório de progresso" desc="Indicadores, progresso por projeto, próximas entregas e competências (atual × meta).">
          <div className="flex flex-wrap gap-2">
            <Button variant="primary" icon={<Download size={13} />} onClick={() => saveWithToast(`relatorio-progresso-${stamp}.pdf`, progressPdf(data))}>Baixar PDF</Button>
            <Button icon={<Download size={13} />} onClick={() => saveWithToast(`relatorio-progresso-${stamp}.md`, progressReportMarkdown(data))}>Versão .md</Button>
            <Button icon={<ClipboardCopy size={13} />} onClick={() => copyWithToast(progressReportMarkdown(data), "Relatório copiado")}>Copiar</Button>
            <Button variant="ghost" onClick={() => setPreview({ title: "Relatório de progresso", md: progressReportMarkdown(data) })}>Pré-visualizar</Button>
          </div>
        </ExportCard>

        <ExportCard icon={<FileJson size={16} />} title="Dados gerais em JSON" desc="Backup completo (projetos, competências, vagas, rascunhos e configurações). Pode ser reimportado.">
          <div className="flex flex-wrap gap-2">
            <Button variant="primary" icon={<Download size={13} />} onClick={() => saveWithToast(`portfolio-manager-backup-${stamp}.json`, JSON.stringify(data, null, 2))}>Baixar JSON</Button>
            <Button icon={<ClipboardCopy size={13} />} onClick={() => copyWithToast(JSON.stringify(data, null, 2), "JSON copiado")}>Copiar</Button>
            <Button variant="ghost" icon={<Upload size={13} />} onClick={() => fileRef.current?.click()}>Importar backup</Button>
            <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) importJson(f); e.target.value = ""; }} />
          </div>
        </ExportCard>
      </div>

      <Modal open={!!preview} onClose={() => setPreview(null)} title={preview?.title} wide footer={preview && <Button icon={<ClipboardCopy size={13} />} onClick={() => copyWithToast(preview.md)}>Copiar Markdown</Button>}>
        {preview && <MarkdownView md={preview.md} />}
      </Modal>
    </div>
  );
}

const ExportCard = ({ icon, title, desc, children }: { icon: JSX.Element; title: string; desc: string; children: React.ReactNode }) => (
  <Card>
    <div className="space-y-3 p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-accent/10 text-accent">{icon}</div>
        <div>
          <h3 className="text-sm font-semibold text-ink">{title}</h3>
          <p className="text-xs text-mute">{desc}</p>
        </div>
      </div>
      {children}
    </div>
  </Card>
);
