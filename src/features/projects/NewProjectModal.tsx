import { useEffect, useState } from "react";
import { Button, Field, Input, Modal, Select, TagInput, Textarea, toast } from "../../components/ui";
import { STAGES } from "../../lib/constants";
import { techUsage } from "../../lib/metrics";
import { navigate } from "../../router";
import { useStore } from "../../store/store";
import type { Priority, Stage } from "../../types";

export function NewProjectModal({ open, onClose, stage }: { open: boolean; onClose: () => void; stage?: Stage }) {
  const addProject = useStore((s) => s.addProject);
  const projects = useStore((s) => s.projects);
  const [f, setF] = useState({ name: "", description: "", objective: "", area: "", stage: (stage ?? "ideias") as Stage, priority: "media" as Priority, technologies: [] as string[] });

  useEffect(() => {
    if (open) setF({ name: "", description: "", objective: "", area: "", stage: stage ?? "ideias", priority: "media", technologies: [] });
  }, [open, stage]);

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!f.name.trim()) return;
    const p = addProject({ ...f, name: f.name.trim() });
    onClose();
    toast("Projeto criado");
    navigate("projeto", p.id);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Novo projeto"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" onClick={() => submit()} disabled={!f.name.trim()}>Criar projeto</Button>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-3">
        <Field label="Nome *">
          <Input autoFocus value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Ex.: Previsão de demanda de energia" />
        </Field>
        <Field label="Descrição">
          <Textarea value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} placeholder="O que é o projeto, em 1–2 frases" />
        </Field>
        <Field label="Objetivo">
          <Textarea value={f.objective} onChange={(e) => setF({ ...f, objective: e.target.value })} placeholder="O que ele demonstra para sua carreira?" />
        </Field>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Etapa">
            <Select value={f.stage} onChange={(e) => setF({ ...f, stage: e.target.value as Stage })}>
              {STAGES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </Select>
          </Field>
          <Field label="Prioridade">
            <Select value={f.priority} onChange={(e) => setF({ ...f, priority: e.target.value as Priority })}>
              <option value="alta">Alta</option>
              <option value="media">Média</option>
              <option value="baixa">Baixa</option>
            </Select>
          </Field>
          <Field label="Área">
            <Input value={f.area} onChange={(e) => setF({ ...f, area: e.target.value })} placeholder="Ex.: Energia" />
          </Field>
        </div>
        <Field label="Tecnologias" hint="Enter ou vírgula para adicionar">
          <TagInput value={f.technologies} onChange={(technologies) => setF({ ...f, technologies })} suggestions={techUsage(projects).map((t) => t.name)} />
        </Field>
        <button type="submit" hidden />
      </form>
    </Modal>
  );
}
