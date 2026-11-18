import { useEffect, useState } from "react";
import { AlertTriangle, ClipboardCopy, Megaphone, Plus, Trash2 } from "lucide-react";
import { useStore } from "../../store/store";
import { Badge, Button, Card, EmptyState, Field, InlineText, Modal, PageHeader, Select, Textarea, confirmDialog } from "../../components/ui";
import { POST_KINDS, POST_STATUS } from "../../lib/constants";
import { linkedinTemplate } from "../../lib/markdown";
import { findNumericClaims } from "../../lib/metrics";
import { copyWithToast } from "../../lib/actions";
import { cn, fmtDateTime } from "../../lib/utils";
import { href, navigate } from "../../router";
import type { PostKind, PostStatus } from "../../types";

const LIMIT = 3000;

export function LinkedIn({ postId }: { postId?: string }) {
  const posts = useStore((s) => s.posts);
  const projects = useStore((s) => s.projects);
  const addPost = useStore((s) => s.addPost);
  const update = useStore((s) => s.updatePost);
  const remove = useStore((s) => s.removePost);
  const [newOpen, setNewOpen] = useState(false);
  const [kind, setKind] = useState<PostKind>("lancamento");
  const [pid, setPid] = useState(projects[0]?.id ?? "");
  const sorted = [...posts].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const post = posts.find((p) => p.id === postId) ?? sorted[0];
  const [body, setBody] = useState(post?.body ?? "");
  useEffect(() => setBody(post?.body ?? ""), [post?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const create = () => {
    const proj = projects.find((p) => p.id === pid);
    const p = addPost({
      title: `${POST_KINDS.find((k) => k.id === kind)?.label}${proj ? ` — ${proj.name}` : ""}`,
      kind,
      projectId: proj?.id,
      body: linkedinTemplate(kind, proj),
    });
    setNewOpen(false);
    navigate("linkedin", p.id);
  };

  const placeholders = (body.match(/\[[^\]]+\]/g) ?? []).length;
  const claims = findNumericClaims(body);
  const linkedProject = projects.find((p) => p.id === post?.projectId);

  return (
    <div>
      <PageHeader
        icon={<Megaphone size={18} />}
        title="Rascunhos para LinkedIn"
        subtitle="Conte a história dos projetos — sem números que você não mediu"
        actions={<Button variant="primary" icon={<Plus size={14} />} onClick={() => setNewOpen(true)}>Novo rascunho</Button>}
      />

      {!post ? (
        <EmptyState icon={<Megaphone size={22} />} title="Nenhum rascunho ainda" action={<Button icon={<Plus size={14} />} onClick={() => setNewOpen(true)}>Criar rascunho</Button>}>
          Os modelos usam apenas dados do projeto; tudo que você precisa completar fica entre [colchetes].
        </EmptyState>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[16rem_1fr]">
          <div className="space-y-1">
            {sorted.map((p) => (
              <a key={p.id} href={href("linkedin", p.id)} className={cn("block rounded-md border px-3 py-2 transition", p.id === post.id ? "border-accent/50 bg-elev" : "border-transparent hover:bg-elev/60")}>
                <p className="truncate text-sm text-ink">{p.title}</p>
                <p className="text-[11px] text-mute">{POST_STATUS[p.status]} · {fmtDateTime(p.updatedAt)}</p>
              </a>
            ))}
          </div>

          <Card>
            <div className="space-y-3 p-4">
              <div className="flex flex-wrap items-end gap-3">
                <Field label="Título interno" className="min-w-[14rem] flex-1">
                  <InlineText value={post.title} onCommit={(title) => update(post.id, { title })} className="input" />
                </Field>
                <Field label="Status">
                  <Select value={post.status} onChange={(e) => update(post.id, { status: e.target.value as PostStatus })}>
                    {Object.entries(POST_STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </Select>
                </Field>
                <Field label="Projeto">
                  <Select value={post.projectId ?? ""} onChange={(e) => update(post.id, { projectId: e.target.value || undefined })}>
                    <option value="">Nenhum</option>
                    {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </Select>
                </Field>
              </div>

              <Textarea value={body} onChange={(e) => setBody(e.target.value)} onBlur={() => body !== post.body && update(post.id, { body })} className="min-h-[18rem] text-sm leading-relaxed" />

              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className={cn("tabular-nums", body.length > LIMIT ? "text-red-500" : "text-mute")}>{body.length}/{LIMIT} caracteres</span>
                {placeholders > 0 && <Badge className="border-amber-500/30 text-amber-600 dark:text-amber-400">{placeholders} trecho(s) entre [colchetes] para completar</Badge>}
                {linkedProject && <a href={href("projeto", linkedProject.id)} className="text-mute hover:text-ink">Projeto: {linkedProject.name}</a>}
                <div className="ml-auto flex gap-1.5">
                  {linkedProject && (
                    <Button size="sm" variant="ghost" onClick={() => setBody(linkedinTemplate(post.kind === "livre" ? "lancamento" : post.kind, linkedProject))}>Regenerar modelo</Button>
                  )}
                  <Button size="sm" icon={<ClipboardCopy size={13} />} onClick={() => copyWithToast(body, "Texto copiado — cole no LinkedIn")}>Copiar</Button>
                  <Button
                    size="sm"
                    variant="danger"
                    aria-label="Excluir rascunho"
                    icon={<Trash2 size={13} />}
                    onClick={async () => {
                      if (await confirmDialog({ title: "Excluir rascunho?", confirmLabel: "Excluir", danger: true })) {
                        remove(post.id);
                        navigate("linkedin");
                      }
                    }}
                  />
                </div>
              </div>

              {claims.length > 0 && !(linkedProject?.readme.resultadosVerificados) && (
                <p className="flex items-start gap-1.5 rounded-md border border-amber-500/30 bg-amber-500/5 px-2.5 py-1.5 text-[11px] text-amber-700 dark:text-amber-400">
                  <AlertTriangle size={12} className="mt-0.5 shrink-0" />
                  O texto contém possíveis métricas ({claims.join(", ")}), mas os resultados do projeto não estão marcados como verificados no README. Publique apenas números que você mediu.
                </p>
              )}
            </div>
          </Card>
        </div>
      )}

      <Modal
        open={newOpen}
        onClose={() => setNewOpen(false)}
        title="Novo rascunho"
        footer={
          <>
            <Button variant="ghost" onClick={() => setNewOpen(false)}>Cancelar</Button>
            <Button variant="primary" onClick={create}>Criar</Button>
          </>
        }
      >
        <div className="space-y-3">
          <Field label="Tipo de post">
            <Select value={kind} onChange={(e) => setKind(e.target.value as PostKind)}>
              {POST_KINDS.map((k) => <option key={k.id} value={k.id}>{k.label}</option>)}
            </Select>
          </Field>
          <Field label="Projeto" hint="O modelo usa descrição, tecnologias, etapas e — somente se verificados — os resultados do README.">
            <Select value={pid} onChange={(e) => setPid(e.target.value)}>
              <option value="">Nenhum</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </Select>
          </Field>
        </div>
      </Modal>
    </div>
  );
}
