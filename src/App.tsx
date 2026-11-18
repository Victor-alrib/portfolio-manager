import { useCallback, useEffect, useState } from "react";
import { Menu } from "lucide-react";
import { Sidebar } from "./components/Sidebar";
import { CommandPalette } from "./components/CommandPalette";
import { ConfirmHost, ToastHost } from "./components/ui";
import { useApplyTheme } from "./components/theme";
import { useRoute } from "./router";
import { Dashboard } from "./features/dashboard/Dashboard";
import { ProjectsList } from "./features/projects/ProjectsList";
import { ProjectDetail } from "./features/projects/ProjectDetail";
import { NewProjectModal } from "./features/projects/NewProjectModal";
import { Kanban } from "./features/kanban/Kanban";
import { ReadmeGenerator } from "./features/readme/ReadmeGenerator";
import { Skills } from "./features/skills/Skills";
import { Jobs } from "./features/jobs/Jobs";
import { Interview } from "./features/interview/Interview";
import { LinkedIn } from "./features/linkedin/LinkedIn";
import { ExportPage } from "./features/export/Export";
import { SettingsPage } from "./features/settings/Settings";
import type { Stage } from "./types";

export default function App() {
  useApplyTheme();
  const route = useRoute();
  const [palette, setPalette] = useState(false);
  const [newOpen, setNewOpen] = useState<false | { stage?: Stage }>(false);
  const [drawer, setDrawer] = useState(false);

  const openNew = useCallback((stage?: Stage) => setNewOpen({ stage }), []);

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPalette((v) => !v);
      }
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, []);

  useEffect(() => setDrawer(false), [route.name, route.param]);

  let page: JSX.Element;
  switch (route.name) {
    case "projetos": page = <ProjectsList onNew={() => openNew()} />; break;
    case "projeto": page = <ProjectDetail id={route.param ?? ""} />; break;
    case "kanban": page = <Kanban onNew={openNew} />; break;
    case "readme": page = <ReadmeGenerator projectId={route.param} />; break;
    case "competencias": page = <Skills />; break;
    case "vagas": page = <Jobs jobId={route.param} />; break;
    case "entrevistas": page = <Interview projectId={route.param} />; break;
    case "linkedin": page = <LinkedIn postId={route.param} />; break;
    case "exportar": page = <ExportPage />; break;
    case "configuracoes": page = <SettingsPage />; break;
    default: page = <Dashboard onNew={() => openNew()} />;
  }
  const wide = route.name === "kanban";

  return (
    <div className="flex h-full">
      <div className="hidden lg:block">
        <Sidebar onSearch={() => setPalette(true)} onNew={() => openNew()} />
      </div>
      {drawer && (
        <div className="fixed inset-0 z-40 flex lg:hidden" onMouseDown={(e) => e.target === e.currentTarget && setDrawer(false)}>
          <div className="h-full shadow-pop">
            <Sidebar onSearch={() => (setDrawer(false), setPalette(true))} onNew={() => (setDrawer(false), openNew())} onNavigate={() => setDrawer(false)} />
          </div>
          <div className="flex-1 bg-black/40" onClick={() => setDrawer(false)} />
        </div>
      )}

      <main id="main" className="min-w-0 flex-1 overflow-y-auto">
        <div className="sticky top-0 z-20 flex items-center gap-2 border-b border-line bg-bg/90 px-4 py-2 backdrop-blur lg:hidden">
          <button onClick={() => setDrawer(true)} aria-label="Abrir menu" className="rounded-md p-1.5 text-sub hover:bg-elev">
            <Menu size={18} />
          </button>
          <span className="text-sm font-semibold">Portfolio Manager</span>
        </div>
        <div className={wide ? "px-4 py-6 lg:px-8" : "mx-auto max-w-6xl px-4 py-6 lg:px-8"}>{page}</div>
      </main>

      <CommandPalette open={palette} onClose={() => setPalette(false)} onNew={() => openNew()} />
      <NewProjectModal open={!!newOpen} stage={newOpen ? newOpen.stage : undefined} onClose={() => setNewOpen(false)} />
      <ConfirmHost />
      <ToastHost />
    </div>
  );
}
