// Real-model bakeoff, in two rounds, using the endpoint's own prompt, schema and
// validation. Every candidate is pinned to its named model (no server-side
// fallbacks), so a row labelled sonnet-low really is Sonnet's work.
// Spends real money: needs ANTHROPIC_API_KEY.
//
//   Round 1, breadth (10 situations x each config, 40 calls):
//     node bakeoff/run.mjs
//     node bakeoff/run.mjs haiku sonnet-low          just these configs
//   Round 2, consistency playoff (top two configs, hardest situations x3, 18 calls):
//     node bakeoff/run.mjs --playoff sonnet-low opus-low
//
// BAKEOFF_DRY=1 swaps in a fake model to check the harness at no cost.
import Anthropic from "@anthropic-ai/sdk";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildParams, parsePanel, validateRequest, readConfig } from "../src/index.js";
import { checks, LENSES } from "./checks.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const SITUATIONS = JSON.parse(fs.readFileSync(path.join(here, "situations.json"), "utf8"));
// MAX_TOKENS is generous on purpose: the run measures real usage so the cap can be tightened.
const PIN = { FALLBACKS: "off", MAX_TOKENS: "12000" };
const CONFIGS = {
  "haiku": { ...PIN, MODEL: "claude-haiku-4-5" },
  "sonnet-low": { ...PIN, MODEL: "claude-sonnet-5-5", EFFORT: "low" },
  "opus-low": { ...PIN, MODEL: "claude-opus-5-5", EFFORT: "low" },
  "opus-medium": { ...PIN, MODEL: "claude-opus-5-5", EFFORT: "medium" }, // quality reference
};
const PLAYOFF_SITUATIONS = ["vague", "accessibility", "ai-workflow"];
const PLAYOFF_REPEATS = 3;
// $ per million tokens (input, output), from the API pricing table cached 2026-09-25. Check before quoting.
const PRICE = { "claude-haiku-4-5": [1, 5], "claude-sonnet-5-5": [2, 10], "claude-opus-5-5": [4, 20] };

// ---------- Arguments ----------
const args = process.argv.slice(2);
const playoff = args.includes("--playoff");
const picked = args.filter((a) => !a.startsWith("--"));
for (const name of picked) if (!CONFIGS[name]) { console.error(`Unknown config "${name}". Choose from: ${Object.keys(CONFIGS).join(", ")}`); process.exit(1); }
if (playoff && picked.length !== 2) { console.error("The playoff takes exactly two configs, e.g. --playoff sonnet-low opus-low"); process.exit(1); }
const configs = Object.entries(CONFIGS).filter(([k]) => !picked.length || picked.includes(k));
const situations = playoff ? SITUATIONS.filter((s) => PLAYOFF_SITUATIONS.includes(s.id)) : SITUATIONS;
const repeats = playoff ? PLAYOFF_REPEATS : 1;

const DRY = process.env.BAKEOFF_DRY === "1";
if (!DRY && !process.env.ANTHROPIC_API_KEY) { console.error("Set ANTHROPIC_API_KEY first."); process.exit(1); }
const fakePanel = () => ({
  experience: { summary: "Dry run.", audience: "", moments: ["Start", "Middle", "Review", "Finish"].map((m) => ({ short: m, full: m + " step" })) },
  personas: LENSES.map((l, i) => ({ name: `Dry Person${i}`, whoTheyAre: l, goal: "g", startingPoint: i < 2 ? "uses a screen reader" : "s", workingStyle: "reads things",
    baselineSaysOrDoes: `baseline ${i}`, judgesBy: "j?", coreRisk: "r", overlays: [1, 2, 3].map((k) => ({ behavior: `b${k}`, saysOrDoes: `s${i}.${k}`, risk: `r${k}?` })) })),
});
const client = DRY
  ? { beta: { messages: { create: async (params) => { if (params.fallbacks || params.betas) throw new Error("bakeoff must not use fallbacks"); return { model: params.model, stop_reason: "end_turn", usage: { input_tokens: 1500, output_tokens: 2500 }, content: [{ type: "text", text: JSON.stringify(fakePanel()) }] }; } } } }
  : new Anthropic({ maxRetries: 2 });
const outDir = path.join(here, "results", `${playoff ? "playoff" : "round1"}-${new Date().toISOString().replace(/[:.]/g, "-")}`);
fs.mkdirSync(outDir, { recursive: true });

// ---------- Run ----------
async function runOne(name, env, sit, rep) {
  const cfg = readConfig(env);
  const input = validateRequest({ testing: sit.testing, audience: sit.audience, moments: sit.moments || [] });
  const t0 = Date.now();
  const rec = { config: name, model: cfg.MODEL, effort: cfg.MODEL.startsWith("claude-haiku") ? null : cfg.EFFORT || null, situation: sit.id, rep };
  try {
    const msg = await client.beta.messages.create(buildParams(input, cfg), { timeout: 120000 });
    rec.ms = Date.now() - t0;
    rec.servedBy = msg.model;
    rec.stop = msg.stop_reason;
    rec.inTok = msg.usage.input_tokens;
    rec.outTok = msg.usage.output_tokens;
    const [pi, po] = PRICE[cfg.MODEL] || [0, 0];
    rec.cost = (rec.inTok * pi + rec.outTok * po) / 1e6;
    rec.raw = msg.content;
    try { rec.panel = parsePanel(msg); rec.flags = checks(sit, rec.panel); }
    catch (e) { rec.error = `invalid (${rec.stop}): ${e.message}`; }
    // Pinned runs should never be served by another model; if one is, it doesn't count.
    if (rec.servedBy && !rec.servedBy.startsWith(cfg.MODEL)) { rec.error = `served by ${rec.servedBy}, not ${cfg.MODEL}`; delete rec.panel; }
  } catch (e) {
    rec.ms = Date.now() - t0;
    rec.error = `${e.status || ""} ${e.message}`.trim();
  }
  fs.writeFileSync(path.join(outDir, `${name}__${sit.id}__${rep}.json`), JSON.stringify(rec, null, 2));
  console.log(`${name.padEnd(12)} ${sit.id.padEnd(14)} #${rep} ${rec.error ? "ERROR " + rec.error : `ok ${rec.ms}ms out=${rec.outTok} flags=${rec.flags.length}`}`);
  return rec;
}

const jobs = configs.flatMap(([name, env]) => situations.flatMap((sit) => Array.from({ length: repeats }, (_, r) => () => runOne(name, env, sit, r + 1))));
console.log(`${playoff ? "Playoff" : "Round 1"}: ${jobs.length} calls`);
const results = [];
// Small pool so the run finishes quickly without tripping rate limits.
await Promise.all(Array.from({ length: 4 }, async () => { while (jobs.length) results.push(await jobs.shift()()); }));

// ---------- Report ----------
const med = (a) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : 0; };
const lines = [`# BYOS model bakeoff: ${playoff ? "consistency playoff" : "round 1 (breadth)"}`, "",
  `Run: ${path.basename(outDir)} · ${situations.length} situations × ${configs.length} configs × ${repeats} run(s) · fallbacks off (each config pinned to its model)`, "",
  "## Summary", "", "| Config | Valid | Median / max latency | Median / max output tokens | Avg $ per panel | Flags | Suggested MAX_TOKENS |", "|---|---|---|---|---|---|---|"];
for (const [name] of configs) {
  const rs = results.filter((r) => r.config === name), good = rs.filter((r) => r.panel);
  const outs = rs.filter((r) => r.outTok).map((r) => r.outTok), lat = rs.map((r) => r.ms);
  const cost = rs.reduce((a, r) => a + (r.cost || 0), 0) / Math.max(1, rs.length);
  const cap = Math.ceil((Math.max(0, ...outs) * 1.5) / 500) * 500;
  lines.push(`| ${name} | ${good.length}/${rs.length} | ${(med(lat) / 1000).toFixed(1)}s / ${(Math.max(...lat) / 1000).toFixed(1)}s | ${med(outs)} / ${Math.max(0, ...outs)} | $${cost.toFixed(4)} | ${good.reduce((a, r) => a + r.flags.length, 0)} | ${cap} |`);
}
const total = results.reduce((a, r) => a + (r.cost || 0), 0);
lines.push("", `Total spend for this run: $${total.toFixed(2)}. Suggested MAX_TOKENS is 1.5 × the largest output seen, rounded up to 500. Flags point you at things to read; they are not verdicts.`, "");
if (playoff) {
  lines.push("## Consistency", "", "| Situation | Config | Valid runs | Flags per run |", "|---|---|---|---|");
  for (const sit of situations) for (const [name] of configs) {
    const rs = results.filter((r) => r.config === name && r.situation === sit.id).sort((a, b) => a.rep - b.rep);
    lines.push(`| ${sit.id} | ${name} | ${rs.filter((r) => r.panel).length}/${rs.length} | ${rs.map((r) => (r.panel ? r.flags.length : "x")).join(" · ")} |`);
  }
  lines.push("", "Judge each run on its own. The winner is the config whose *worst* run is still usable, not the one with the best single run.", "");
}
lines.push("## How to judge each panel", "",
  "Score 1–5 in `scores.csv`:",
  "1. **Lenses distinct:** are the six people clearly different perspectives on this situation?",
  "2. **Typical preserves the person:** does the baseline example show their own working style, not an ideal user?",
  "3. **Overlays are the same person:** do Rushed / Inconsistent / Edge case read as this person under a condition, with no new facts?",
  "4. **Moments useful:** are the four key moments real checkpoints worth testing?",
  "5. **Would use it** (y/n): would you actually test your build with this brief?", "");
for (const sit of situations) {
  lines.push(`## ${sit.kind}: ${sit.testing}`, sit.audience ? `For: ${sit.audience}` : "For: (not given)", "");
  for (const [name] of configs) for (let rep = 1; rep <= repeats; rep++) {
    const r = results.find((x) => x.config === name && x.situation === sit.id && x.rep === rep);
    lines.push(`### ${name}${repeats > 1 ? ` · run ${rep}` : ""}`, "");
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
fs.writeFileSync(path.join(outDir, "scores.csv"), "situation,config,run,lenses_distinct,typical_preserves,overlays_same_person,moments_useful,would_use,notes\n" +
  situations.flatMap((s) => configs.flatMap(([c]) => Array.from({ length: repeats }, (_, r) => `${s.id},${c},${r + 1},,,,,,`))).join("\n") + "\n");
console.log(`\nReport: ${path.join(outDir, "report.md")}  (total $${total.toFixed(2)})`);
