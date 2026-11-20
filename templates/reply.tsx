/**
 * The reply to a customer who asks "are you affected?": the answer first, each product's status, and where the
 * statement lives.
 */
import { Column, Email, Heading, Row, Section, Text, token } from "@hyper-elements/react";
import { lint } from "@hyper-elements/lint";
import { template } from "@hyper-elements/react/template";
import { FONT_URLS, MONO, example, fields, headline, longDate, statusColor, statusLabel, theme, why, type Statement } from "./_shared/doc.tsx";

const LABEL = { fontFamily: MONO, fontSize: 12, letterSpacing: 0.6, textTransform: "uppercase", color: "#5E6571" } as const;

export default template({
  id: "verdict.Reply",
  version: "1.0.0",
  label: "Customer reply (email)",
  guidance: "Answer customers who ask. Attach the letter if they need it on paper.",
  root: "Email",
  fields,
  rules: { plugins: { lint: lint() }, require: { lint: ["lang", "contrast", "link-text"] }, root: { previewText: true } },
  example,
  render(input) {
    const s = input as unknown as Statement;
    return (
      <Email theme={theme} lang="en" width={600} fonts={FONT_URLS} title={`${s.advisory}: ${headline(s)}`} previewText={`${headline(s)}. Each product's status inside.`} style={{ gap: 0 }}>
        <Section style={{ padding: [28, 24, 14] }}>
          <Text style={LABEL}>Security · {s.vendor}</Text>
        </Section>
        <Column style={{ apply: ["sheet"] }}>
          <Heading level={1}>
            {s.advisory}: {headline(s).toLowerCase()}
          </Heading>
          <Text>
            {s.customer ? `Hello ${s.customer} team,` : "Hello,"}
          </Text>
          <Text>
            {`Thank you for asking about ${s.advisory}${s.aliases ? ` (${s.aliases})` : ""}, ${s.summary.replace(/\.$/, "")}. We checked every product against the advisory on ${longDate(s.date)}:`}
          </Text>
          <Column style={{ gap: 0 }}>
            {s.products.map((p) => (
              <Column key={p.name} style={{ gap: 2, padding: [12, 0], border: { top: { width: 1, style: "solid", color: token("colors.border") } } }}>
                <Row>
                  <Column>
                    <Text style={{ fontWeight: 700 }}>{p.name}</Text>
                  </Column>
                  <Column style={{ width: 200 }}>
                    <Text style={{ fontFamily: MONO, fontSize: 13, fontWeight: 600, textTransform: "uppercase", textAlign: "right", color: statusColor(p.status) }}>{statusLabel(p.status)}</Text>
                  </Column>
                </Row>
                <Text style={{ fontSize: 14, color: token("colors.muted") }}>{why(p)}</Text>
              </Column>
            ))}
          </Column>
          <Text style={{ fontSize: 15, color: token("colors.muted") }}>
            We&apos;ll write again if anything changes. For the record, our published statement and a signed letter are available on request from {s.contact}.
          </Text>
          <Text>{s.signer ?? `${s.vendor} security`}</Text>
        </Column>
        <Section style={{ padding: [20, 24, 32] }}>
          <Text style={{ fontSize: 14, color: token("colors.muted") }}>{s.link ? `Advisory: ${s.link}` : `Advisory ${s.advisory}`}</Text>
        </Section>
      </Email>
    );
  },
});
