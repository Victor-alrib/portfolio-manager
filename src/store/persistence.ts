import type { AppData } from "../types";
import { migrate } from "./migrations";

const KEY = "portfolio-manager:data";
const STAMP = "portfolio-manager:savedAt";

export function loadLocal(): AppData | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? migrate(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

export function localSavedAt(): string | null {
  try {
    return localStorage.getItem(STAMP);
  } catch {
    return null;
  }
}

export function saveLocal(d: AppData, savedAt: string): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(d));
    localStorage.setItem(STAMP, savedAt);
    return true;
  } catch {
    return false;
  }
}
