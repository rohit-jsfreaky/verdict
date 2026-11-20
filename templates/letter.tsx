/**
 * The statement letter: an A4 PDF for enterprise customers, auditors and procurement. Formal, dated, signed, with each
 * product's status in the terms VEX uses.
 */
import { Column, Document, Heading, PageFooter, PageNumber, Row, Table, TableCell, TableRow, Text } from "@hyper-elements/react";
import { template } from "@hyper-elements/react/template";
import { JUSTIFICATION_LABEL } from "./_shared/vex.ts";
import { FONT_FILES, INK, INK2, LINE, MONO, MUTED, NAVY, PAPER, SANS, example, fields, headline, longDate, severityLabel, statusColor, statusLabel, why, type Statement } from "./_shared/doc.tsx";

const W = 682; // A4 at 96 px/in (794) less 56 px margins
const label = { fontFamily: MONO, fontSize: 8, fontWeight: 400, letterSpacing: 0.6, textTransform: "uppercase", color: MUTED } as const;

export default template({
  id: "verdict.Letter",
  version: "1.0.0",
  label: "Statement letter (PDF)",
  guidance: "For customers and auditors who need the answer signed and dated.",
  root: "Document",
  formats: { a4: { size: "A4", orientation: "portrait" } },
  fields,
  example,
  render(input) {
    const s = input as unknown as Statement;
    return (
      <Document size="A4" margin={56} title={`${s.vendor}: statement on ${s.advisory}`} lang="en" fonts={FONT_FILES} style={{ fontFamily: SANS, fontSize: 10.5, color: INK, gap: 14 }}>
        <Row style={{ backgroundColor: NAVY, padding: [10, 14], alignItems: "center" }}>
          <Column>
            <Text style={{ fontFamily: MONO, fontWeight: 600, fontSize: 9, letterSpacing: 1.2, color: PAPER }}>SECURITY STATEMENT</Text>
          </Column>
          <Column>
            <Text style={{ fontSize: 10, fontWeight: 700, color: PAPER, textAlign: "right" }}>{s.vendor}</Text>
          </Column>
        </Row>
        <Row>
          <Column style={{ gap: 2 }}>
            <Text style={label}>To</Text>
            <Text>{s.customer ?? "Whom it may concern"}</Text>
          </Column>
          <Column style={{ gap: 2 }}>
            <Text style={{ ...label, textAlign: "right" }}>Date</Text>
            <Text style={{ textAlign: "right" }}>{longDate(s.date)}</Text>
          </Column>
        </Row>
        <Heading level={1} style={{ fontWeight: 800, fontSize: 24, lineHeight: 1.2, letterSpacing: -0.4 }}>
          {s.advisory}: {headline(s).toLowerCase()}
        </Heading>
        <Text style={{ lineHeight: 1.6, color: INK2 }}>
          {`This letter states whether ${s.vendor}'s products are affected by ${s.advisory}${s.aliases ? ` (also ${s.aliases})` : ""}, "${s.summary.replace(/\.$/, "")}", published on ${longDate(s.published)} (${severityLabel(s.severity).toLowerCase()}). Each product was checked against the advisory's affected versions on ${longDate(s.date)}, using the exact package versions it ships.`}
        </Text>

        <Table style={{ width: W, cellPadding: [7, 7], rowBorder: { width: 0.5, style: "solid", color: LINE }, border: { width: 0.75, style: "solid", color: LINE } }}>
          <TableRow header>
            <TableCell style={{ ...label, width: 130 }}>Product</TableCell>
            <TableCell style={{ ...label, width: 110 }}>Status</TableCell>
            <TableCell style={{ ...label, width: 120 }}>Package used</TableCell>
            <TableCell style={label}>Statement</TableCell>
          </TableRow>
          {s.products.map((p) => (
            <TableRow key={p.name}>
              <TableCell style={{ fontWeight: 700, fontSize: 10, verticalAlign: "top" }}>
                {p.name}
                {p.version ? ` ${p.version}` : ""}
              </TableCell>
              <TableCell style={{ fontFamily: MONO, fontWeight: 600, fontSize: 8.5, textTransform: "uppercase", color: statusColor(p.status), verticalAlign: "top" }}>{statusLabel(p.status)}</TableCell>
              <TableCell style={{ fontFamily: MONO, fontSize: 8.5, color: INK2, verticalAlign: "top" }}>{p.packages ?? "Not used"}</TableCell>
              <TableCell style={{ fontSize: 9.5, verticalAlign: "top" }}>
                {p.status === "not_affected" && p.justification ? `${JUSTIFICATION_LABEL[p.justification]}. ` : ""}
                {p.status === "not_affected" ? (p.note ?? "") : why(p)}
              </TableCell>
            </TableRow>
          ))}
        </Table>

        <Column style={{ gap: 6, padding: [12, 14], border: `0.75px solid ${LINE}` }}>
          <Text style={label}>How this was checked</Text>
          <Text style={{ fontSize: 9.5, lineHeight: 1.55, color: INK2 }}>
            The package versions each product ships were read from its lockfile and compared with the advisory&apos;s affected ranges in the OSV database
            (osv.dev). Statuses follow the VEX terms: affected, fixed (the version shipped contains the fix), not affected (with the reason), under
            investigation.
          </Text>
        </Column>

        <Text style={{ lineHeight: 1.6 }}>We will notify you if any status changes. Questions to {s.contact}.</Text>
        <Column style={{ gap: 2, padding: [16, 0, 0] }}>
          <Text style={{ fontWeight: 700 }}>{s.signer ?? `${s.vendor} security`}</Text>
          <Text style={{ color: MUTED }}>{s.vendor}</Text>
        </Column>
        {s.link ? <Text style={{ fontSize: 8.5, color: MUTED }}>Advisory: {s.link}</Text> : null}

        <PageFooter style={{ padding: [10, 0, 0], border: { top: `0.75px solid ${LINE}` } }}>
          <Row>
            <Column>
              <Text style={{ fontSize: 7.5, color: MUTED }}>
                {s.vendor} · statement on {s.advisory} · {longDate(s.date)}
              </Text>
            </Column>
            <Column>
              <Text style={{ fontSize: 7.5, color: MUTED, textAlign: "right" }}>
                Page <PageNumber /> of <PageNumber total />
              </Text>
            </Column>
          </Row>
        </PageFooter>
      </Document>
    );
  },
});
