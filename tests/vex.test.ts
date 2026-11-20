import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { cmp, decide, openvex, readAdvisory, readLock, type Pkg } from "../templates/_shared/vex.ts";

const snap = JSON.parse(readFileSync(new URL("../public/samples/our-apps-2026-11-20.json", import.meta.url), "utf8"));
const adv = readAdvisory(snap.advisory);

test("lockfiles: npm v3 and v1, pnpm v6 and v9, yarn v1 and berry, CycloneDX", () => {
  const v = (file: string, text: string, name: string) => readLock(file, text).filter((p) => p.name === name).map((p) => p.version);
  assert.deepEqual(v("package-lock.json", JSON.stringify({ lockfileVersion: 3, packages: { "": { name: "app" }, "node_modules/next": { version: "16.4.6" }, "node_modules/a/node_modules/next": { version: "15.1.0" } } }), "next"), ["16.4.6", "15.1.0"]);
  assert.deepEqual(v("package-lock.json", JSON.stringify({ lockfileVersion: 1, dependencies: { next: { version: "13.5.1", dependencies: { "@next/env": { version: "13.5.1" } } } } }), "@next/env"), ["13.5.1"]);
  assert.deepEqual(v("pnpm-lock.yaml", "lockfileVersion: '6.0'\n\npackages:\n\n  /next@13.3.2-canary.13(react@18.2.0):\n    resolution: {}\n  /@babel/core@7.21.4:\n    dev: true\n", "next"), ["13.3.2-canary.13"]);
  assert.deepEqual(v("pnpm-lock.yaml", "lockfileVersion: '9.0'\n\npackages:\n\n  '@next/env@14.3.0':\n    resolution: {}\n\n  next@14.3.0-canary.57:\n    resolution: {}\n", "@next/env"), ["14.3.0"]);
  assert.deepEqual(v("yarn.lock", '# yarn lockfile v1\n\nnext@^16.0.0, next@^16.4.0:\n  version "16.4.6"\n  resolved "x"\n', "next"), ["16.4.6"]);
  assert.deepEqual(v("yarn.lock", '__metadata:\n  version: 8\n\n"@scope/pkg@npm:^2.0.0":\n  version: 2.1.0\n  resolution: "x"\n', "@scope/pkg"), ["2.1.0"]);
  const sbom = JSON.stringify({ bomFormat: "CycloneDX", components: [{ purl: "pkg:maven/org.apache.logging.log4j/log4j-core@2.14.1" }, { purl: "pkg:npm/%40next/env@16.4.6" }] });
  assert.deepEqual(readLock("bom.json", sbom).map((p) => `${p.ecosystem}:${p.name}@${p.version}`), ["Maven:org.apache.logging.log4j:log4j-core@2.14.1", "npm:@next/env@16.4.6"]);
});

test("the real advisory: a CVE id resolves to the GitHub advisory's packages", () => {
  assert.equal(adv.id, "CVE-2026-119348");
  assert.deepEqual(adv.aliases, ["GHSA-pc58-hwjq-p385"]);
  assert.deepEqual(adv.packages.map((p) => p.name), ["next"]);
  assert.match(adv.links[0], /security\/advisories\/GHSA-pc58/);
});

test("versions compare numerically, pre-releases before releases", () => {
  assert.ok(cmp("16.4.10", "16.4.5") > 0);
  assert.ok(cmp("13.3.2-canary.13", "13.3.2") < 0);
  assert.equal(cmp("1.0.0", "1.0.0"), 0);
});

test("verdicts: affected with the version to move to, fixed, not present", () => {
  const affectedVersions = new Set(["13.3.2-canary.13"]);
  const isAffected = (p: Pkg) => affectedVersions.has(p.version);
  const old = decide([{ ecosystem: "npm", name: "next", version: "13.3.2-canary.13" }], adv, isAffected);
  assert.deepEqual([old.status, old.fixedIn], ["affected", "15.5.29"]);
  assert.equal(decide([{ ecosystem: "npm", name: "next", version: "16.4.6" }], adv, isAffected).status, "fixed");
  assert.deepEqual(decide([{ ecosystem: "npm", name: "react", version: "19.3.0" }], adv, isAffected), { status: "not_affected", justification: "component_not_present", found: [] });
});

test("our six apps, frozen 20 Nov 2026: OSV found nothing for next 16.4.6, so every app is fixed", () => {
  assert.deepEqual(snap.hits["next@16.4.6"], []);
  for (const p of snap.products) assert.equal(decide(p.packages, adv, () => false).status, "fixed", p.name);
});

test("OpenVEX: not affected carries a justification, affected an action", () => {
  const doc = openvex(adv, [{ product: "Shop", status: "not_affected", justification: "component_not_present" }, { product: "Api", version: "2.1", status: "affected", action: "Upgrade to 2.2" }], "Sample Co", "2026-11-20T00:00:00Z");
  assert.equal(doc["@context"], "https://openvex.dev/ns/v0.2.0");
  assert.equal(doc.statements[0].justification, "component_not_present");
  assert.equal(doc.statements[1].action_statement, "Upgrade to 2.2");
  assert.deepEqual(doc.statements[1].products, [{ "@id": "Api@2.1" }]);
});
