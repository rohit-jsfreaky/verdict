import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, ArrowUpRight, Code02, FileCheck02, Globe02, Mail01 } from "@untitledui/icons";
import { Mark } from "@/components/Mark";

const WRAP = "mx-auto max-w-[1200px] px-6";

export default function Home() {
  return (
    <div className="bg-paper text-ink">
      <Nav />
      <Hero />
      <Why />
      <Example />
      <How />
      <Outputs />
      <Vex />
      <Faq />
      <Close />
    </div>
  );
}

function Nav() {
  return (
    <header className="sticky top-0 z-30 bg-navy text-white">
      <div className={`${WRAP} h-16 flex items-center gap-4 md:gap-8`}>
        <Link href="/" className="flex items-center gap-2 font-extrabold text-[20px] tracking-tight">
          <Mark /> Verdict
        </Link>
        <nav className="hidden md:flex gap-6 text-[14px] font-medium text-white/70">
          <a href="#why" className="hover:text-white">Why</a>
          <a href="#example" className="hover:text-white">Example</a>
          <a href="#how" className="hover:text-white">How it works</a>
          <a href="#outputs" className="hover:text-white">What you publish</a>
          <a href="#faq" className="hover:text-white">FAQ</a>
        </nav>
        <div className="flex-1" />
        <Link href="/check" className="btn bg-white text-navy hover:bg-white/90">
          <span className="hidden sm:inline">Check an advisory</span>
          <span className="sm:hidden">Start</span> <ArrowRight size={16} />
        </Link>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="border-b border-line bg-wash">
      <div className={`${WRAP} pt-16 md:pt-24`}>
        <p className="tag">For software vendors, the day an advisory makes news</p>
        <h1 className="mt-5 font-extrabold text-[48px] md:text-[84px] leading-[0.98] tracking-[-0.035em] max-w-[980px]">
          &ldquo;Are you affected?&rdquo; <span className="text-navy-2">Answered and published.</span>
        </h1>
        <div className="mt-8 grid md:grid-cols-[1fr_auto] gap-8 items-end">
          <p className="text-[18px] md:text-[19px] leading-relaxed text-ink-2 max-w-[620px]">
            Paste a CVE or GHSA id. Verdict checks every product&apos;s lockfile against the advisory, gives each one a status, and writes the security statement page, the reply to customers, the signed letter and an OpenVEX file.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/check" className="btn btn-navy !px-5 !py-3 !text-[15px]">
              Check an advisory <ArrowRight size={17} />
            </Link>
            <a href="/landing/statement-letter.pdf" className="btn btn-line !px-5 !py-3 !text-[15px]">
              Sample letter (PDF)
            </a>
          </div>
        </div>
        <figure className="mt-12 rounded-t-xl border border-b-0 border-rule bg-paper p-2 pb-0 shadow-[0_-24px_60px_-34px_rgb(19_41_75/0.45)]">
          <Image src="/landing/desk.png" alt="Verdict checking the Next.js advisory CVE-2026-119348 against six apps' lockfiles: every app fixed" width={1440} height={900} priority className="w-full h-auto rounded-t-lg" />
        </figure>
      </div>
    </section>
  );
}

const LABELS = [
  ["Vulnerable", "text-red"],
  ["Fix", "text-blue"],
  ["Workaround", "text-amber"],
  ["Not vuln", "text-green"],
  ["Investigation", "text-muted"],
];

function Why() {
  return (
    <section id="why" className="border-b border-line">
      <div className={`${WRAP} py-20 md:py-28 grid md:grid-cols-[1.1fr_1fr] gap-12 items-start`}>
        <Head n="01" eyebrow="Why" title="Every customer asks. Every vendor has to answer.">
          When Log4Shell broke in December 2021, the Dutch national cyber security centre kept a public list of every vendor&apos;s answer, so customers wouldn&apos;t have to hunt for them one by one. It grew to thousands of products, each with a status and a link to the vendor&apos;s own statement.
        </Head>
        <div className="bg-wash border border-line rounded-xl p-6">
          <p className="tag">The labels on that list</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {LABELS.map(([l, tone]) => (
              <span key={l} className={`stamp bg-paper ${tone}`}>
                {l}
              </span>
            ))}
          </div>
          <p className="mt-5 text-[15px] text-ink-2 leading-relaxed">
            Each one links to a statement a vendor had to write, check and publish, then answer the same question again in every customer&apos;s inbox.
          </p>
          <a className="mt-4 inline-flex items-center gap-1 text-[14px] font-semibold text-navy underline underline-offset-2" href="https://github.com/NCSC-NL/log4shell">
            NCSC-NL/log4shell on GitHub <ArrowUpRight size={14} />
          </a>
        </div>
      </div>
    </section>
  );
}

const ROWS = [
  ["Sundown, Fineprint, Plainspeed, Owed, Columnist, Runway", "next 16.4.6", "Fixed", "text-blue bg-blue-soft", "16.4.6 already contains the fix (16.4.5)"],
  ["shadcn-ui/taxonomy", "next 13.3.2-canary.13", "Affected", "text-red bg-red-soft", "Fixed in 15.5.29"],
  ["steven-tey/precedent", "next 14.3.0-canary.57", "Affected", "text-red bg-red-soft", "Fixed in 15.5.29"],
];

function Example() {
  return (
    <section id="example" className="border-b border-line bg-wash">
      <div className={`${WRAP} py-20 md:py-28`}>
        <Head n="02" eyebrow="A real example" title="Next.js, 19 November 2026.">
          On 19 November 2026 Next.js published CVE-2026-119348: cross-client response injection in self-hosted apps. Affected: <code className="font-mono text-[15px]">16.0.0</code> up to <code className="font-mono text-[15px]">16.4.5</code>, and everything before <code className="font-mono text-[15px]">15.5.29</code>. Here is what Verdict found in real lockfiles on 20 November.
        </Head>
        <div className="mt-12 bg-paper border border-line rounded-xl overflow-x-auto">
          <div className="min-w-[760px]">
            <div className="grid grid-cols-[1.4fr_1fr_140px_1.2fr] gap-4 px-6 py-3 tag border-b border-line">
              <span>Project</span>
              <span>Ships</span>
              <span>Status</span>
              <span>Why</span>
            </div>
            {ROWS.map(([p, v, s, tone, why]) => (
              <div key={p} className="grid grid-cols-[1.4fr_1fr_140px_1.2fr] gap-4 px-6 py-4 border-b border-line last:border-0 items-center">
                <span className="font-bold text-[15px]">{p}</span>
                <span className="font-mono text-[13.5px]">{v}</span>
                <span className={`stamp justify-self-start ${tone}`}>{s}</span>
                <span className="text-[14.5px] text-ink-2">{why}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="mt-4 text-[13px] text-muted">
          The first row is this series&apos; own apps. taxonomy and precedent are public open-source projects, read from their pnpm-lock.yaml; versions checked with OSV.
        </p>
      </div>
    </section>
  );
}

function How() {
  const steps = [
    ["Look up", "Paste a CVE or GHSA id. Verdict reads the advisory from OSV: the affected packages, their version ranges, the severity and the fix."],
    ["Add products", "One lockfile per product: package-lock.json, pnpm-lock.yaml, yarn.lock, or a CycloneDX SBOM for any language. Or a public GitHub repository."],
    ["Decide", "OSV checks the exact versions each product ships. Each product gets a status; change it by hand and say why when you know more."],
    ["Publish", "Download the statement page, the reply for customers, the signed letter, and OpenVEX for the tools that read it."],
  ];
  return (
    <section id="how" className="border-b border-line">
      <div className={`${WRAP} py-20 md:py-28`}>
        <Head n="03" eyebrow="How it works" title="From an advisory id to a published answer." />
        <ol className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {steps.map(([t, d], i) => (
            <li key={t} className="border border-line rounded-xl p-6">
              <span className="font-mono text-[12px] text-navy font-semibold">STEP {i + 1}</span>
              <h3 className="mt-3 font-extrabold text-[22px] tracking-tight">{t}</h3>
              <p className="mt-2 text-[15px] text-ink-2 leading-relaxed">{d}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function Outputs() {
  return (
    <section id="outputs" className="border-b border-line bg-wash">
      <div className={`${WRAP} py-20 md:py-28`}>
        <Head n="04" eyebrow="What you publish" title="One answer, in every form it's asked for.">
          Rendered by shared Hyper Elements templates, in the app or from the command line.
        </Head>
        <div className="mt-12 grid md:grid-cols-12 gap-4">
          <Tile className="md:col-span-7" icon={<Globe02 size={17} />} name="The statement page" note="A web page for your trust centre or support site">
            <div className="overflow-hidden rounded-lg border border-line">
              <Image src="/landing/statement.png" alt="Security statement page: none of our 6 products are affected" width={1185} height={1111} className="w-full h-auto" />
            </div>
          </Tile>
          <Tile className="md:col-span-5" icon={<FileCheck02 size={17} />} name="The letter" note="A4 PDF, dated and signed, for procurement and auditors">
            <Image src="/landing/letter.png" alt="Statement letter: each product's status, how it was checked, signature" width={1241} height={1754} className="w-full h-auto rounded-lg border border-line" />
          </Tile>
          <Tile className="md:col-span-7" icon={<Mail01 size={17} />} name="The customer reply" note="The email answer to &ldquo;are you affected?&rdquo;">
            <div className="h-[300px] overflow-hidden rounded-lg border border-line bg-wash">
              <Image src="/landing/reply.png" alt="Reply email: each product's status" width={745} height={1039} className="w-full h-auto" />
            </div>
          </Tile>
          <Tile className="md:col-span-5" icon={<Code02 size={17} />} name="OpenVEX" note="The same answer for scanners and security tools">
            <pre className="h-[300px] overflow-auto rounded-lg border border-line bg-ink text-[#dbe4f3] p-4 font-mono text-[12px] leading-relaxed scroll-thin">{`{
  "@context": "https://openvex.dev/ns/v0.2.0",
  "author": "rohit-jsfreaky",
  "timestamp": "2026-11-20T00:00:00Z",
  "statements": [
    {
      "vulnerability": {
        "name": "CVE-2026-119348",
        "aliases": ["GHSA-pc58-hwjq-p385"]
      },
      "products": [{ "@id": "Runway@0.1.0" }],
      "status": "fixed"
    }
  ]
}`}</pre>
          </Tile>
        </div>
      </div>
    </section>
  );
}

function Tile({ className = "", icon, name, note, children }: { className?: string; icon: ReactNode; name: string; note: string; children: ReactNode }) {
  return (
    <div className={`min-w-0 bg-paper border border-line rounded-xl p-5 md:p-6 flex flex-col gap-5 ${className}`}>
      <div className="flex items-center gap-3">
        <span className="grid place-items-center size-9 rounded-lg bg-navy text-white">{icon}</span>
        <div>
          <p className="font-extrabold text-[18px] leading-tight">{name}</p>
          <p className="text-[12.5px] text-muted">{note}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

const STATUSES = [
  ["Affected", "text-red bg-red-soft", "The product ships a vulnerable version. The statement says which version fixes it and what customers should do."],
  ["Fixed", "text-blue bg-blue-soft", "The version shipped already contains the fix."],
  ["Not affected", "text-green bg-green-soft", "With the reason: the package isn't used, the version never had the bug, the code is never run, or it can't be reached."],
  ["Under investigation", "text-amber bg-amber-soft", "Still checking. The page says so, and gets updated."],
];

function Vex() {
  return (
    <section className="border-b border-line">
      <div className={`${WRAP} py-20 md:py-28 grid md:grid-cols-[1fr_1.2fr] gap-12 items-start`}>
        <Head n="05" eyebrow="The standard" title="Statuses in the words the industry uses.">
          Verdict uses the four statuses and five reasons of VEX (Vulnerability Exploitability eXchange), the format CISA promotes for exactly this answer, so the page a person reads and the file a scanner reads say the same thing.
        </Head>
        <div className="border border-line rounded-xl overflow-hidden">
          {STATUSES.map(([s, tone, d]) => (
            <div key={s} className="grid grid-cols-[170px_1fr] gap-4 px-5 py-4 border-b border-line last:border-0 items-start">
              <span className={`stamp justify-self-start ${tone}`}>{s}</span>
              <span className="text-[14.5px] text-ink-2 leading-relaxed">{d}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const FAQ = [
  ["Where does the advisory come from?", "OSV (osv.dev), Google's open database of vulnerabilities, which brings together GitHub's advisories, PyPI, Go, crates.io, Maven and many more. A CVE id is matched to the GitHub advisory that lists the affected packages."],
  ["How does it decide if a product is affected?", "It reads the exact versions from the product's lockfile and asks OSV whether those versions are affected by this advisory. OSV does the version-range matching for each ecosystem, including canary and pre-release versions."],
  ["Is my lockfile uploaded?", "Your lockfile is read in your browser. Only the names and versions of the advisory's packages go to OSV to be checked. When you render a document, the statement's text goes to the app's render route and nothing is stored."],
  ["What if a package is affected but we don't use the vulnerable part?", "Change the status to Not affected and pick the reason: the vulnerable code is never run, or it can't be reached by an attacker. The statement and the OpenVEX file both carry it."],
  ["What about languages other than JavaScript?", "Export a CycloneDX SBOM (most build tools and scanners can) and upload it. Verdict reads Maven, PyPI, Go, RubyGems, crates.io, NuGet, Packagist and more from it."],
  ["Is a lockfile check enough?", "It's the first, fast answer: which versions you ship. A status of Affected on the page is honest and specific; your engineers decide the rest, and you update the statement when you do."],
  ["Can I run it in CI?", "The outputs are Hyper Elements templates. npm run statement renders the page, the email and the letter from a JSON file with the Hyper Elements command line tool."],
] as const;

function Faq() {
  return (
    <section id="faq" className="border-b border-line bg-wash">
      <div className={`${WRAP} py-20 md:py-28 grid md:grid-cols-[360px_1fr] gap-12`}>
        <div className="md:sticky md:top-28 self-start">
          <Head n="06" eyebrow="FAQ" title="Before you publish." />
        </div>
        <div className="bg-paper border border-line rounded-xl px-6">
          {FAQ.map(([q, a]) => (
            <details key={q} className="group border-b border-line last:border-0">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 font-bold text-[18px]">
                {q}
                <span className="grid place-items-center size-8 shrink-0 rounded-full bg-navy text-white text-[17px] transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="pb-6 pr-12 text-[15.5px] text-ink-2 leading-relaxed">{a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function Close() {
  return (
    <>
      <section className="bg-navy text-white">
        <div className={`${WRAP} py-20 md:py-24 grid md:grid-cols-[1fr_auto] gap-8 items-end`}>
          <div>
            <h2 className="font-extrabold text-[40px] md:text-[64px] leading-[0.98] tracking-[-0.03em] max-w-[760px]">Answer once. Publish everywhere.</h2>
            <p className="mt-4 text-[17px] text-white/70 max-w-[520px]">Try it on the Next.js advisory of 19 November, or paste your own.</p>
          </div>
          <Link href="/check" className="btn bg-white text-navy hover:bg-white/90 !px-6 !py-3.5 !text-[15px]">
            Check an advisory <ArrowRight size={17} />
          </Link>
        </div>
      </section>
      <footer className={`${WRAP} py-10 flex flex-col md:flex-row gap-3 justify-between text-[13px] text-muted`}>
        <span className="flex items-center gap-2 font-extrabold text-[18px] text-ink">
          <Mark size={22} /> Verdict
        </span>
        <p className="max-w-[720px] md:text-right">
          Built with{" "}
          <a className="underline underline-offset-2 hover:text-ink inline-flex items-center gap-0.5" href="https://github.com/hyper-elements/hyper-elements">
            Hyper Elements <ArrowUpRight size={12} />
          </a>
          . Advisories and version checks from OSV. Not affiliated with Next.js, OSV, NCSC-NL or any project shown; Northwind Labs in the sample is made up.
        </p>
      </footer>
    </>
  );
}

function Head({ n, eyebrow, title, children }: { n: string; eyebrow: string; title: string; children?: ReactNode }) {
  return (
    <div className="max-w-[780px]">
      <p className="tag">
        <span className="text-navy font-semibold">{n}</span> · {eyebrow}
      </p>
      <h2 className="mt-4 font-extrabold text-[36px] md:text-[52px] leading-[1.03] tracking-[-0.03em]">{title}</h2>
      {children ? <p className="mt-5 text-[17px] leading-relaxed text-ink-2">{children}</p> : null}
    </div>
  );
}
