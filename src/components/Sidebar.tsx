import { BarChart3, BookText, Briefcase, Cloud, CloudOff, Columns3, Download, FolderKanban, GraduationCap, LayoutDashboard, Megaphone, MessagesSquare, Moon, Search, Settings, Sun, Plus, RefreshCw, AlertTriangle } from "lucide-react";
import type { ReactNode } from "react";
import { href, type RouteName, useRoute } from "../router";
import { useStore } from "../store/store";
import { useSync } from "../store/sync";
import { cn, fmtDateTime } from "../lib/utils";
import { STAGE_SLOT, SERIES } from "../lib/constants";
import { useTheme } from "./theme";

const NAV: { group: string; items: { name: RouteName; label: string; icon: ReactNode }[] }[] = [
  {
    group: "Portfólio",
    items: [
      { name: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={15} /> },
      { name: "projetos", label: "Projetos", icon: <FolderKanban size={15} /> },
      { name: "kanban", label: "Kanban", icon: <Columns3 size={15} /> },
      { name: "readme", label: "Documentação", icon: <BookText size={15} /> },
      { name: "competencias", label: "Competências", icon: <GraduationCap size={15} /> },
    ],
  },
  {
    group: "Carreira",
    items: [
      { name: "vagas", label: "Vagas", icon: <Briefcase size={15} /> },
      { name: "entrevistas", label: "Entrevistas", icon: <MessagesSquare size={15} /> },
      { name: "linkedin", label: "LinkedIn", icon: <Megaphone size={15} /> },
    ],
  },
  {
    group: "Dados",
    items: [
      { name: "exportar", label: "Exportar", icon: <Download size={15} /> },
      { name: "configuracoes", label: "Configurações", icon: <Settings size={15} /> },
    ],
  },
];

export function Sidebar({ onSearch, onNew, onNavigate }: { onSearch: () => void; onNew: () => void; onNavigate?: () => void }) {
  const route = useRoute();
  const projects = useStore((s) => s.projects);
  const owner = useStore((s) => s.settings.ownerName);
  const { theme, toggle, dark } = useTheme();
  const active = route.name === "projeto" ? "projetos" : route.name;
  const recent = [...projects].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 5);
  const pal = dark ? SERIES.dark : SERIES.light;

  return (
    <aside className="flex h-full w-60 shrink-0 flex-col border-r border-line bg-panel">
      <div className="flex items-center gap-2 px-4 pb-2 pt-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-accent text-white dark:text-[#0e0e0f]">
          <BarChart3 size={15} />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold leading-tight">Portfolio Manager</p>
          <p className="truncate text-[11px] text-mute">{owner || "Seu portfólio técnico"}</p>
        </div>
      </div>

      <div className="flex gap-1.5 px-3 py-2">
        <button onClick={onSearch} className="flex h-8 flex-1 items-center gap-2 rounded-md border border-line px-2 text-xs text-mute hover:bg-elev">
          <Search size={13} /> Buscar
          <span className="kbd ml-auto">Ctrl K</span>
        </button>
        <button onClick={onNew} aria-label="Novo projeto" title="Novo projeto" className="flex h-8 w-8 items-center justify-center rounded-md border border-line text-sub hover:bg-elev hover:text-ink">
          <Plus size={14} />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 pb-2">
        {NAV.map((g) => (
          <div key={g.group} className="mt-3">
            <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-mute">{g.group}</p>
            {g.items.map((it) => (
              <a
                key={it.name}
                href={href(it.name)}
                onClick={onNavigate}
                aria-current={active === it.name ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition",
                  active === it.name ? "bg-elev font-medium text-ink" : "text-sub hover:bg-elev/60 hover:text-ink",
                )}
              >
                {it.icon}
                {it.label}
                {it.name === "projetos" && <span className="ml-auto text-xs text-mute">{projects.length}</span>}
              </a>
            ))}
          </div>
        ))}

        {recent.length > 0 && (
          <div className="mt-4">
            <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-mute">Recentes</p>
            {recent.map((p) => (
              <a
                key={p.id}
                href={href("projeto", p.id)}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-2 rounded-md px-2 py-1 text-xs transition",
                  route.name === "projeto" && route.param === p.id ? "bg-elev text-ink" : "text-sub hover:bg-elev/60 hover:text-ink",
                )}
              >
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: pal[STAGE_SLOT[p.stage]] }} />
                <span className="truncate">{p.name}</span>
              </a>
            ))}
          </div>
        )}
      </nav>

      <div className="flex items-center justify-between border-t border-line px-3 py-2">
        <SyncBadge />
        <button onClick={toggle} aria-label={theme === "dark" ? "Ativar tema claro" : "Ativar tema escuro"} title="Alternar tema" className="rounded-md p-1.5 text-mute hover:bg-elev hover:text-ink">
          {dark ? <Sun size={14} /> : <Moon size={14} />}
        </button>
      </div>
    </aside>
  );
}

function SyncBadge() {
  const { state, message, lastSaved } = useSync();
  const map = {
    local: { icon: <CloudOff size={12} />, text: "Salvo no navegador" },
    conectando: { icon: <RefreshCw size={12} className="animate-spin" />, text: "Conectando…" },
    sincronizando: { icon: <RefreshCw size={12} className="animate-spin" />, text: "Sincronizando…" },
    sincronizado: { icon: <Cloud size={12} />, text: "Sincronizado" },
    erro: { icon: <AlertTriangle size={12} />, text: "Erro ao sincronizar" },
  }[state];
  return (
    <span title={`${message ?? ""}${lastSaved ? `\nÚltimo salvamento: ${fmtDateTime(lastSaved)}` : ""}`} className={cn("flex items-center gap-1.5 text-[11px]", state === "erro" ? "text-red-500" : "text-mute")}>
      {map.icon}
      {map.text}
    </span>
  );
}
