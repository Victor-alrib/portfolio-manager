import { useCapability } from "./platform";

export type SaveOutcome = "saved" | "declined" | "fallback" | "failed";

interface DownloadsApi {
  save(req: { filename: string; data: string | Blob | ArrayBuffer | ArrayBufferView }): Promise<{ status: string }>;
}

/**
 * Salva um arquivo: usa o recurso de downloads do host quando existir;
 * caso contrário, o download padrão do navegador.
 */
export async function saveFile(filename: string, data: string | Blob | ArrayBuffer): Promise<SaveOutcome> {
  const dl = await useCapability<DownloadsApi>("downloads");
  if (dl) {
    try {
      await dl.save({ filename, data });
      return "saved";
    } catch (e: unknown) {
      const code = (e as { code?: string })?.code;
      if (code === "declined") return "declined";
      // outros erros: tenta o caminho padrão
    }
  }
  try {
    const blob = data instanceof Blob ? data : new Blob([data], { type: mimeFor(filename) });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    return "fallback";
  } catch {
    return "failed";
  }
}

function mimeFor(f: string) {
  if (f.endsWith(".json")) return "application/json";
  if (f.endsWith(".md")) return "text/markdown;charset=utf-8";
  if (f.endsWith(".pdf")) return "application/pdf";
  return "text/plain;charset=utf-8";
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      ta.remove();
      return ok;
    } catch {
      return false;
    }
  }
}
