// mode "one": another person for an archetype the panel already covers. Fake model client, no network.
import { test } from "node:test";
import assert from "node:assert/strict";
import { handle, validateOneRequest, buildParams, readConfig, LENS_TEXT } from "../src/index.js";

const E = (extra = {}) => ({ MODEL: "claude-sonnet-5-5", SPEND_LIMIT_CONFIRMED: "yes", ...extra });
const EXPERIENCE = {
  summary: "A checkout form for a bakery.", audience: "Local customers.",
  moments: [{ short: "Cart", full: "Review cart" }, { short: "Details", full: "Enter details" }, { short: "Pay", full: "Payment" }, { short: "Done", full: "Confirmation" }],
};
const EXCLUDE = [
  { name: "Tomás Reyes", sameLens: true, whoTheyAre: "New shift lead.", startingPoint: "Never ordered online.", workingStyle: "Reads every word." },
  { name: "Dana Okafor" }, { name: "Priya Raman" },
];
const BODY = { mode: "one", archetype: 1, experience: EXPERIENCE, exclude: EXCLUDE };
const PERSON = (name = "Lena Fischer") => ({
  name, whoTheyAre: "w", goal: "g", startingPoint: "s", workingStyle: "ws", baselineSaysOrDoes: "b", judgesBy: "j?", coreRisk: "r",
  overlays: [1, 2, 3].map((k) => ({ behavior: `b${k}`, saysOrDoes: `s${k}`, risk: `r${k}?` })),
});
const reply = (persona) => ({ stop_reason: "end_turn", content: [{ type: "text", text: JSON.stringify({ persona }) }] });
function client(replies, seen = []) {
  let n = 0;
  return { beta: { messages: { create: async (params) => { seen.push(params); return replies[Math.min(n++, replies.length - 1)]; } } } };
}
let ipN = 0;
const req = (body, ip) => new Request("https://x.test/", {
  method: "POST", headers: { "Content-Type": "application/json", "CF-Connecting-IP": ip || `10.1.0.${++ipN}` }, body: JSON.stringify(body),
});

test("one persona, one call, with the lens, the same-lens profiles and every name in the prompt", async () => {
  const seen = [];
  const res = await handle(req(BODY), E(), { client: client([reply(PERSON())], seen) });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.persona.name, "Lena Fischer");
  assert.equal(data.persona.overlays.length, 3);
  assert.equal(seen.length, 1);
  const msg = seen[0].messages[0].content;
  assert.ok(msg.includes(LENS_TEXT[1]));
  assert.ok(msg.includes('<person name="Tomás Reyes"><whoTheyAre>New shift lead.</whoTheyAre>'));
  assert.ok(msg.includes("<names_in_use>Tomás Reyes; Dana Okafor; Priya Raman</names_in_use>"));
  assert.ok(!msg.includes("Dana Okafor</person>"), "other lenses send names only");
  assert.ok(seen[0].system.includes("differ from each of them in at least two of") && seen[0].system.includes("For each persona, the stable core:"));
  assert.equal(seen[0].max_tokens, 2000);
  assert.ok(seen[0].output_config.format.schema.properties.persona);
});

test("a clashing name is retried once, then reported", async () => {
  const seen = [];
  let res = await handle(req(BODY), E(), { client: client([reply(PERSON("Dana Lopez")), reply(PERSON("Maya Brooks"))], seen) });
  assert.equal(res.status, 200);
  assert.equal((await res.json()).persona.name, "Maya Brooks");
  assert.equal(seen.length, 2);
  const seen2 = [];
  res = await handle(req(BODY), E(), { client: client([reply(PERSON("Ana Reyes")), reply(PERSON("Priya Stone"))], seen2) });
  assert.equal(res.status, 502);
  assert.match((await res.json()).error, /distinct person/);
  assert.equal(seen2.length, 2);
});

test("bad model output never reaches the page", async () => {
  const bad = { ...PERSON(), overlays: [] };
  const res = await handle(req(BODY), E(), { client: client([reply(bad)]) });
  assert.equal(res.status, 502);
  assert.equal((await res.json()).error, "The persona came back incomplete.");
});

test("request validation", () => {
  assert.throws(() => validateOneRequest({ ...BODY, archetype: 6 }), /six archetypes/);
  assert.throws(() => validateOneRequest({ ...BODY, archetype: "1" }), /six archetypes/);
  assert.throws(() => validateOneRequest({ ...BODY, experience: { ...EXPERIENCE, moments: EXPERIENCE.moments.slice(0, 3) } }), /four key moments/);
  assert.throws(() => validateOneRequest({ ...BODY, exclude: EXCLUDE.filter((x) => !x.sameLens) }), /already in this archetype/);
  assert.throws(() => validateOneRequest({ ...BODY, exclude: Array.from({ length: 16 }, (_, i) => ({ name: `P ${i}`, sameLens: true, whoTheyAre: "w", startingPoint: "s", workingStyle: "ws" })) }), /full/);
  const v = validateOneRequest({ ...BODY, experience: { ...EXPERIENCE, summary: "<b>Bakery</b> checkout" } });
  assert.equal(v.experience.summary, "bBakery/b checkout");
});

test("its own per-IP allowance, separate from full builds", async () => {
  const cfg = E({ ONE_PER_IP_PER_HOUR: "2", PER_IP_PER_HOUR: "1" });
  const c = client([reply(PERSON())]);
  const ip = "10.9.9.9";
  assert.equal((await handle(req(BODY, ip), cfg, { client: c })).status, 200);
  assert.equal((await handle(req(BODY, ip), cfg, { client: c })).status, 200);
  const third = await handle(req(BODY, ip), cfg, { client: c });
  assert.equal(third.status, 429);
  assert.match((await third.json()).error, /new people/);
  // a full build from the same connection still has its own allowance
  const full = { stop_reason: "end_turn", content: [{ type: "text", text: JSON.stringify({ experience: EXPERIENCE, personas: Array.from({ length: 6 }, (_, i) => PERSON(`Person${i} X`)) }) }] };
  assert.equal((await handle(req({ testing: "A bakery checkout" }, ip), cfg, { client: client([full]) })).status, 200);
});

test("counts toward the daily ceiling", async () => {
  const store = new Map([["day:" + new Date(0).toISOString().slice(0, 10), "200"]]);
  const kv = { get: async (k) => store.get(k) || null, put: async (k, v) => { store.set(k, v); } };
  const res = await handle(req(BODY), E({ BYOS_KV: kv }), { client: client([reply(PERSON())]), now: () => 0 });
  assert.equal(res.status, 429);
});

test("one-mode params follow the same model rules", () => {
  const cfg = readConfig(E({ MODEL: "claude-haiku-4-5" }));
  const p = buildParams(validateOneRequest(BODY), cfg, "one");
  assert.equal(p.output_config.effort, undefined);
  assert.equal(p.fallbacks, undefined);
});
