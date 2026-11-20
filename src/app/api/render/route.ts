// Renders a statement with the same Hyper Elements templates the CLI uses (templates/*.tsx).
// POST { output: "statement" | "reply" | "letter", values } -> { html, text } for the page and the email, a PDF for the letter.
// Values a template refuses come back as 422 with the template's own diagnostics.
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { createElement } from "react";
import { ElementsError, render } from "@hyper-elements/react";
import { renderPdf } from "@hyper-elements/react/pdf";
import Letter from "@templates/letter";
import Reply from "@templates/reply";
import Statement from "@templates/statement";

type Diagnostic = { severity: string; code: string; message: string; path?: string };

const FONT_FILES: Array<[string, string, number]> = [
  ...[400, 500, 600, 700, 800].map((w): [string, string, number] => ["Schibsted Grotesk", `SchibstedGrotesk-${w}.woff`, w]),
  ["JetBrains Mono", "JetBrainsMono-400.woff", 400],
  ["JetBrains Mono", "JetBrainsMono-600.woff", 600],
];
let fonts: Promise<Array<{ family: string; src: Buffer; weight: number }>> | undefined;
const loadFonts = () => (fonts ??= Promise.all(FONT_FILES.map(async ([family, file, weight]) => ({ family, weight, src: await readFile(join(process.cwd(), "fonts", file)) }))));

const brief = (list: readonly unknown[] = []): Diagnostic[] =>
  (list as Diagnostic[]).filter((d) => d.severity === "error" || d.severity === "warning").map(({ severity, code, message, path }) => ({ severity, code, message, path }));

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { output?: string; values?: Record<string, unknown> } | null;
  if (!body?.values || !["statement", "reply", "letter"].includes(body.output ?? "")) {
    return Response.json({ error: 'Send { output: "statement" | "reply" | "letter", values }' }, { status: 400 });
  }
  const { output, values } = body;
  try {
    if (output === "letter") {
      const { pdf } = await renderPdf(createElement(Letter as never, { ...values, format: "a4" }), { fonts: await loadFonts() });
      return new Response(new Uint8Array(pdf), { headers: { "Content-Type": "application/pdf" } });
    }
    const { html, text, diagnostics } = await render(createElement((output === "statement" ? Statement : Reply) as never, values));
    return Response.json({ html, text, diagnostics: brief(diagnostics) });
  } catch (e) {
    if (e instanceof ElementsError) return Response.json({ diagnostics: brief(e.diagnostics) }, { status: 422 });
    return Response.json({ error: (e as Error).message }, { status: 500 });
  }
}
