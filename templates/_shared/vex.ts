/**
 * Verdict's core, with no imports so the browser, the server and the templates share it: read lockfiles and SBOMs,
 * read an OSV advisory, decide each product's status the VEX way, and write OpenVEX.
 */

export type Pkg = { ecosystem: string; name: string; version: string };
export type Range = { introduced?: string; fixed?: string; last_affected?: string };
export type Advisory = {
  id: string;
  aliases: string[];
  summary: string;
  details: string;
  severity?: string; // GitHub's word: LOW, MODERATE, HIGH, CRITICAL
  published: string;
  modified: string;
  packages: Array<{ ecosystem: string; name: string; ranges: Range[] }>;
  links: string[];
};
/** OpenVEX statuses and justifications (openvex.dev, v0.2.0). */
export type Status = "affected" | "fixed" | "not_affected" | "under_investigation";
export type Justification = "component_not_present" | "vulnerable_code_not_present" | "vulnerable_code_not_in_execute_path" | "vulnerable_code_cannot_be_controlled_by_adversary" | "inline_mitigations_already_exist";
export const STATUSES: Status[] = ["affected", "under_investigation", "fixed", "not_affected"];
export const JUSTIFICATIONS: Justification[] = ["component_not_present", "vulnerable_code_not_present", "vulnerable_code_not_in_execute_path", "vulnerable_code_cannot_be_controlled_by_adversary", "inline_mitigations_already_exist"];
export const STATUS_LABEL: Record<Status, string> = { affected: "Affected", under_investigation: "Under investigation", fixed: "Fixed", not_affected: "Not affected" };
export const JUSTIFICATION_LABEL: Record<Justification, string> = {
  component_not_present: "The affected package isn't used",
  vulnerable_code_not_present: "The version used doesn't contain the vulnerable code",
  vulnerable_code_not_in_execute_path: "The vulnerable code is never run",
  vulnerable_code_cannot_be_controlled_by_adversary: "The vulnerable code can't be reached by an attacker",
  inline_mitigations_already_exist: "Mitigations already block it",
};

/* ------------------------------------------------------------ lockfiles */

/** "@scope/name@1.2.3" or "name@1.2.3" → [name, version]. */
const splitAt = (s: string): [string, string] => {
  const i = s.lastIndexOf("@");
  return i > 0 ? [s.slice(0, i), s.slice(i + 1)] : [s, ""];
};

function npmLock(text: string): Pkg[] {
  const j = JSON.parse(text);
  const out: Pkg[] = [];
  if (j.packages) {
    for (const [path, v] of Object.entries(j.packages as Record<string, { version?: string; name?: string; link?: boolean }>)) {
      if (!path || v.link || !v.version) continue;
      out.push({ ecosystem: "npm", name: v.name ?? path.slice(path.lastIndexOf("node_modules/") + 13), version: v.version });
    }
  } else if (j.dependencies) {
    const walk = (deps: Record<string, { version: string; dependencies?: Record<string, never> }>) => {
      for (const [name, v] of Object.entries(deps)) {
        if (v.version && !/^(file|link|git)/.test(v.version)) out.push({ ecosystem: "npm", name, version: v.version });
        if (v.dependencies) walk(v.dependencies);
      }
    };
    walk(j.dependencies);
  }
  return out;
}

function pnpmLock(text: string): Pkg[] {
  const out: Pkg[] = [];
  const start = text.search(/^packages:\s*$/m);
  if (start < 0) return out;
  const body = text.slice(start).split(/\n(?=\S)/)[0];
  for (const m of body.matchAll(/^ {2}['"]?\/?((?:@[^/@\s'"]+\/)?[^@/\s'"(]+)[@/](\d[^(:'"\s]*)/gm)) out.push({ ecosystem: "npm", name: m[1], version: m[2] });
  return out;
}

function yarnLock(text: string): Pkg[] {
  const out: Pkg[] = [];
  for (const block of text.split(/\n(?=\S)/)) {
    const head = block.split("\n")[0];
    if (!head.endsWith(":") || head.startsWith("#") || head.startsWith("__metadata")) continue;
    const spec = head.replace(/:$/, "").split(",")[0].trim().replace(/^"|"$/g, "");
    const [name] = splitAt(spec.replace(/@npm:/, "@"));
    const v = block.match(/^\s+version:?\s+"?([^"\s]+)"?/m)?.[1];
    if (name && v) out.push({ ecosystem: "npm", name, version: v });
  }
  return out;
}

const PURL_ECOSYSTEM: Record<string, string> = { npm: "npm", maven: "Maven", pypi: "PyPI", golang: "Go", gem: "RubyGems", cargo: "crates.io", nuget: "NuGet", composer: "Packagist", hex: "Hex", pub: "Pub" };

function cyclonedx(text: string): Pkg[] {
  const j = JSON.parse(text);
  const out: Pkg[] = [];
  const walk = (list: Array<{ purl?: string; components?: unknown[] }> = []) => {
    for (const c of list) {
      const m = c.purl?.match(/^pkg:([^/]+)\/(.+)@([^?#]+)/);
      if (m && PURL_ECOSYSTEM[m[1]]) {
        const path = decodeURIComponent(m[2]);
        const name = m[1] === "maven" ? path.replace("/", ":") : path;
        out.push({ ecosystem: PURL_ECOSYSTEM[m[1]], name, version: decodeURIComponent(m[3]) });
      }
      if (c.components) walk(c.components as typeof list);
    }
  };
  walk(j.components);
  return out;
}

/** Any supported lockfile or SBOM → unique packages. */
export function readLock(fileName: string, text: string): Pkg[] {
  const name = fileName.toLowerCase().split("/").pop()!;
  let pkgs: Pkg[];
  if (name.endsWith("pnpm-lock.yaml") || /^lockfileVersion:/m.test(text.slice(0, 200))) pkgs = pnpmLock(text);
  else if (name.endsWith("yarn.lock") || /^# yarn lockfile|^__metadata:/m.test(text.slice(0, 300))) pkgs = yarnLock(text);
  else {
    let j: { bomFormat?: string; lockfileVersion?: number; packages?: unknown; dependencies?: unknown };
    try {
      j = JSON.parse(text);
    } catch {
      throw new Error(`${fileName} isn't a lockfile Verdict can read (package-lock.json, pnpm-lock.yaml, yarn.lock or a CycloneDX JSON SBOM).`);
    }
    pkgs = j.bomFormat === "CycloneDX" ? cyclonedx(text) : j.lockfileVersion || j.packages || j.dependencies ? npmLock(text) : [];
  }
  const seen = new Set<string>();
  return pkgs.filter((p) => {
    const k = `${p.ecosystem}:${p.name}@${p.version}`;
    return seen.has(k) ? false : (seen.add(k), true);
  });
}

/* ------------------------------------------------------------ advisory */

type OsvVuln = {
  id: string;
  aliases?: string[];
  summary?: string;
  details?: string;
  published: string;
  modified: string;
  database_specific?: { severity?: string };
  affected?: Array<{ package?: { ecosystem: string; name: string }; ranges?: Array<{ events: Range[] }> }>;
  references?: Array<{ url: string }>;
};

const rank = (u: string) => (/\/security\/advisories\/|\/advisories\/GHSA-/.test(u) ? 0 : /nvd\.nist\.gov/.test(u) ? 1 : 2);

/** OSV records (the one asked for, plus its aliases when it has no packages) → one advisory. */
export function readAdvisory(records: OsvVuln[]): Advisory {
  const main = records[0];
  const withPkgs = records.find((r) => r.affected?.some((a) => a.package)) ?? main;
  const packages: Advisory["packages"] = [];
  for (const a of withPkgs.affected ?? []) {
    if (!a.package) continue;
    const ranges = (a.ranges ?? []).map((r) => Object.assign({}, ...r.events) as Range);
    const prev = packages.find((p) => p.ecosystem === a.package!.ecosystem && p.name === a.package!.name);
    if (prev) prev.ranges.push(...ranges);
    else packages.push({ ecosystem: a.package.ecosystem, name: a.package.name, ranges });
  }
  const ids = [...new Set(records.flatMap((r) => [r.id, ...(r.aliases ?? [])]))];
  const cve = ids.find((i) => i.startsWith("CVE-"));
  return {
    id: cve ?? main.id,
    aliases: ids.filter((i) => i !== (cve ?? main.id)),
    summary: (withPkgs.summary ?? main.summary ?? "").trim(),
    details: (withPkgs.details ?? main.details ?? "").trim(),
    severity: withPkgs.database_specific?.severity ?? main.database_specific?.severity,
    published: withPkgs.published ?? main.published,
    modified: withPkgs.modified ?? main.modified,
    packages,
    // The advisory itself first, then the CVE record, then the rest (commits, releases).
    links: [...new Set(records.flatMap((r) => (r.references ?? []).map((x) => x.url)))]
      .sort((x, y) => rank(x) - rank(y))
      .slice(0, 8),
  };
}

/* ------------------------------------------------------------ verdict */

/** Compare dotted versions numerically ("16.4.10" > "16.4.5"); pre-release tags sort before the release. */
export function cmp(a: string, b: string) {
  const pa = a.split(/[.+-]/);
  const pb = b.split(/[.+-]/);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const x = pa[i];
    const y = pb[i];
    if (x === undefined) return y !== undefined && /^\d+$/.test(y) ? -1 : 1;
    if (y === undefined) return /^\d+$/.test(x) ? 1 : -1;
    const nx = Number(x);
    const ny = Number(y);
    if (!Number.isNaN(nx) && !Number.isNaN(ny)) {
      if (nx !== ny) return nx - ny;
    } else if (x !== y) return x < y ? -1 : 1;
  }
  return 0;
}

export type Found = Pkg & { affected: boolean };
export type Verdict = {
  status: Status;
  justification?: Justification;
  found: Found[]; // the advisory's packages as this product uses them
  fixedIn?: string; // the version to upgrade to, when affected
};

/**
 * One product's verdict. `isAffected` answers whether an exact package version is affected (OSV's querybatch, which
 * does the range matching). Affected beats fixed beats not affected.
 */
export function decide(pkgs: Pkg[], adv: Advisory, isAffected: (p: Pkg) => boolean): Verdict {
  const names = new Set(adv.packages.map((p) => `${p.ecosystem}:${p.name}`));
  const found: Found[] = pkgs.filter((p) => names.has(`${p.ecosystem}:${p.name}`)).map((p) => ({ ...p, affected: isAffected(p) }));
  if (!found.length) return { status: "not_affected", justification: "component_not_present", found };
  const fixes = (p: Pkg) => adv.packages.filter((a) => a.name === p.name).flatMap((a) => a.ranges.map((r) => r.fixed).filter(Boolean) as string[]);
  const bad = found.filter((f) => f.affected);
  if (bad.length) {
    const major = (v: string) => v.split(".")[0];
    const options = fixes(bad[0]).sort(cmp);
    const fixedIn = options.find((f) => major(f) === major(bad[0].version) && cmp(f, bad[0].version) > 0) ?? options.find((f) => cmp(f, bad[0].version) > 0) ?? options.at(-1);
    return { status: "affected", found, fixedIn };
  }
  // Present but outside every range: it either already has the fix, or predates the bug.
  const hasFix = found.every((f) => fixes(f).some((fx) => cmp(f.version, fx) >= 0));
  return hasFix ? { status: "fixed", found } : { status: "not_affected", justification: "vulnerable_code_not_present", found };
}

/* ------------------------------------------------------------ OpenVEX */

export type Row = { product: string; version?: string; status: Status; justification?: Justification; impact?: string; action?: string };

/** An OpenVEX v0.2.0 document for one advisory and its product rows. */
export function openvex(adv: Pick<Advisory, "id" | "aliases">, rows: Row[], author: string, timestamp: string) {
  return {
    "@context": "https://openvex.dev/ns/v0.2.0",
    "@id": `https://openvex.dev/docs/public/verdict-${adv.id.toLowerCase()}-${timestamp.slice(0, 10)}`,
    author,
    timestamp,
    version: 1,
    statements: rows.map((r) => ({
      vulnerability: { name: adv.id, aliases: adv.aliases },
      products: [{ "@id": r.version ? `${r.product}@${r.version}` : r.product }],
      status: r.status,
      ...(r.status === "not_affected" ? { justification: r.justification ?? "vulnerable_code_not_present", ...(r.impact ? { impact_statement: r.impact } : {}) } : {}),
      ...(r.status === "affected" ? { action_statement: r.action || "Upgrade to a fixed version." } : {}),
    })),
  };
}

/* ------------------------------------------------------------ values */

export type ProductRow = { name: string; version?: string; verdict: Verdict; status?: Status; justification?: Justification; note?: string };

/** The values the three templates take. A row's own status/justification override the computed verdict. */
export function toValues(adv: Advisory, rows: ProductRow[], meta: { vendor: string; contact: string; date: string; signer?: string; customer?: string }) {
  const sev = (adv.severity ?? "").toLowerCase();
  return {
    vendor: meta.vendor.slice(0, 60),
    contact: meta.contact.slice(0, 120),
    date: meta.date,
    signer: meta.signer?.trim().slice(0, 80) || undefined,
    customer: meta.customer?.trim().slice(0, 80) || undefined,
    advisory: adv.id,
    aliases: adv.aliases.slice(0, 6).join(", ") || undefined,
    summary: adv.summary.slice(0, 220),
    // The advisory's first paragraph, cut at a sentence end.
    details: adv.details ? (adv.details.split(/\n\s*\n/)[0].replace(/\s+/g, " ").match(/^.{0,700}[.!?](?=\s|$)/)?.[0] ?? adv.details.slice(0, 699)) : undefined,
    severity: (["low", "moderate", "high", "critical"].includes(sev) ? sev : "unknown") as "low" | "moderate" | "high" | "critical" | "unknown",
    published: adv.published.slice(0, 10),
    link: adv.links[0],
    products: rows.slice(0, 40).map((r) => {
      const status = r.status ?? r.verdict.status;
      return {
        name: r.name.slice(0, 60),
        version: r.version?.slice(0, 30) || undefined,
        status,
        justification: status === "not_affected" ? (r.justification ?? r.verdict.justification ?? "vulnerable_code_not_present") : undefined,
        packages: r.verdict.found.length ? [...new Set(r.verdict.found.map((f) => `${f.name} ${f.version}`))].slice(0, 4).join(", ").slice(0, 160) : undefined,
        fixedIn: status === "affected" ? r.verdict.fixedIn : undefined,
        note: r.note?.trim().slice(0, 300) || undefined,
      };
    }),
  };
}
