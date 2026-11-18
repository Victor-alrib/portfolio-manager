import { Moon, RotateCcw, Settings as Cog, Sun } from "lucide-react";
import { useStore } from "../../store/store";
import { useSync } from "../../store/sync";
import { Button, Card, Field, InlineText, PageHeader, Select, TagInput, confirmDialog, toast } from "../../components/ui";
import { fmtDateTime } from "../../lib/utils";

export function SettingsPage() {
  const settings = useStore((s) => s.settings);
  const update = useStore((s) => s.updateSettings);
  const reset = useStore((s) => s.resetToSeed);
  const sync = useSync();
  const c = settings.career;
  const setCareer = (patch: Partial<typeof c>) => update({ career: { ...c, ...patch } });

  return (
    <div>
      <PageHeader icon={<Cog size={18} />} title="Configurações" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Perfil">
          <div className="space-y-3 p-4">
            <Field label="Nome"><InlineText value={settings.ownerName} onCommit={(ownerName) => update({ ownerName })} className="input" /></Field>
            <Field label="Headline"><InlineText value={settings.headline} onCommit={(headline) => update({ headline })} className="input" /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Usuário do GitHub"><InlineText value={settings.githubUser} onCommit={(githubUser) => update({ githubUser })} className="input" placeholder="seu-usuario" /></Field>
              <Field label="URL do LinkedIn"><InlineText value={settings.linkedinUrl} onCommit={(linkedinUrl) => update({ linkedinUrl })} className="input" placeholder="https://linkedin.com/in/…" /></Field>
            </div>
          </div>
        </Card>

        <Card title="Aparência">
          <div className="flex gap-2 p-4">
            <Button variant={settings.theme === "dark" ? "primary" : "secondary"} icon={<Moon size={14} />} onClick={() => update({ theme: "dark" })}>Escuro</Button>
            <Button variant={settings.theme === "light" ? "primary" : "secondary"} icon={<Sun size={14} />} onClick={() => update({ theme: "light" })}>Claro</Button>
          </div>
          <div className="border-t border-line p-4 text-xs text-sub">
            <p className="label">Armazenamento</p>
            <p>{sync.message ?? "—"}</p>
            {sync.lastSaved && <p className="text-mute">Último salvamento: {fmtDateTime(sync.lastSaved)}</p>}
            <p className="mt-2 text-mute">Dica: exporte um backup JSON periodicamente (página Exportar).</p>
          </div>
        </Card>

        <Card title="Plano de carreira" className="lg:col-span-2">
          <div className="grid gap-4 p-4 lg:grid-cols-2">
            <div className="space-y-3">
              <div className="grid grid-cols-[8rem_1fr] gap-3">
                <Field label="Fase atual">
                  <Select value={c.currentPhase} onChange={(e) => setCareer({ currentPhase: Number(e.target.value) as 1 | 2 })}>
                    <option value={1}>Fase 1</option>
                    <option value={2}>Fase 2</option>
                  </Select>
                </Field>
                <Field label="Título da fase"><InlineText value={c.phaseTitle} onCommit={(phaseTitle) => setCareer({ phaseTitle })} className="input" /></Field>
              </div>
              <Field label="Foco"><InlineText multiline value={c.focus} onCommit={(focus) => setCareer({ focus })} /></Field>
              <Field label="Posições-alvo"><TagInput value={c.targetRoles} onChange={(targetRoles) => setCareer({ targetRoles })} /></Field>
            </div>
            <div className="space-y-3">
              <Field label="Regras do plano (uma por linha)">
                <InlineText multiline value={c.rules.join("\n")} onCommit={(v) => setCareer({ rules: v.split("\n").map((x) => x.trim()).filter(Boolean) })} />
              </Field>
              {c.phase2Options.map((o, i) => (
                <Field key={i} label={o.title}>
                  <InlineText multiline value={o.note} onCommit={(note) => setCareer({ phase2Options: c.phase2Options.map((x, j) => (j === i ? { ...x, note } : x)) })} />
                </Field>
              ))}
            </div>
          </div>
        </Card>

        <Card title="Dados" className="lg:col-span-2">
          <div className="flex flex-wrap items-center gap-3 p-4">
            <p className="flex-1 text-xs text-sub">Restaurar os dados iniciais (4 projetos do roadmap e competências do plano de estudos). Todo o resto será apagado.</p>
            <Button
              variant="danger"
              icon={<RotateCcw size={14} />}
              onClick={async () => {
                if (await confirmDialog({ title: "Restaurar dados iniciais?", body: "Todos os projetos, vagas, rascunhos e alterações serão substituídos pelos dados iniciais. Exporte um backup antes, se necessário.", confirmLabel: "Restaurar", danger: true })) {
                  reset();
                  toast("Dados iniciais restaurados");
                }
              }}
            >
              Restaurar dados iniciais
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
