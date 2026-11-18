import { useSyncExternalStore } from "react";

/**
 * Roteamento por hash simples (#nome ou #nome-param), compatível com
 * ambientes sandboxed. Ex.: #kanban, #projeto-p1a2b3, #readme-p1a2b3
 */
export type RouteName =
  | "dashboard"
  | "projetos"
  | "projeto"
  | "kanban"
  | "readme"
  | "competencias"
  | "vagas"
  | "entrevistas"
  | "linkedin"
  | "exportar"
  | "configuracoes";

const WITH_PARAM: RouteName[] = ["projeto", "readme", "entrevistas", "vagas", "linkedin"];

export interface Route {
  name: RouteName;
  param?: string;
}

export function parse(hash: string): Route {
  const h = hash.replace(/^#/, "");
  for (const n of WITH_PARAM) {
    if (h === n) return { name: n };
    if (h.startsWith(n + "-")) return { name: n, param: h.slice(n.length + 1) };
  }
  const known: RouteName[] = ["dashboard", "projetos", "kanban", "competencias", "exportar", "configuracoes"];
  return { name: (known.find((k) => k === h) ?? "dashboard") as RouteName };
}

const subscribe = (cb: () => void) => {
  window.addEventListener("hashchange", cb);
  return () => window.removeEventListener("hashchange", cb);
};

export function useRoute(): Route {
  const hash = useSyncExternalStore(subscribe, () => window.location.hash);
  return parse(hash);
}

export const href = (name: RouteName, param?: string) => `#${name}${param ? "-" + param : ""}`;

export function navigate(name: RouteName, param?: string) {
  const h = href(name, param);
  if (window.location.hash !== h) window.location.hash = h;
  document.getElementById("main")?.scrollTo({ top: 0 });
}
