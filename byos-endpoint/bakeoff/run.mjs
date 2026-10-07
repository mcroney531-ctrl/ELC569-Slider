// Real-model bakeoff: runs every situation against every candidate config with
// the endpoint's own prompt, schema and validation, then writes a report for
// human judging. Spends real money: needs ANTHROPIC_API_KEY.
//   node bakeoff/run.mjs                 all configs
//   node bakeoff/run.mjs haiku sonnet-low   just these
import Anthropic from "@anthropic-ai/sdk";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildParams, parsePanel, validateRequest, readConfig } from "../src/index.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const SITUATIONS = JSON.parse(fs.readFileSync(path.join(here, "situations.json"), "utf8"));
// MAX_TOKENS is generous here on purpose: the run measures real usage so the cap can be tightened.
const CONFIGS = {
  "haiku": { MODEL: "claude-haiku-4-5", MAX_TOKENS: "12000" },
  "sonnet-low": { MODEL: "claude-sonnet-5-5", EFFORT: "low", MAX_TOKENS: "12000" },
  "opus-low": { MODEL: "claude-opus-5-5", EFFORT: "low", MAX_TOKENS: "12000" },
  "opus-medium": { MODEL: "claude-opus-5-5", EFFORT: "medium", MAX_TOKENS: "12000" }, // quality benchmark
};
// $ per million tokens (input, output), from the API pricing table cached 2026-09-25. Check before quoting.
const PRICE = { "claude-haiku-4-5": [1, 5], "claude-sonnet-5-5": [2, 10], "claude-opus-5-5": [4, 20] };
const LENSES = ["Core user", "Newcomer", "Experienced user", "Time-constrained", "Low confidence", "Context outlier"];
const PROTECTED = /\b(blind|deaf|wheelchair|disab\w*|autis\w*|adhd|dyslex\w*|religio\w*|muslim|christian|jewish|hindu|gay|lesbian|trans(gender)?|pregnan\w*|\d{2}-year-old|elderly|retiree|immigrant|race|ethnic\w*)\b/i;

const picked = process.argv.slice(2);
const configs = Object.entries(CONFIGS).filter(([k]) => !picked.length || picked.includes(k));
const DRY = process.env.BAKEOFF_DRY === "1"; // fake model, no cost: checks the harness and report only
if (!DRY && !process.env.ANTHROPIC_API_KEY) { console.error("Set ANTHROPIC_API_KEY first."); process.exit(1); }

const fakePanel = (params) => ({
  experience: { summary: "Dry run.", audience: "", moments: ["Start", "Middle", "Review", "Finish"].map((m) => ({ short: m, full: m + " step" })) },
  personas: LENSES.map((l, i) => ({ name: `Dry Person${i}`, whoTheyAre: l, goal: "g", startingPoint: "s", workingStyle: "reads things",
    baselineSaysOrDoes: `baseline ${i}`, judgesBy: "j?", coreRisk: "r", overlays: [1, 2, 3].map((k) => ({ behavior: `b${k}`, saysOrDoes: `s${i}.${k}`, risk: `r${k}?` })) })),
});
const client = DRY
  ? { beta: { messages: { create: async (params) => ({ stop_reason: "end_turn", usage: { input_tokens: 1500, output_tokens: 2500 }, content: [{ type: "text", text: JSON.stringify(fakePanel(params)) }] }) } } }
  : new Anthropic({ maxRetries: 2 });
const outDir = path.join(here, "results", new Date().toISOString().replace(/[:.]/g, "-"));
fs.mkdirSync(outDir, { recursive: true });

const words = (s) => new Set(s.toLowerCase().match(/[a-z']+/g) || []);
const overlap = (a, b) => { const A = words(a), B = words(b); let n = 0; A.forEach((w) => B.has(w) && n++); return n / Math.max(1, Math.min(A.size, B.size)); };
const norm = (s) => s.toLowerCase().replace(/\W+/g, " ").trim();

function checks(sit, panel) {
  const flags = [];
  const all = JSON.stringify(panel), input = `${sit.testing} ${sit.audience || ""}`;
  const names = panel.personas.map((p) => p.name), firsts = names.map((n) => n.split(" ")[0]);
  if (new Set(names).size < 6 || new Set(firsts).size < 6) flags.push("duplicate names");
  panel.personas.forEach((p, i) => {
    const says = p.overlays.map((o) => norm(o.saysOrDoes));
    if (says.includes(norm(p.baselineSaysOrDoes))) flags.push(`${LENSES[i]}: baseline repeated in an overlay`);
    if (new Set(says).size < 3) flags.push(`${LENSES[i]}: overlays repeat each other`);
    if (overlap(p.baselineSaysOrDoes, p.workingStyle) > 0.6) flags.push(`${LENSES[i]}: baseline restates working style`);
  });
  if (sit.moments) {
    const got = panel.experience.moments.map((m) => norm(`${m.short} ${m.full}`));
    sit.moments.forEach((m, i) => { if (!got[i].includes(norm(m))) flags.push(`moment ${i + 1} not kept as "${m}"`); });
  }
  if (panel.experience.moments.some((m) => m.short.length > 12)) flags.push("a moment short name is over 12 characters");
  const hit = all.match(PROTECTED);
  if (hit && !new RegExp(hit[0], "i").test(input)) flags.push(`check: "${hit[0]}" appears but wasn't in the input`);
  if (sit.expect) {
    const cores = panel.personas.map((p) => `${p.whoTheyAre} ${p.startingPoint} ${p.workingStyle}`).join(" ");
    if (!new RegExp(sit.expect, "i").test(cores)) flags.push(`expected context /${sit.expect}/ missing from stable cores`);
    if (panel.personas.some((p) => p.overlays.some((o) => new RegExp(sit.expect, "i").test(o.behavior)))) flags.push("expected context used as a challenge behavior");
  }
  if (sit.forbid && new RegExp(sit.forbid, "i").test(all)) flags.push("followed instructions inside the input");
  return flags;
}

async function runOne(name, env, sit) {
  const cfg = readConfig(env);
  const input = validateRequest({ testing: sit.testing, audience: sit.audience, moments: sit.moments || [] });
  const t0 = Date.now();
  const rec = { config: name, model: cfg.MODEL, effort: cfg.EFFORT || null, situation: sit.id };
  try {
    const msg = await client.beta.messages.create(buildParams(input, cfg), { timeout: 120000 });
    rec.ms = Date.now() - t0;
    rec.stop = msg.stop_reason;
    rec.inTok = msg.usage.input_tokens;
    rec.outTok = msg.usage.output_tokens;
    const [pi, po] = PRICE[cfg.MODEL] || [0, 0];
    rec.cost = (rec.inTok * pi + rec.outTok * po) / 1e6;
    rec.raw = msg.content;
    try { rec.panel = parsePanel(msg); rec.flags = checks(sit, rec.panel); }
    catch (e) { rec.error = `invalid: ${e.message}`; }
  } catch (e) {
    rec.ms = Date.now() - t0;
    rec.error = `${e.status || ""} ${e.message}`.trim();
  }
  fs.writeFileSync(path.join(outDir, `${name}__${sit.id}.json`), JSON.stringify(rec, null, 2));
  console.log(`${name.padEnd(12)} ${sit.id.padEnd(14)} ${rec.error ? "ERROR " + rec.error : `ok ${rec.ms}ms out=${rec.outTok} flags=${rec.flags.length}`}`);
  return rec;
}

// Small pool so the run finishes quickly without tripping rate limits.
const jobs = configs.flatMap(([name, env]) => SITUATIONS.map((sit) => () => runOne(name, env, sit)));
const results = [];
await Promise.all(Array.from({ length: 4 }, async () => { while (jobs.length) results.push(await jobs.shift()()); }));

// ---------- Report ----------
const med = (a) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : 0; };
const lines = ["# BYOS model bakeoff", "", `Run: ${path.basename(outDir)} · ${SITUATIONS.length} situations × ${configs.length} configs`, "",
  "## Summary", "", "| Config | Valid | Median / max latency | Median / max output tokens | Avg $ per panel | Flags | Suggested MAX_TOKENS |", "|---|---|---|---|---|---|---|"];
for (const [name] of configs) {
  const rs = results.filter((r) => r.config === name), good = rs.filter((r) => r.panel);
  const outs = rs.filter((r) => r.outTok).map((r) => r.outTok), lat = rs.map((r) => r.ms);
  const cost = rs.reduce((a, r) => a + (r.cost || 0), 0) / Math.max(1, rs.length);
  const cap = Math.ceil((Math.max(0, ...outs) * 1.5) / 500) * 500;
  lines.push(`| ${name} | ${good.length}/${rs.length} | ${(med(lat) / 1000).toFixed(1)}s / ${(Math.max(...lat) / 1000).toFixed(1)}s | ${med(outs)} / ${Math.max(0, ...outs)} | $${cost.toFixed(4)} | ${good.reduce((a, r) => a + r.flags.length, 0)} | ${cap} |`);
}
lines.push("", "Suggested MAX_TOKENS is 1.5 × the largest output seen, rounded up to 500. Flags are heuristics that point you at things to read, not verdicts.", "",
  "## How to judge each panel", "",
  "Score 1–5 in `scores.csv`:",
  "1. **Lenses distinct:** are the six people clearly different perspectives on this situation?",
  "2. **Typical preserves the person:** does the baseline example show their own working style, not an ideal user?",
  "3. **Overlays are the same person:** do Rushed / Inconsistent / Edge case read as this person under a condition, with no new facts?",
  "4. **Moments useful:** are the four key moments real checkpoints worth testing?",
  "5. **Would use it** (y/n): would you actually test your build with this brief?", "");
for (const sit of SITUATIONS) {
  lines.push(`## ${sit.kind}: ${sit.testing}`, sit.audience ? `For: ${sit.audience}` : "For: (not given)", "");
  for (const [name] of configs) {
    const r = results.find((x) => x.config === name && x.situation === sit.id);
    lines.push(`### ${name}`, "");
    if (!r || !r.panel) { lines.push(`**Failed:** ${r ? r.error : "missing"}`, ""); continue; }
    const p = r.panel;
    lines.push(`Moments: ${p.experience.moments.map((m) => `${m.short} (${m.full})`).join(" → ")}`, "");
    if (r.flags.length) lines.push("Flags: " + r.flags.join("; "), "");
    lines.push("| Lens | Person | Working style | Typical (baseline) | Rushed | Inconsistent | Edge case |", "|---|---|---|---|---|---|---|");
    p.personas.forEach((x, i) => lines.push(`| ${LENSES[i]} | **${x.name}**: ${x.whoTheyAre} *Starts:* ${x.startingPoint} | ${x.workingStyle} | ${x.baselineSaysOrDoes} | ${x.overlays[0].saysOrDoes} | ${x.overlays[1].saysOrDoes} | ${x.overlays[2].saysOrDoes} |`.replace(/\n/g, " ")));
    lines.push("");
  }
}
fs.writeFileSync(path.join(outDir, "report.md"), lines.join("\n") + "\n");
fs.writeFileSync(path.join(outDir, "scores.csv"), "situation,config,lenses_distinct,typical_preserves,overlays_same_person,moments_useful,would_use,notes\n" +
  SITUATIONS.flatMap((s) => configs.map(([c]) => `${s.id},${c},,,,,,`)).join("\n") + "\n");
console.log(`\nReport: ${path.join(outDir, "report.md")}`);
