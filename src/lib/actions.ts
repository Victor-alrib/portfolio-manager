import { toast } from "../components/ui";
import { copyText, saveFile } from "./download";

export async function copyWithToast(text: string, okMsg = "Copiado para a área de transferência") {
  const ok = await copyText(text);
  toast(ok ? okMsg : "Não foi possível copiar", ok ? "ok" : "erro");
}

export async function saveWithToast(filename: string, data: string | Blob | ArrayBuffer) {
  const o = await saveFile(filename, data);
  if (o === "saved" || o === "fallback") toast(`Arquivo ${filename} gerado`);
  else if (o === "failed") toast("Download indisponível aqui — use a opção Copiar", "erro");
}
