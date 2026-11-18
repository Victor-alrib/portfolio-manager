/**
 * Ponte com o runtime do host (quando o app roda como artifact no claude.ai).
 * Tudo aqui é opcional: fora do host, as funções resolvem `null` e o app
 * segue funcionando com localStorage e downloads normais do navegador.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
type Use = (name: string) => Promise<any>;

const hostUse = (): Use | null => {
  const c = (window as any).claude;
  return c && typeof c.use === "function" ? (c.use.bind(c) as Use) : null;
};

/** Aguarda o runtime aparecer (ele é injetado depois do primeiro script). */
async function waitForHost(timeoutMs = 4000): Promise<Use | null> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const u = hostUse();
    if (u) return u;
    await new Promise((r) => setTimeout(r, 150));
  }
  return null;
}

const memo = new Map<string, Promise<any>>();

export function useCapability<T = any>(name: string): Promise<T | null> {
  if (!memo.has(name)) {
    memo.set(
      name,
      (async () => {
        const use = await waitForHost();
        if (!use) return null;
        try {
          return await Promise.race([use(name), new Promise((r) => setTimeout(() => r(null), 10000))]);
        } catch {
          return null;
        }
      })(),
    );
  }
  return memo.get(name)!;
}

export interface CloudDb {
  collection(path: string): any;
  doc(path: string): any;
}

export async function getCloud(): Promise<{ db: CloudDb; userId: string } | null> {
  const [db, user] = await Promise.all([useCapability<CloudDb>("db"), useCapability<any>("user")]);
  if (!db || !user) return null;
  try {
    const id = await user.id();
    return id ? { db, userId: String(id) } : null;
  } catch {
    return null;
  }
}
