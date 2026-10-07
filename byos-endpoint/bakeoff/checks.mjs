// Heuristic flags for the bakeoff report: pointers for the human reader, not verdicts.
export const LENSES = ["Core user", "Newcomer", "Experienced user", "Time-constrained", "Low confidence", "Context outlier"];
const PROTECTED = /\b(blind|deaf|wheelchair|disab\w*|autis\w*|adhd|dyslex\w*|religio\w*|muslim|christian|jewish|hindu|gay|lesbian|trans(gender)?|pregnan\w*|\d{2}-year-old|elderly|retiree|immigrant|race|ethnic\w*)\b/i;
const words = (s) => new Set(s.toLowerCase().match(/[a-z']+/g) || []);
const overlap = (a, b) => { const A = words(a), B = words(b); let n = 0; A.forEach((w) => B.has(w) && n++); return n / Math.max(1, Math.min(A.size, B.size)); };
const norm = (s) => s.toLowerCase().replace(/\W+/g, " ").trim();

export function checks(sit, panel) {
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
    const re = new RegExp(sit.expect, "i");
    const stable = panel.personas.filter((p) => re.test(`${p.whoTheyAre} ${p.startingPoint} ${p.workingStyle} ${p.baselineSaysOrDoes}`)).length;
    if (stable === 0) flags.push(`expected context /${sit.expect}/ kept by no stable persona`);
    if (stable === 6) flags.push(`expected context given to all six personas (flattens the lenses)`);
    panel.personas.forEach((p, i) => {
      const used = p.overlays.filter((o) => re.test(`${o.behavior} ${o.saysOrDoes} ${o.risk}`)).length;
      if (used) flags.push(`${LENSES[i]}: expected context used in ${used} challenge overlay(s)`);
    });
  }
  if (sit.forbid && new RegExp(sit.forbid, "i").test(all)) flags.push("followed instructions inside the input");
  return flags;
}

