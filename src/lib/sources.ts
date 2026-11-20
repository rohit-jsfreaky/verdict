// The advisory (OSV, live), the products' lockfiles (upload, a public GitHub repo, or the frozen sample), and OSV's
// answer for the exact package versions. Everything runs in the browser; OSV and GitHub allow it (CORS).
import { readAdvisory, readLock, type Advisory, type Pkg } from "../../templates/_shared/vex.ts";

export type Product = { id: string; name: string; version?: string; source: string; packages: Pkg[] };

const OSV = "https://api.osv.dev/v1";

export async function fetchAdvisory(input: string): Promise<Advisory> {
  const id = input.trim().toUpperCase().startsWith("GHSA-") ? `GHSA-${input.trim().slice(5).toLowerCase()}` : input.trim().toUpperCase();
  if (!/^[A-Z][A-Za-z]*-[\w-]+$/.test(id)) throw new Error("Paste an advisory id like CVE-2026-119348 or GHSA-pc58-hwjq-p385.");
  const get = async (x: string) => {
    const r = await fetch(`${OSV}/vulns/${encodeURIComponent(x)}`);
    if (r.status === 404) throw new Error(`OSV doesn't know ${x} yet. New advisories can take a few hours to appear.`);
    if (!r.ok) throw new Error(`OSV answered ${r.status}.`);
    return r.json();
  };
  const first = await get(id);
  const more = first.affected?.some((a: { package?: unknown }) => a.package) ? [] : await Promise.all((first.aliases ?? []).filter((a: string) => /^GHSA-/.test(a)).map(get));
  const adv = readAdvisory([first, ...more]);
  if (!adv.packages.length) throw new Error(`${id} has no package data in OSV, so there's nothing to check lockfiles against.`);
  return adv;
}

/** OSV's answer for exact versions: the advisory ids that affect each one. Keyed "ecosystem:name@version". */
export async function checkVersions(pkgs: Pkg[]): Promise<Record<string, string[]>> {
  const unique = [...new Map(pkgs.map((p) => [`${p.ecosystem}:${p.name}@${p.version}`, p])).values()];
  const out: Record<string, string[]> = {};
  for (let i = 0; i < unique.length; i += 500) {
    const chunk = unique.slice(i, i + 500);
    const r = await fetch(`${OSV}/querybatch`, { method: "POST", body: JSON.stringify({ queries: chunk.map((p) => ({ package: { name: p.name, ecosystem: p.ecosystem }, version: p.version })) }) });
    if (!r.ok) throw new Error(`OSV answered ${r.status} while checking versions.`);
    const j = await r.json();
    chunk.forEach((p, k) => (out[`${p.ecosystem}:${p.name}@${p.version}`] = (j.results[k]?.vulns ?? []).map((v: { id: string }) => v.id)));
  }
  return out;
}

let n = 0;
const nextId = () => `p${++n}`;

export function fromFile(fileName: string, text: string): Product {
  const packages = readLock(fileName, text);
  if (!packages.length) throw new Error(`No packages found in ${fileName}.`);
  let version: string | undefined;
  try {
    version = JSON.parse(text).version;
  } catch {}
  return { id: nextId(), name: fileName.replace(/[-_.]?(package-lock\.json|pnpm-lock\.yaml|yarn\.lock|bom\.json|sbom\.json|\.json)$/i, "") || "Product", version, source: fileName, packages };
}

const LOCKS = ["package-lock.json", "pnpm-lock.yaml", "yarn.lock", "bom.json", "sbom.json"];

/** The first lockfile at a public repository's root. */
export async function fromGitHub(input: string): Promise<Product> {
  const m = input.trim().replace(/\.git$/, "").match(/^(?:https?:\/\/)?(?:www\.)?(?:github\.com\/)?([\w.-]+)\/([\w.-]+)(?:\/tree\/([^?#]+))?\/?$/);
  if (!m) throw new Error("Paste a public GitHub repository, like github.com/shadcn-ui/taxonomy");
  const [, owner, repo, branch] = m;
  const meta = await fetch(`https://api.github.com/repos/${owner}/${repo}`).then((r) => (r.ok ? r.json() : Promise.reject(new Error(r.status === 404 ? `${owner}/${repo} isn't a public repository.` : `GitHub answered ${r.status}.`))));
  const ref = branch ?? meta.default_branch;
  const root: Array<{ name: string }> = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents?ref=${encodeURIComponent(ref)}`).then((r) => (r.ok ? r.json() : []));
  const lock = LOCKS.find((l) => root.some((f) => f.name === l));
  if (lock) {
    const r = await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/${ref}/${lock}`);
    if (r.ok) return { ...fromFile(lock, await r.text()), name: repo, source: `github.com/${owner}/${repo}/${lock}` };
  }
  throw new Error(`No package-lock.json, pnpm-lock.yaml, yarn.lock or bom.json at the root of ${owner}/${repo}.`);
}

export const SNAPSHOT = "/samples/our-apps-2026-11-20.json";
/** Our six apps on 20 Nov 2026 and the advisory as OSV had it then. */
export async function fromSnapshot(): Promise<{ advisory: Advisory; products: Product[]; hits: Record<string, string[]>; date: string }> {
  const s = await fetch(SNAPSHOT).then((r) => r.json());
  const products = (s.products as Array<Omit<Product, "id" | "source"> & { lockfile: string }>).map((p) => ({ id: nextId(), name: p.name, version: p.version, source: `${p.name.toLowerCase()}/${p.lockfile}`, packages: p.packages }));
  const hits = Object.fromEntries(Object.entries(s.hits as Record<string, string[]>).map(([k, v]) => [`npm:${k}`, v]));
  return { advisory: readAdvisory(s.advisory), products, hits, date: s.read };
}
