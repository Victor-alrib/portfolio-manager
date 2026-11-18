/**
 * Camada de persistência:
 *  1. localStorage — sempre, como cache imediato.
 *  2. Banco do host (quando disponível) — um documento por entidade na área
 *     privada do usuário (`data/users/<id>/…`), para que os dados durem e
 *     acompanhem o usuário entre dispositivos.
 * Escritas são agrupadas (debounce) e enviadas uma por vez, só quando mudam.
 */
import { create } from "zustand";
import type { AppData } from "../types";
import { getCloud, type CloudDb } from "../lib/platform";
import { debounce, nowIso } from "../lib/utils";
import { migrate } from "./migrations";
import { localSavedAt, saveLocal } from "./persistence";
import { selectData, useStore } from "./store";

export type SyncState = "local" | "conectando" | "sincronizando" | "sincronizado" | "erro";

export const useSync = create<{ state: SyncState; message?: string; lastSaved?: string; cloud: boolean }>(() => ({
  state: "conectando",
  cloud: false,
}));

type DocMap = Map<string, string>; // docId -> JSON serializado

function toDocs(d: AppData, savedAt: string): Map<string, Record<string, unknown>> {
  const m = new Map<string, Record<string, unknown>>();
  m.set("meta", { kind: "meta", version: d.version, settings: d.settings, savedAt });
  d.projects.forEach((p) => m.set(`project__${p.id}`, { kind: "project", item: p }));
  d.skills.forEach((s) => m.set(`skill__${s.id}`, { kind: "skill", item: s }));
  d.jobs.forEach((j) => m.set(`job__${j.id}`, { kind: "job", item: j }));
  d.posts.forEach((p) => m.set(`post__${p.id}`, { kind: "post", item: p }));
  return m;
}

/** JSON sem o carimbo de tempo (para detectar mudança real). */
const sig = (body: Record<string, unknown>) => JSON.stringify(body.kind === "meta" ? { ...body, savedAt: 0 } : body);

function fromDocs(docs: { id: string; data: Record<string, unknown> }[]): { data: AppData; savedAt: string } | null {
  const meta = docs.find((d) => d.id === "meta")?.data;
  if (!meta) return null;
  const pick = (k: string) => docs.filter((d) => d.data.kind === k).map((d) => d.data.item);
  const data = migrate({
    version: meta.version,
    settings: meta.settings,
    projects: pick("project"),
    skills: pick("skill"),
    jobs: pick("job"),
    posts: pick("post"),
  });
  return { data, savedAt: String(meta.savedAt ?? "") };
}

let started = false;

export async function startPersistence() {
  if (started) return;
  started = true;

  // 1) Cache local em toda mudança.
  const saveLocalDebounced = debounce(() => {
    const at = nowIso();
    saveLocal(selectData(useStore.getState()), at);
    if (!useSync.getState().cloud) useSync.setState({ state: "local", lastSaved: at });
  }, 400);
  useStore.subscribe(saveLocalDebounced);
  window.addEventListener("beforeunload", () => saveLocalDebounced.flush());

  // 2) Banco do host, se existir.
  const cloud = await getCloud();
  if (!cloud) {
    useSync.setState({ state: "local", cloud: false, message: "Dados salvos neste navegador." });
    return;
  }
  const col = cloud.db.collection(`data/users/${cloud.userId}`);
  const synced: DocMap = new Map();

  try {
    const snap = await col.get();
    const docs = snap.docs.map((d: { id: string; data: () => Record<string, unknown> }) => ({ id: d.id, data: d.data() ?? {} }));
    docs.forEach((d: { id: string; data: Record<string, unknown> }) => synced.set(d.id, sig(d.data)));
    const remote = fromDocs(docs);
    const localAt = localSavedAt();
    if (remote && (!localAt || remote.savedAt > localAt)) {
      useStore.getState().replaceAll(remote.data);
    }
    useSync.setState({ cloud: true, state: "sincronizado", lastSaved: remote?.savedAt, message: "Sincronizado com sua conta." });
  } catch {
    useSync.setState({ state: "local", cloud: false, message: "Não foi possível acessar o armazenamento da conta; usando o navegador." });
    return;
  }

  let running = false;
  let again = false;

  const push = async () => {
    if (running) {
      again = true;
      return;
    }
    running = true;
    useSync.setState({ state: "sincronizando" });
    try {
      const at = nowIso();
      const want = toDocs(selectData(useStore.getState()), at);
      await writeDiff(col, want, synced);
      useSync.setState({ state: "sincronizado", lastSaved: at, message: "Sincronizado com sua conta." });
    } catch (e: unknown) {
      const code = (e as { code?: string })?.code;
      useSync.setState({
        state: "erro",
        message:
          code === "quota_exceeded"
            ? "Limite de armazenamento atingido. Remova anexos grandes."
            : code === "invalid_argument"
              ? "Um item é grande demais para sincronizar (limite de 256 KB por projeto). Remova anexos embutidos."
              : "Falha ao sincronizar. Os dados continuam salvos neste navegador.",
      });
    } finally {
      running = false;
      if (again) {
        again = false;
        pushDebounced();
      }
    }
  };
  const pushDebounced = debounce(push, 1200);
  useStore.subscribe(() => pushDebounced());
  // Garante que dados locais pré-existentes subam na primeira conexão.
  pushDebounced();
}

async function writeDiff(col: ReturnType<CloudDb["collection"]>, want: Map<string, Record<string, unknown>>, synced: DocMap) {
  const changed = [...want.entries()].filter(([id, body]) => id !== "meta" && synced.get(id) !== sig(body));
  const removed = [...synced.keys()].filter((id) => !want.has(id));
  const meta = want.get("meta")!;
  const metaChanged = synced.get("meta") !== sig(meta);
  if (!changed.length && !removed.length && !metaChanged) return;
  for (const [id, body] of changed) {
    await col.doc(id).set(body);
    synced.set(id, sig(body));
  }
  for (const id of removed) {
    await col.doc(id).delete();
    synced.delete(id);
  }
  // meta por último: o carimbo só avança depois que o conteúdo foi gravado
  await col.doc("meta").set(meta);
  synced.set("meta", sig(meta));
}
