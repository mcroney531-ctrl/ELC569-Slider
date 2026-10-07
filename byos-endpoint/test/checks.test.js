// The bakeoff's accessibility heuristics, on hand-built panels.
import { test } from "node:test";
import assert from "node:assert/strict";
import { checks } from "../bakeoff/checks.mjs";

const SIT = { testing: "A safety course that must work for screen-reader users.", audience: "Some employees use screen readers.", expect: "screen[- ]reader" };
const panel = (stableSR, overlaySR = {}) => ({
  experience: { summary: "s", audience: "", moments: ["A", "B", "C", "D"].map((m) => ({ short: m, full: m })) },
  personas: Array.from({ length: 6 }, (_, i) => ({
    name: `Name${i} Last`, whoTheyAre: "w", goal: "g", startingPoint: i < stableSR ? "Uses a screen reader at work." : "Sighted keyboard user.",
    workingStyle: "careful", baselineSaysOrDoes: `does thing ${i}`, judgesBy: "j?", coreRisk: "r",
    overlays: ["behavior", "saysOrDoes", "risk"].map((f, k) => ({ behavior: "b", saysOrDoes: `s${i}${k}`, risk: "r?", ...(overlaySR[i] === k ? { [f]: "Their screen reader skips the quiz." } : {}) })),
  })),
});
const has = (flags, re) => flags.some((f) => re.test(f));

test("context kept by some stable personas: no flag", () => {
  assert.equal(has(checks(SIT, panel(2)), /expected context/), false);
});
test("context kept by no stable persona is flagged", () => {
  assert.ok(has(checks(SIT, panel(0)), /kept by no stable persona/));
});
test("context given to all six is flagged as flattening", () => {
  assert.ok(has(checks(SIT, panel(6)), /all six/));
});
test("overlays may use a persona's existing screen-reader context", () => {
  // Persona 0 already uses a screen reader in its stable core.
  for (const k of [0, 1, 2]) assert.equal(has(checks(SIT, panel(2, { 0: k })), /overlay introduces/), false, `overlay field ${k}`);
});
test("an overlay that adds assistive tech to a persona without it is flagged, in any field", () => {
  // Persona 3 has no screen reader in its stable core.
  for (const k of [0, 1, 2]) assert.ok(has(checks(SIT, panel(2, { 3: k })), /Time-constrained: overlay introduces new assistive tech/), `overlay field ${k}`);
});
test("negated mentions don't count as keeping the context", () => {
  const p = panel(6);
  p.personas[5].startingPoint = "Does not use a screen reader.";
  assert.equal(has(checks(SIT, p), /all six/), false);
});
test("assistive tech invented for an input that never mentions accessibility is flagged", () => {
  const GAME = { testing: "A browser puzzle game.", audience: "" };
  assert.ok(has(checks(GAME, panel(1)), /Core user: invented assistive tech/));
  assert.equal(has(checks(GAME, panel(0)), /invented/), false);
});

test("settings words like 'cookies disabled' aren't flagged as a protected characteristic", () => {
  const GAME = { testing: "A browser puzzle game.", audience: "" };
  const p = panel(0);
  p.personas[5].startingPoint = "Plays with cookies and sound disabled.";
  assert.equal(has(checks(GAME, p), /appears but wasn't in the input/), false);
  p.personas[5].startingPoint = "A disabled veteran who plays at night.";
  assert.ok(has(checks(GAME, p), /appears but wasn't in the input/));
});
test("swapping to a different assistive tech in an overlay is flagged", () => {
  const p = panel(2);
  p.personas[0].overlays[2].saysOrDoes = "She reads the transcript with a braille display instead.";
  assert.ok(has(checks(SIT, p), /Core user: overlay introduces new assistive tech or need \(braille\)/));
});
