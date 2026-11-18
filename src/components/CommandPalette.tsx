import { useEffect, useMemo, useRef, useState } from "react";
import { CornerDownLeft, FileText, FolderKanban, Search } from "lucide-react";
import { navigate, type RouteName } from "../router";
import { useStore } from "../store/store";
import { STAGE_LABEL } from "../lib/constants";
import { cn } from "../lib/utils";

interface Cmd { id: string; label: string; hint?: string; icon: JSX.Element; run: () => void }

const PAGES: [RouteName, string][] = [
  ["dashboard", "Dashboard"],
  ["projetos", "Projetos"],
  ["kanban", "Kanban"],
  ["readme", "Gerador de README"],
  ["competencias", "Competências"],
  ["vagas", "Vagas"],
  ["entrevistas", "Preparação para entrevistas"],
  ["linkedin", "Rascunhos de LinkedIn"],
  ["exportar", "Exportar dados"],
  ["configuracoes", "Configurações"],
];

export function CommandPalette({ open, onClose, onNew }: { open: boolean; onClose: () => void; onNew: () => void }) {
  const projects = useStore((s) => s.projects);
  const [q, setQ] = useState("");
  const [i, setI] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQ("");
      setI(0);
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [open]);

  const cmds = useMemo<Cmd[]>(() => {
    const all: Cmd[] = [
      { id: "new", label: "Criar novo projeto", icon: <FolderKanban size={14} />, run: onNew },
      ...projects.map((p) => ({ id: p.id, label: p.name, hint: STAGE_LABEL[p.stage], icon: <FolderKanban size={14} />, run: () => navigate("projeto", p.id) })),
      ...PAGES.map(([n, l]) => ({ id: "go-" + n, label: `Ir para ${l}`, icon: <FileText size={14} />, run: () => navigate(n) })),
    ];
    const t = q.trim().toLowerCase();
    return t ? all.filter((c) => c.label.toLowerCase().includes(t) || c.hint?.toLowerCase().includes(t)) : all;
  }, [q, projects, onNew]);

  if (!open) return null;
  const run = (c?: Cmd) => {
    if (!c) return;
    onClose();
    c.run();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 pt-[14vh] backdrop-blur-sm" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-xl overflow-hidden rounded-xl border border-line bg-panel shadow-pop" role="dialog" aria-label="Busca">
        <div className="flex items-center gap-2 border-b border-line px-4">
          <Search size={15} className="text-mute" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => (setQ(e.target.value), setI(0))}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") (e.preventDefault(), setI((x) => Math.min(x + 1, cmds.length - 1)));
              else if (e.key === "ArrowUp") (e.preventDefault(), setI((x) => Math.max(x - 1, 0)));
              else if (e.key === "Enter") run(cmds[i]);
              else if (e.key === "Escape") onClose();
            }}
            placeholder="Buscar projetos, páginas ou ações…"
            className="h-12 flex-1 bg-transparent text-sm outline-none placeholder:text-mute"
          />
        </div>
        <div className="max-h-80 overflow-y-auto p-1.5">
          {cmds.length === 0 && <p className="px-3 py-6 text-center text-sm text-mute">Nada encontrado.</p>}
          {cmds.slice(0, 40).map((c, idx) => (
            <button
              key={c.id}
              onMouseEnter={() => setI(idx)}
              onClick={() => run(c)}
              className={cn("flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm", idx === i ? "bg-elev text-ink" : "text-sub")}
            >
              <span className="text-mute">{c.icon}</span>
              <span className="flex-1 truncate">{c.label}</span>
              {c.hint && <span className="text-xs text-mute">{c.hint}</span>}
              {idx === i && <CornerDownLeft size={12} className="text-mute" />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
