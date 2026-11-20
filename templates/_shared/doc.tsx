/**
 * What every Verdict template shares: the fields (one advisory, each product's VEX status), the bulletin look, and the
 * status stamp.
 */
import { Column, Text, defineTheme, prop } from "@hyper-elements/react";
import { formatDate } from "@hyper-elements/react/template";
import { JUSTIFICATIONS, JUSTIFICATION_LABEL, STATUSES, STATUS_LABEL, type Justification, type Status } from "./vex.ts";
import sample from "./example.ts";

export const fields = {
  vendor: prop.text({ label: "Company", required: true, maxLength: 60 }),
  contact: prop.text({ label: "Security contact", required: true, maxLength: 120, guidance: "An email address or a URL where customers reach you." }),
  date: prop.date({ label: "Statement date", required: true }),
  signer: prop.text({ label: "Signed by", maxLength: 80 }),
  customer: prop.text({ label: "Customer (email and letter)", maxLength: 80 }),
  advisory: prop.text({ label: "Advisory", required: true, maxLength: 40, pattern: "^[A-Z][A-Za-z]*-[\\w-]+$" }),
  aliases: prop.text({ label: "Also known as", maxLength: 200 }),
  summary: prop.text({ label: "Summary", required: true, maxLength: 220 }),
  details: prop.text({ label: "What it is", maxLength: 700 }),
  severity: prop.choice(["low", "moderate", "high", "critical", "unknown"], { label: "Severity", required: true }),
  published: prop.date({ label: "Advisory published", required: true }),
  link: prop.text({ label: "Advisory link", maxLength: 300, pattern: "^https://" }),
  products: prop.list(
    prop.object(
      {
        name: prop.text({ label: "Product", required: true, maxLength: 60 }),
        version: prop.text({ label: "Product version", maxLength: 30 }),
        status: prop.choice([...STATUSES], { label: "Status", required: true }),
        justification: prop.choice([...JUSTIFICATIONS], { label: "Why not affected" }),
        packages: prop.text({ label: "Package versions used", maxLength: 160 }),
        fixedIn: prop.text({ label: "Fixed in", maxLength: 30 }),
        note: prop.text({ label: "What customers should do / why", maxLength: 300 }),
      },
      { label: "Product" },
    ),
    { label: "Products", required: true, min: 1, max: 40 },
  ),
};

export type ProductV = { name: string; version?: string; status: Status; justification?: Justification; packages?: string; fixedIn?: string; note?: string };
export type Statement = {
  vendor: string;
  contact: string;
  date: string;
  signer?: string;
  customer?: string;
  advisory: string;
  aliases?: string;
  summary: string;
  details?: string;
  severity: "low" | "moderate" | "high" | "critical" | "unknown";
  published: string;
  link?: string;
  products: ProductV[];
};

/** The sample: CVE-2026-119348 against our own six apps, 20 Nov 2026. */
export const example = sample as unknown as Statement;

/* ---------- look: an official bulletin ---------- */

export const INK = "#14171D";
export const INK2 = "#3A404A";
export const MUTED = "#5E6571";
export const LINE = "#DFE3E8";
export const WASH = "#F3F5F8";
export const PAPER = "#FFFFFF";
export const NAVY = "#13294B";
export const RED = "#B3261E";
export const GREEN = "#1E6B45";
export const BLUE = "#1F4FA3";
export const AMBER = "#8A5A00";

export const SANS = "'Schibsted Grotesk', 'Helvetica Neue', Arial, sans-serif";
export const MONO = "'JetBrains Mono', Menlo, Consolas, monospace";

export const FONT_FILES = [400, 500, 600, 700, 800]
  .map((w) => ({ family: "Schibsted Grotesk", src: `../fonts/SchibstedGrotesk-${w}.woff`, weight: w }))
  .concat([400, 600].map((w) => ({ family: "JetBrains Mono", src: `../fonts/JetBrainsMono-${w}.woff`, weight: w })));
const CDN = "https://cdn.jsdelivr.net/npm/@fontsource";
export const FONT_URLS = [
  { family: "Schibsted Grotesk", src: `${CDN}/schibsted-grotesk@5.3.0/files/schibsted-grotesk-latin-400-normal.woff2`, weight: 400 },
  { family: "Schibsted Grotesk", src: `${CDN}/schibsted-grotesk@5.3.0/files/schibsted-grotesk-latin-700-normal.woff2`, weight: 700 },
  { family: "JetBrains Mono", src: `${CDN}/jetbrains-mono@5.3.0/files/jetbrains-mono-latin-400-normal.woff2`, weight: 400 },
];

export const theme = defineTheme({
  colors: { background: WASH, foreground: INK, primary: NAVY, primaryForeground: PAPER, muted: MUTED, border: LINE, paper: PAPER, navy: NAVY },
  fonts: { body: SANS, heading: SANS },
  fontSizes: { body: 16 },
  lineHeights: { body: 1.6 },
  elements: {
    Heading: { fontWeight: 800, letterSpacing: -0.5, lineHeight: 1.15, by: { level: { 1: { fontSize: 32, mobile: { fontSize: 26 } }, 2: { fontSize: 20 } } } },
    Link: { color: NAVY },
  },
  styles: {
    label: { fontFamily: MONO, fontSize: 12, letterSpacing: 0.6, textTransform: "uppercase", color: MUTED },
    sheet: { backgroundColor: PAPER, padding: 32, gap: 18, border: `1px solid ${LINE}` },
  },
});

/* ---------- helpers ---------- */

export const longDate = (iso: string) => formatDate(iso, "en-GB", { day: "numeric", month: "long", year: "numeric" });
export const statusLabel = (s: Status) => STATUS_LABEL[s];
export const statusColor = (s: Status) => (s === "affected" ? RED : s === "under_investigation" ? AMBER : s === "fixed" ? BLUE : GREEN);
export const why = (p: ProductV) =>
  p.status === "affected"
    ? p.note || (p.fixedIn ? `Upgrade to a release with ${p.packages?.split(" ")[0] ?? "the package"} ${p.fixedIn} or later.` : "We're preparing a fix.")
    : p.status === "fixed"
      ? p.note || `Uses ${p.packages ?? "a version"} which already contains the fix.`
      : p.status === "under_investigation"
        ? p.note || "We're checking and will update this statement."
        : p.note || JUSTIFICATION_LABEL[p.justification ?? "vulnerable_code_not_present"] + (p.packages ? ` (uses ${p.packages}).` : ".");
export const count = (s: Statement, st: Status) => s.products.filter((p) => p.status === st).length;
/** One line for the whole statement: the worst status wins. */
export const headline = (s: Statement) => {
  const a = count(s, "affected");
  const u = count(s, "under_investigation");
  if (a) return s.products.length === 1 ? `${s.products[0].name} is affected` : `${a} of ${s.products.length} products ${a === 1 ? "is" : "are"} affected`;
  if (u) return `${u} ${u === 1 ? "product is" : "products are"} under investigation`;
  return s.products.length === 1 ? `${s.products[0].name} is not affected` : `None of our ${s.products.length} products are affected`;
};
export const severityLabel = (s: Statement["severity"]) => (s === "unknown" ? "Severity not rated" : `${s[0].toUpperCase()}${s.slice(1)} severity`);

/** A stamp: the status in a ruled box, the way a bulletin marks it. Works in every root. */
export function Stamp({ status, size = 12 }: { status: Status; size?: number }) {
  return (
    <Column style={{ border: `1.5px solid ${statusColor(status)}`, padding: [3, 8] }}>
      <Text style={{ fontFamily: MONO, fontWeight: 600, fontSize: size, letterSpacing: 0.8, textTransform: "uppercase", color: statusColor(status), textAlign: "center" }}>{statusLabel(status)}</Text>
    </Column>
  );
}
