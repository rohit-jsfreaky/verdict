"use client";

import { renderLocal } from "@/lib/render-local";
import NextLink from "next/link";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AlertTriangle, ArrowLeft, Code02, Download01, FileCheck02, Globe02, LinkExternal01, Mail01, Trash01, Upload01, XClose } from "@untitledui/icons";
import { JUSTIFICATIONS, JUSTIFICATION_LABEL, STATUSES, STATUS_LABEL, decide, openvex, toValues, type Advisory, type Justification, type Status } from "../../templates/_shared/vex.ts";
import { checkVersions, fetchAdvisory, fromFile, fromGitHub, fromSnapshot, type Product } from "@/lib/sources";
import { Mark } from "./Mark";

type Out = "statement" | "reply" | "letter";
type Override = { status?: Status; justification?: Justification; note?: string };
const OUTS: Array<{ key: Out; label: string; icon: ReactNode; file: string }> = [
  { key: "statement", label: "Statement page", icon: <Globe02 size={16} />, file: "security-statement.html" },
  { key: "reply", label: "Customer reply", icon: <Mail01 size={16} />, file: "customer-reply.html" },
  { key: "letter", label: "Letter", icon: <FileCheck02 size={16} />, file: "statement-letter.pdf" },
];
const TONE: Record<Status, string> = { affected: "text-red bg-red-soft", under_investigation: "text-amber bg-amber-soft", fixed: "text-blue bg-blue-soft", not_affected: "text-green bg-green-soft" };
const QUICK = [
  { id: "CVE-2026-119348", note: "Next.js · 19 Nov 2026" },
  { id: "CVE-2021-44228", note: "Log4Shell · Dec 2021" },
];
const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const fmt = (iso: string) => new Date(`${iso.slice(0, 10)}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

export function Desk() {
  const [adv, setAdv] = useState<Advisory | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [hits, setHits] = useState<Record<string, string[]>>({});
  const [overrides, setOverrides] = useState<Record<string, Override>>({});
  const [meta, setMeta] = useState({ vendor: "", contact: "", signer: "", customer: "", date: "" });
  const [sheet, setSheet] = useState<Out | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(label: string, job: () => Promise<void>) {
    setBusy(label);
    setError(null);
    try {
      await job();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("verdict:meta") ?? "null");
      if (saved) setTimeout(() => setMeta((m) => ({ ...m, vendor: saved.vendor ?? "", contact: saved.contact ?? "", signer: saved.signer ?? "" })), 0);
    } catch {}
    // The date is the visitor's, so it is set after load (not at build time).
    setTimeout(() => setMeta((m) => ({ ...m, date: m.date || today() })), 0);
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem("verdict:meta", JSON.stringify({ vendor: meta.vendor, contact: meta.contact, signer: meta.signer }));
    } catch {}
  }, [meta.vendor, meta.contact, meta.signer]);

  // Ask OSV about the advisory's packages, at the exact versions the products use, whenever either changes.
  const relevant = useMemo(() => {
    if (!adv) return [];
    const names = new Set(adv.packages.map((p) => `${p.ecosystem}:${p.name}`));
    return products.flatMap((p) => p.packages).filter((p) => names.has(`${p.ecosystem}:${p.name}`) && !(`${p.ecosystem}:${p.name}@${p.version}` in hits));
  }, [adv, products, hits]);
  useEffect(() => {
    if (!relevant.length) return;
    let alive = true;
    checkVersions(relevant)
      .then((h) => alive && setHits((prev) => ({ ...prev, ...h })))
      .catch((e) => alive && setError((e as Error).message));
    return () => {
      alive = false;
    };
  }, [relevant]);

  const rows = useMemo(() => {
    if (!adv) return [];
    const ids = new Set([adv.id, ...adv.aliases]);
    return products.map((p) => {
      const pending = p.packages.some((x) => adv.packages.some((a) => a.ecosystem === x.ecosystem && a.name === x.name) && !(`${x.ecosystem}:${x.name}@${x.version}` in hits));
      const verdict = decide(p.packages, adv, (x) => (hits[`${x.ecosystem}:${x.name}@${x.version}`] ?? []).some((v) => ids.has(v)));
      return { product: p, verdict, pending, o: overrides[p.id] ?? {} };
    });
  }, [adv, products, hits, overrides]);

  if (!adv)
    return (
      <Start
        busy={busy}
        error={error}
        load={(id) => run(id, async () => setAdv(await fetchAdvisory(id)))}
        sample={() =>
          run("the sample", async () => {
            const s = await fromSnapshot();
            setAdv(s.advisory);
            setProducts(s.products);
            setHits(s.hits);
            setMeta((m) => ({ ...m, vendor: m.vendor || "rohit-jsfreaky", contact: m.contact || "github.com/rohit-jsfreaky", date: s.date }));
          })
        }
      />
    );

  const values = toValues(
    adv,
    rows.map((r) => ({ name: r.product.name, version: r.product.version, verdict: r.verdict, status: r.o.status, justification: r.o.justification, note: r.o.note })),
    { vendor: meta.vendor || "Our company", contact: meta.contact || "security@example.com", date: meta.date || today(), signer: meta.signer, customer: meta.customer },
  );
  const ready = rows.length > 0 && !rows.some((r) => r.pending);
  const count = (s: Status) => values.products.filter((p) => p.status === s).length;

  function downloadVex() {
    const doc = openvex(adv!, values.products.map((p) => ({ product: p.name, version: p.version, status: p.status, justification: p.justification, impact: p.status === "not_affected" ? p.note : undefined, action: p.status === "affected" ? p.note || (p.fixedIn ? `Upgrade to a release with ${p.packages?.split(" ")[0]} ${p.fixedIn} or later.` : undefined) : undefined })), values.vendor, `${values.date}T00:00:00Z`);
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([JSON.stringify(doc, null, 2)], { type: "application/json" }));
    a.download = `${adv!.id.toLowerCase()}.openvex.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }

  return (
    <div className="min-h-dvh flex flex-col bg-wash">
      <header className="h-14 shrink-0 bg-navy text-white flex items-center gap-3 px-4 md:px-6">
        <NextLink href="/" className="flex items-center gap-2 font-extrabold text-[19px] tracking-tight" aria-label="Verdict home">
          <Mark /> <span className="max-[400px]:hidden">Verdict</span>
        </NextLink>
        <span className="hidden md:inline font-mono text-[12.5px] text-white/70">{adv.id}</span>
        <div className="flex-1" />
        <div className="flex gap-1.5">
          {OUTS.map((o) => (
            <button key={o.key} disabled={!ready} className={`btn !py-1.5 max-lg:!px-2.5 ${o.key === "statement" ? "bg-white text-navy hover:bg-white/90" : "bg-white/10 text-white hover:bg-white/20"}`} onClick={() => setSheet(o.key)} aria-label={o.label}>
              {o.icon} <span className="hidden lg:inline">{o.label}</span>
            </button>
          ))}
          <button disabled={!ready} className="btn !py-1.5 max-lg:!px-2.5 bg-white/10 text-white hover:bg-white/20" onClick={downloadVex} aria-label="Download OpenVEX">
            <Code02 size={16} /> <span className="hidden lg:inline">OpenVEX</span>
          </button>
        </div>
        <button className="btn !py-1.5 max-sm:!px-2.5 bg-white/10 text-white hover:bg-white/20" onClick={() => (setAdv(null), setProducts([]), setHits({}), setOverrides({}))} aria-label="Check another advisory">
          <ArrowLeft size={16} /> <span className="hidden sm:inline">Another</span>
        </button>
      </header>

      <div className="mx-auto w-full max-w-[1280px] px-4 md:px-6 py-6 grid lg:grid-cols-[380px_1fr] gap-6 items-start">
        <AdvisoryCard adv={adv} />

        <main className="min-w-0 space-y-4">
          <section className="bg-paper border border-line rounded-lg p-5">
            <p className="tag">The answer, as of {fmt(values.date)}</p>
            <h1 className="mt-1 font-extrabold text-[28px] md:text-[34px] leading-tight tracking-tight">{rows.length ? (ready ? answer(count, rows.length) : "Checking versions…") : "Add the products to check"}</h1>
            <div className="mt-3 flex flex-wrap gap-2">
              {STATUSES.map((s) => (count(s) ? <span key={s} className={`stamp ${TONE[s]}`}>{`${count(s)} ${STATUS_LABEL[s]}`}</span> : null))}
            </div>
          </section>

          {error ? (
            <p className="flex gap-2 rounded-lg bg-red-soft px-4 py-3 text-[13.5px]">
              <AlertTriangle size={16} className="shrink-0 mt-0.5 text-red" /> {error}
            </p>
          ) : null}

          {rows.map(({ product: p, verdict, pending, o }) => {
            const status = o.status ?? verdict.status;
            return (
              <article key={p.id} className="bg-paper border border-line rounded-lg">
                <div className="p-5 flex flex-wrap items-start gap-x-4 gap-y-2">
                  <div className="min-w-0 flex-1">
                    <input className="w-full font-extrabold text-[20px] tracking-tight outline-none rounded focus:bg-wash" value={p.name} onChange={(e) => setProducts((ps) => ps.map((x) => (x.id === p.id ? { ...x, name: e.target.value } : x)))} aria-label="Product name" />
                    <p className="font-mono text-[12px] text-muted truncate">
                      {p.source} · {p.packages.length} packages
                    </p>
                  </div>
                  <span className={`stamp ${pending ? "text-muted bg-wash" : TONE[status]}`}>{pending ? "Checking" : STATUS_LABEL[status]}</span>
                  <button className="text-faint hover:text-red p-1" onClick={() => setProducts((ps) => ps.filter((x) => x.id !== p.id))} aria-label={`Remove ${p.name}`}>
                    <Trash01 size={16} />
                  </button>
                </div>
                <div className="px-5 pb-5 grid md:grid-cols-[1fr_1fr] gap-4">
                  <div className="text-[14px]">
                    <p className="tag mb-1.5">What it ships</p>
                    {verdict.found.length ? (
                      verdict.found.map((f) => (
                        <p key={`${f.name}@${f.version}`} className="font-mono text-[13px]">
                          {f.name} {f.version} <span className={f.affected ? "text-red font-semibold" : "text-green"}>{f.affected ? "affected" : "not affected"}</span>
                        </p>
                      ))
                    ) : (
                      <p className="text-muted">None of {adv.packages.map((x) => x.name).join(", ")}.</p>
                    )}
                    {verdict.fixedIn && status === "affected" ? <p className="mt-1 text-[13.5px]">Fixed in <span className="font-mono font-semibold">{verdict.fixedIn}</span></p> : null}
                    {o.status && o.status !== verdict.status ? <p className="mt-1 text-[12.5px] text-amber">Changed from {STATUS_LABEL[verdict.status]} by hand.</p> : null}
                  </div>
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <label className="block">
                        <span className="tag">Status</span>
                        <select className="input mt-1 !py-1.5 !text-[13px]" value={status} onChange={(e) => setOverrides((x) => ({ ...x, [p.id]: { ...o, status: e.target.value as Status } }))}>
                          {STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {STATUS_LABEL[s]}
                            </option>
                          ))}
                        </select>
                      </label>
                      {status === "not_affected" ? (
                        <label className="block">
                          <span className="tag">Why</span>
                          <select className="input mt-1 !py-1.5 !text-[13px]" value={o.justification ?? verdict.justification ?? "vulnerable_code_not_present"} onChange={(e) => setOverrides((x) => ({ ...x, [p.id]: { ...o, justification: e.target.value as Justification } }))}>
                            {JUSTIFICATIONS.map((j) => (
                              <option key={j} value={j}>
                                {JUSTIFICATION_LABEL[j]}
                              </option>
                            ))}
                          </select>
                        </label>
                      ) : null}
                    </div>
                    <textarea
                      className="input !text-[13px] resize-none"
                      rows={2}
                      maxLength={300}
                      placeholder={status === "affected" ? "What customers should do (optional)" : "Anything to add (optional)"}
                      value={o.note ?? ""}
                      onChange={(e) => setOverrides((x) => ({ ...x, [p.id]: { ...o, note: e.target.value } }))}
                      aria-label={`Note for ${p.name}`}
                    />
                  </div>
                </div>
              </article>
            );
          })}

          <AddProducts
            busy={busy}
            add={(get, label) => run(label, async () => {
              const p = await get();
              setProducts((ps) => [...ps, p]);
            })}
          />

          <section className="bg-paper border border-line rounded-lg p-5">
            <p className="tag mb-3">On the statement</p>
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Company" value={meta.vendor} onChange={(v) => setMeta({ ...meta, vendor: v })} placeholder="Your company" />
              <Field label="Security contact" value={meta.contact} onChange={(v) => setMeta({ ...meta, contact: v })} placeholder="security@yourcompany.com" />
              <Field label="Signed by" value={meta.signer} onChange={(v) => setMeta({ ...meta, signer: v })} placeholder="Name, role" />
              <Field label="Customer (reply and letter)" value={meta.customer} onChange={(v) => setMeta({ ...meta, customer: v })} placeholder="Customer's company" />
            </div>
          </section>
        </main>
      </div>

      {sheet ? <Sheet out={sheet} setOut={setSheet} values={values} onClose={() => setSheet(null)} /> : null}
    </div>
  );
}

const answer = (count: (s: Status) => number, total: number) =>
  count("affected") ? `${count("affected")} of ${total} affected` : count("under_investigation") ? `${count("under_investigation")} under investigation` : total === 1 ? "Not affected" : `None of ${total} affected`;

/* ---------- start ---------- */

function Start({ busy, error, load, sample }: { busy: string | null; error: string | null; load: (id: string) => void; sample: () => void }) {
  const [id, setId] = useState("");
  return (
    <div className="min-h-dvh grid place-items-center p-4 md:p-8 bg-wash">
      <div className="w-full max-w-[640px] bg-paper border border-line rounded-xl overflow-hidden shadow-[0_30px_60px_-30px_rgb(19_41_75/0.35)]">
        <div className="bg-navy text-white px-6 md:px-8 py-4 flex items-center justify-between">
          <NextLink href="/" className="flex items-center gap-2 font-extrabold text-[19px]">
            <Mark /> Verdict
          </NextLink>
          <span className="tag !text-white/70">Security statement</span>
        </div>
        <div className="p-6 md:p-8">
          <h1 className="font-extrabold text-[32px] md:text-[38px] leading-[1.06] tracking-tight">Which advisory are customers asking about?</h1>
          <p className="mt-2 text-[15px] text-muted leading-relaxed">A CVE or GHSA id. Verdict reads it from the OSV database, then checks your products&apos; lockfiles against it.</p>
          <form
            className="mt-6 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (id.trim()) load(id.trim());
            }}
          >
            <input className="input font-mono" placeholder="CVE-2026-119348" value={id} onChange={(e) => setId(e.target.value)} aria-label="Advisory id" />
            <button className="btn btn-navy" disabled={!!busy}>
              Look up
            </button>
          </form>
          <div className="mt-3 flex flex-wrap gap-2">
            {QUICK.map((q) => (
              <button key={q.id} onClick={() => load(q.id)} className="text-left border border-line hover:border-navy rounded-md px-3 py-2 transition-colors">
                <span className="block font-mono text-[13px] font-semibold">{q.id}</span>
                <span className="block text-[12px] text-muted">{q.note}</span>
              </button>
            ))}
          </div>
          <button onClick={sample} className="mt-6 w-full text-left border-2 border-navy rounded-lg p-4 hover:bg-blue-soft transition-colors">
            <span className="block font-bold">Sample: our six apps vs CVE-2026-119348</span>
            <span className="block text-[13px] text-muted">The Next.js advisory of 19 Nov 2026 against the real lockfiles of the apps in this series, saved on 20 Nov.</span>
          </button>
          {busy ? <p className="mt-4 text-[13px] text-muted font-mono">Reading {busy}…</p> : null}
          {error ? (
            <p className="mt-4 text-[13px] text-red flex gap-2">
              <AlertTriangle size={16} className="shrink-0 mt-0.5" /> {error}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/* ---------- advisory ---------- */

function AdvisoryCard({ adv }: { adv: Advisory }) {
  return (
    <aside className="bg-paper border border-line rounded-lg overflow-hidden lg:sticky lg:top-6">
      <div className="bg-navy text-white px-5 py-4">
        <p className="font-mono text-[13px] text-white/70">{[adv.id, ...adv.aliases.slice(0, 2)].join(" · ")}</p>
        <p className="mt-1 font-bold text-[17px] leading-snug">{adv.summary}</p>
      </div>
      <dl className="px-5 py-4 grid grid-cols-[110px_1fr] gap-y-2 text-[13.5px]">
        <dt className="text-muted">Severity</dt>
        <dd className="font-semibold capitalize">{adv.severity?.toLowerCase() ?? "not rated"}</dd>
        <dt className="text-muted">Published</dt>
        <dd>{fmt(adv.published)}</dd>
        <dt className="text-muted">Updated</dt>
        <dd>{fmt(adv.modified)}</dd>
      </dl>
      <div className="px-5 pb-4">
        <p className="tag mb-2">Affected packages</p>
        {adv.packages.slice(0, 8).map((p) => (
          <div key={`${p.ecosystem}:${p.name}`} className="py-2 border-t border-line">
            <p className="font-mono text-[13px] font-semibold break-all">{p.name}</p>
            <p className="text-[12px] text-muted">{p.ecosystem}</p>
            {p.ranges.slice(0, 4).map((r, i) => (
              <p key={i} className="font-mono text-[12px] text-ink-2">
                {r.introduced && r.introduced !== "0" ? `from ${r.introduced} ` : "all versions "}
                {r.fixed ? `before ${r.fixed}` : r.last_affected ? `to ${r.last_affected}` : "(no fix yet)"}
              </p>
            ))}
          </div>
        ))}
        {adv.packages.length > 8 ? <p className="text-[12px] text-muted">+ {adv.packages.length - 8} more packages</p> : null}
      </div>
      {adv.details ? (
        <div className="px-5 pb-4">
          <p className="text-[13px] text-ink-2 leading-relaxed line-clamp-6">{adv.details}</p>
        </div>
      ) : null}
      {adv.links[0] ? (
        <a href={adv.links[0]} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-5 py-3 border-t border-line text-[13.5px] font-semibold text-navy hover:bg-wash">
          Read the advisory <LinkExternal01 size={14} />
        </a>
      ) : null}
    </aside>
  );
}

/* ---------- adding products ---------- */

function AddProducts({ busy, add }: { busy: string | null; add: (get: () => Promise<Product>, label: string) => void }) {
  const [repo, setRepo] = useState("");
  const file = useRef<HTMLInputElement>(null);
  return (
    <section className="border-2 border-dashed border-rule rounded-lg p-5">
      <p className="font-bold">Add a product</p>
      <p className="text-[13px] text-muted">A lockfile per product: package-lock.json, pnpm-lock.yaml, yarn.lock, or a CycloneDX JSON SBOM (any language).</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button className="btn btn-line" onClick={() => file.current?.click()}>
          <Upload01 size={16} /> Upload lockfiles
        </button>
        <form
          className="flex gap-2 flex-1 min-w-[260px]"
          onSubmit={(e) => {
            e.preventDefault();
            if (repo.trim()) add(() => fromGitHub(repo), repo.trim());
            setRepo("");
          }}
        >
          <input className="input font-mono !text-[13px]" placeholder="github.com/owner/repo" value={repo} onChange={(e) => setRepo(e.target.value)} aria-label="Public GitHub repository" />
          <button className="btn btn-navy" disabled={!!busy}>
            Add
          </button>
        </form>
      </div>
      <button className="mt-2 text-[13px] text-navy underline underline-offset-2" onClick={() => add(() => fromGitHub("shadcn-ui/taxonomy"), "shadcn-ui/taxonomy")}>
        Try an affected project: shadcn-ui/taxonomy (pins next 13.3.2-canary)
      </button>
      <input
        ref={file}
        type="file"
        multiple
        className="hidden"
        onChange={async (e) => {
          for (const f of [...(e.target.files ?? [])]) {
            const text = await f.text();
            add(async () => fromFile(f.name, text), f.name);
          }
        }}
      />
      {busy ? <p className="mt-2 text-[13px] text-muted font-mono">Reading {busy}…</p> : null}
    </section>
  );
}

/* ---------- outputs ---------- */

function Sheet({ out, setOut, values, onClose }: { out: Out; setOut: (o: Out) => void; values: ReturnType<typeof toValues>; onClose: () => void }) {
  const [view, setView] = useState<{ url?: string; html?: string; issues?: string[] } | null>(null);
  const key = JSON.stringify(values);
  useEffect(() => {
    let alive = true;
    const t = setTimeout(async () => {
      const res = await renderLocal({ method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ output: out, values }) });
      const type = res.headers.get("Content-Type") ?? "";
      const next = type.includes("json")
        ? await res.json().then((j) => (res.ok ? { html: j.html as string } : { issues: (j.diagnostics ?? [{ message: j.error }]).map((d: { message: string; path?: string }) => `${d.path ? `${d.path.replace(/^values\./, "")}: ` : ""}${d.message}`) }))
        : { url: URL.createObjectURL(await res.blob()) };
      if (!alive) return;
      setView((prev) => {
        if (prev?.url) URL.revokeObjectURL(prev.url);
        return next;
      });
    }, 150);
    return () => {
      alive = false;
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [out, key]);

  async function download() {
    const res = await renderLocal({ method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ output: out, values }) });
    if (!res.ok) return;
    const a = document.createElement("a");
    a.href = out === "letter" ? URL.createObjectURL(await res.blob()) : URL.createObjectURL(new Blob([(await res.json()).html], { type: "text/html" }));
    a.download = `${values.advisory.toLowerCase()}-${OUTS.find((o) => o.key === out)!.file}`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-navy/40" onClick={onClose}>
      <div className="w-full md:w-[min(1040px,94vw)] h-full bg-paper flex flex-col shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="h-14 shrink-0 border-b border-line flex items-center gap-1 sm:gap-2 px-3 sm:px-5">
          {OUTS.map((o) => (
            <button key={o.key} onClick={() => o.key !== out && (setOut(o.key), setView(null))} className={`px-3 py-1.5 rounded-md text-[13.5px] font-semibold ${out === o.key ? "bg-navy text-white" : "text-muted hover:text-ink"}`}>
              {o.label}
            </button>
          ))}
          <div className="flex-1" />
          <button className="btn btn-navy" onClick={() => void download()} aria-label="Download">
            <Download01 size={16} /> <span className="hidden sm:inline">Download</span>
          </button>
          <button className="text-muted hover:text-ink ml-1" onClick={onClose} aria-label="Close">
            <XClose size={20} />
          </button>
        </div>
        <div className="flex-1 min-h-0 bg-wash flex">
          {view?.issues ? (
            <div className="m-6 rounded-lg bg-red-soft p-4 space-y-1 self-start">
              <p className="font-bold text-red text-[14px]">The template refused these values</p>
              {view.issues.map((m) => (
                <p key={m} className="text-[13px]">
                  {m}
                </p>
              ))}
            </div>
          ) : view?.url ? (
            <iframe title="Statement letter" src={view.url} className="flex-1" />
          ) : view?.html ? (
            <iframe title={out === "statement" ? "Statement page" : "Customer reply"} srcDoc={view.html} className="flex-1 bg-white" />
          ) : (
            <p className="m-auto text-[14px] text-muted">Rendering with Hyper Elements…</p>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label className="block">
      <span className="tag">{label}</span>
      <input className="input mt-1 !py-1.5" value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}
