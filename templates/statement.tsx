/**
 * The security statement: the public page a vendor links from its status page, trust centre or support site when an
 * advisory makes news. The answer first, then each product's status, then what the advisory is.
 */
import { Column, Heading, Link, Page, Row, Section, Table, TableCell, TableRow, Text, token } from "@hyper-elements/react";
import { lint } from "@hyper-elements/lint";
import { template } from "@hyper-elements/react/template";
import { FONT_URLS, MONO, NAVY, PAPER, example, fields, headline, longDate, severityLabel, statusColor, statusLabel, theme, why, type Statement } from "./_shared/doc.tsx";

const LABEL = { fontFamily: MONO, fontSize: 12, letterSpacing: 0.6, textTransform: "uppercase", color: "#5E6571" } as const;
const contactLink = (c: string) => (c.includes("@") ? `mailto:${c}` : c.startsWith("http") ? c : `https://${c}`);

export default template({
  id: "verdict.Statement",
  version: "1.0.0",
  label: "Security statement (web page)",
  guidance: "Publish it at a stable URL and update it as the status changes; the date shows when it was last true.",
  root: "Page",
  fields,
  rules: { plugins: { lint: lint() }, require: { lint: ["lang", "contrast", "link-text"] } },
  example,
  render(input) {
    const s = input as unknown as Statement;
    return (
      <Page theme={theme} lang="en" width={880} fonts={FONT_URLS} title={`${s.advisory}: security statement · ${s.vendor}`} description={`${s.vendor}'s statement on ${s.advisory}: ${headline(s)}.`} style={{ gap: 0 }}>
        <Section style={{ backgroundColor: NAVY, padding: [14, 24], mobile: { padding: [12, 16] } }}>
          <Text style={{ ...LABEL, color: PAPER }}>Security statement · {s.vendor}</Text>
        </Section>
        <Section style={{ backgroundColor: token("colors.paper"), padding: [48, 24, 36], gap: 14, border: { bottom: { width: 1, style: "solid", color: token("colors.border") } }, mobile: { padding: [32, 16, 24] } }}>
          <Text style={LABEL}>
            {s.advisory}
            {s.aliases ? ` · ${s.aliases}` : ""}
          </Text>
          <Heading level={1} style={{ fontSize: 42, mobile: { fontSize: 30 } }}>
            {headline(s)}
          </Heading>
          <Text style={{ fontSize: 18, color: token("colors.muted") }}>{s.summary}</Text>
          <Text style={{ fontSize: 14, color: token("colors.muted") }}>
            Updated {longDate(s.date)} · advisory published {longDate(s.published)} · {severityLabel(s.severity)}
          </Text>
        </Section>

        <Section style={{ padding: [36, 24], gap: 14, mobile: { padding: [24, 16] } }}>
          <Heading level={2}>Our products</Heading>
          <Table style={{ backgroundColor: token("colors.paper"), cellPadding: [12, 14], rowBorder: { width: 1, style: "solid", color: token("colors.border") }, border: { width: 1, style: "solid", color: token("colors.border") } }}>
            <TableRow header>
              <TableCell style={{ ...LABEL, width: 200 }}>Product</TableCell>
              <TableCell style={{ ...LABEL, width: 170 }}>Status</TableCell>
              <TableCell style={LABEL}>Details</TableCell>
            </TableRow>
            {s.products.map((p) => (
              <TableRow key={p.name}>
                <TableCell style={{ fontWeight: 700, verticalAlign: "top" }}>
                  {p.name}
                  {p.version ? ` ${p.version}` : ""}
                </TableCell>
                <TableCell style={{ fontFamily: MONO, fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, color: statusColor(p.status), verticalAlign: "top" }}>{statusLabel(p.status)}</TableCell>
                <TableCell style={{ fontSize: 15, verticalAlign: "top" }}>{why(p)}</TableCell>
              </TableRow>
            ))}
          </Table>
        </Section>

        <Section style={{ padding: [0, 24, 36], gap: 10, mobile: { padding: [0, 16, 24] } }}>
          <Heading level={2}>About the advisory</Heading>
          <Text>{s.details ?? s.summary}</Text>
          {s.link ? (
            <Text>
              Read the advisory: <Link href={s.link}>{s.advisory} advisory details</Link>
            </Text>
          ) : null}
        </Section>

        <Section style={{ backgroundColor: token("colors.paper"), padding: [28, 24, 48], border: { top: { width: 1, style: "solid", color: token("colors.border") } }, mobile: { padding: [20, 16, 32] } }}>
          <Row>
            <Column>
              <Text style={{ fontSize: 14 }}>
                Questions: <Link href={contactLink(s.contact)}>contact {s.vendor} security</Link>. We update this page when a status changes.
              </Text>
            </Column>
          </Row>
        </Section>
      </Page>
    );
  },
});
