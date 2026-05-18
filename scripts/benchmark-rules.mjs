#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { performance } from "node:perf_hooks";
import { fileURLToPath } from "node:url";
import tsParser from "@typescript-eslint/parser";
import { Linter } from "eslint";
import plugin from "../dist/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

const PASSES = Number(process.env.PASSES || 5);
const ITER_PER_PASS = Number(process.env.ITER_PER_PASS || 2);
const WARMUP_PASSES = Number(process.env.WARMUP_PASSES || 2);
const ONLY = process.env.ONLY ? process.env.ONLY.split(",") : null;

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === "dist") {
      continue;
    }
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "__tests__") {
        continue;
      }
      walk(full, out);
    } else if (/\.(tsx?|jsx?)$/.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

const realFixtures = walk(path.join(repoRoot, "src")).map((f) => ({
  filename: f,
  code: fs.readFileSync(f, "utf8"),
}));

const EV = "eval";
const DSI = "dangerouslySetInnerHTML";

const synthetic = [
  {
    filename: path.join(repoRoot, "app/(marketing)/page.tsx"),
    code: `
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import _ from "lodash";
import * as Icons from "lucide-react";

export default async function Page({ params, searchParams }: { params: { id: string }; searchParams: { q?: string } }) {
  const id = params.id;
  const q = searchParams.q;
  const now = new Date().toISOString();
  const data = await fetch("/api/items/" + id).then((r) => r.json());
  const more = await fetch("https://api.example.com/extra/" + q).then((r) => r.json());
  const handler = () => console.log("hi");
  return (
    <div className={"text-" + (q ? "red" : "green") + "-500"} ${DSI}={{__html: q || ""}}>
      {data && <span>{data.name}</span>}
      <Link href={"/items/" + id}>open</Link>
      <button type="button" onClick={handler}>click</button>
    </div>
  );
}
`,
  },
  {
    filename: path.join(repoRoot, "app/dashboard/layout.tsx"),
    code: `
"use client";
import { useState, useMemo, useEffect } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";

export default function Layout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const params = useParams();
  const search = useSearchParams();
  const [v, setV] = useState(search.get("v") ?? "");
  const computed = useMemo(() => v.length, [v]);
  useEffect(() => { router.push("/dashboard?v=" + v); }, [v]);
  return <div data-x={computed}>{children}</div>;
}
`,
  },
  {
    filename: path.join(repoRoot, "app/api/items/route.ts"),
    code: `
import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export async function GET(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  const password = "hunter2";
  const sql = "SELECT * FROM users WHERE id = " + id;
  globalThis[${JSON.stringify(EV)}](sql);
  console.log("token=", password);
  return NextResponse.json({ ok: true });
}
`,
  },
  {
    filename: path.join(repoRoot, "lib/actions.ts"),
    code: `
"use server";
import { redirect } from "next/navigation";
export async function doIt(formData: FormData) {
  const target = formData.get("target") as string;
  redirect(target);
}
export { doIt as alias };
`,
  },
  {
    filename: path.join(repoRoot, "components/Widget.tsx"),
    code: `
import { z } from "zod";
const userSchema = z.object({ id: z.string(), email: z.string().email() });
type User = z.infer<typeof userSchema>;
export function Widget({ user }: { user: User }) {
  const hash = require("crypto").createHash("md5").update(user.id).digest("hex");
  return <article data-h={hash}>{user.email}</article>;
}
`,
  },
];

const corpus = [...realFixtures, ...synthetic];

const ruleNames = Object.keys(plugin.rules);
const filteredRules = ONLY
  ? ruleNames.filter((n) => ONLY.includes(n))
  : ruleNames;

console.log(
  `Corpus: ${corpus.length} files (${realFixtures.length} real + ${synthetic.length} synthetic)`
);
console.log(`Rules to benchmark: ${filteredRules.length}`);
console.log(
  `Schedule: warmup=${WARMUP_PASSES} measurement=${PASSES} (iter/pass=${ITER_PER_PASS})`
);

const linter = new Linter({ configType: "flat" });

function runWithConfig(config) {
  let totalReports = 0;
  for (const f of corpus) {
    const messages = linter.verify(f.code, config, { filename: f.filename });
    totalReports += messages.length;
  }
  return totalReports;
}

function timeOnce(cfg) {
  const start = performance.now();
  let acc = 0;
  for (let i = 0; i < ITER_PER_PASS; i++) {
    acc += runWithConfig(cfg);
  }
  return {
    ms: performance.now() - start,
    reports: Math.floor(acc / ITER_PER_PASS),
  };
}

const baseConfig = {
  files: ["**/*.{ts,tsx,js,jsx}"],
  languageOptions: {
    parser: tsParser,
    parserOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      ecmaFeatures: { jsx: true },
    },
  },
  plugins: { mh: plugin },
};

function configFor(ruleName) {
  return { ...baseConfig, rules: { [`mh/${ruleName}`]: "error" } };
}

// Deterministic shuffle (Lehmer-style LCG) to avoid systematic position bias
// between passes. Modulo arithmetic instead of bitwise to satisfy lint rules.
const LCG_MOD = 2_147_483_647;
function shuffle(arr, seed) {
  const out = arr.slice();
  let s = Math.abs(Math.trunc(seed)) % LCG_MOD || 1;
  for (let i = out.length - 1; i > 0; i--) {
    s = (s * 1_103_515_245 + 12_345) % LCG_MOD;
    const j = s % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

console.log("\nWarmup...");
for (let w = 0; w < WARMUP_PASSES; w++) {
  timeOnce(baseConfig);
  for (const r of filteredRules) {
    timeOnce(configFor(r));
  }
  process.stdout.write(`\r  warmup ${w + 1}/${WARMUP_PASSES}`);
}
process.stdout.write("\n");

const baselineSamples = [];
const ruleSamples = new Map(filteredRules.map((r) => [r, []]));
const ruleReports = new Map();

for (let p = 0; p < PASSES; p++) {
  const order = shuffle(filteredRules, p * 7919 + 1);
  baselineSamples.push(timeOnce(baseConfig).ms);
  for (const r of order) {
    const t = timeOnce(configFor(r));
    ruleSamples.get(r).push(t.ms);
    if (!ruleReports.has(r)) {
      ruleReports.set(r, t.reports);
    }
  }
  process.stdout.write(
    `\rpass ${p + 1}/${PASSES} baseline median=${median(baselineSamples).toFixed(1)}ms     `
  );
}
process.stdout.write("\n");

function median(arr) {
  const s = arr.slice().sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

const baselineMs = median(baselineSamples);

const results = [];
for (const r of filteredRules) {
  const samples = ruleSamples.get(r);
  const med = median(samples);
  const minMs = Math.min(...samples);
  const maxMs = Math.max(...samples);
  results.push({
    rule: r,
    medianMs: med,
    overheadMs: med - baselineMs,
    minMs,
    maxMs,
    samples,
    reports: ruleReports.get(r),
  });
}
results.sort((a, b) => b.overheadMs - a.overheadMs);

const totalOverhead = results.reduce(
  (s, r) => s + Math.max(r.overheadMs, 0),
  0
);

console.log(
  `\n=== Rule benchmark ranking (corpus=${corpus.length} files, median of ${PASSES} passes, ${ITER_PER_PASS} iter/pass) ===`
);
console.log(
  `Baseline parse+lint cost (median): ${baselineMs.toFixed(1)}ms  samples=[${baselineSamples.map((m) => m.toFixed(1)).join(",")}]`
);
console.log(`Total measured rule overhead: ${totalOverhead.toFixed(1)}ms`);
console.log("");
console.log(
  `${"Rank  Rule".padEnd(60)}Overhead   Median   Min     Max     Reports`
);
results.forEach((r, i) => {
  const rank = String(i + 1).padStart(3);
  const reports = String(r.reports).padStart(6);
  console.log(
    `${rank}  ${r.rule.padEnd(55)}${r.overheadMs.toFixed(1).padStart(7)}ms ${r.medianMs.toFixed(1).padStart(7)}ms ${r.minMs.toFixed(1).padStart(6)}ms ${r.maxMs.toFixed(1).padStart(6)}ms ${reports}`
  );
});

if (process.env.JSON_OUT) {
  fs.writeFileSync(
    process.env.JSON_OUT,
    JSON.stringify({ baselineMs, baselineSamples, results }, null, 2)
  );
  console.log(`\nWrote ${process.env.JSON_OUT}`);
}
