# V2: individual persona builder (2026-10-12)

Branch `claude/v2-persona-builder`, started from the release candidate `4b2474a`. Decision record: the V2 review with GPT (V2 ships with one person per archetype; duplicates and 10 people are V2.1).

## Checkpoint 1: entries model, exports unchanged
- The panel became an ordered list of entries `{iid, a, challenge, journey}`; `deriveEntry` derives behavior and route per entry.
- 2,040 outputs (whole brief, whole prompt and every single-persona prompt for all 120 settings, sample and generated panels) byte-identical to `4b2474a`.

## Checkpoints 2 and 3: per-persona settings and the archetype builder
- Stages: Project → Build → Your panel → Export. Navigation never changes the panel or calls the Worker.
- **Build:**
  - Six archetype choices as a native radio group: icon, lens name, one-line hint, and an "In your panel" or "Suggested next" badge in text.
  - A preview of the person, which needs no call because they already exist.
  - The shared editor (the same two native sliders and value text as V1).
  - "Add [name] to your panel". "Start with the recommended three" adds the first three lenses.
- **Your panel:**
  - Cards in the order people were added, with settings shown as text on each card.
  - "Change settings" is a disclosure that opens the single editor under that person.
  - "Remove" moves focus to the next person, or the previous one, or "Add a persona".
  - "Clear panel" asks for confirmation.
  - "Use X for everyone" changes one dimension. It is explicit and announced, and shows "Everyone is on X" once applied.
- Only two range inputs exist on the page, whatever the panel size.
- Removed people keep their last settings for the session.
- **Exports:**
  - Every persona section carries its own settings, route and journey check. No "Shared" lines.
  - Both formats can be exported as one persona or the whole panel.
  - The whole-panel AI prompt adds a separate-test rule and says to stop between runs. It says plainly that separate chats keep personas apart more reliably.
  - An edited export is never replaced silently: when the panel has changed, "Update the export" appears.
- **Project form:**
  - When a panel exists, it warns "Building replaces your current panel of N" and the button reads "Build and replace my panel".
  - A successful build starts an empty panel on Build.
  - A failed or cancelled build keeps the panel and the draft.
- Motion uses Web Animations: added avatar pop, card entrance, removal ghost with the rest sliding into place, and stage slide. None of it runs under reduced motion.

## Tests
- `v2-test.js` (new, 1200px and 360px with reduced motion). It covers:
  - A one-person panel and its export.
  - Independent settings, with no mutation between personas.
  - Apply to all, one dimension at a time.
  - Every journey route, on the card and in the export.
  - Remove and re-add, the empty panel, and the recommended three.
  - Switching the selected persona.
  - Stale exports, and per-persona copy in both formats.
  - Download and the clipboard fallback.
  - Project-build failure, bad response, cancel and success, plus XSS and typed moments.
  - Keyboard-only build and export.
  - Layout at 360px, reduced motion, and that no other network requests are made.
- Ported:
  - `jr-test.js`: the window now shows the selected person's route.
  - `motion.js`: Export is a stage.
  - `font-apply.js`: a six-person panel at the hardest settings.
  - `onboard-test.js`: the onboarding sections of the V1 suite.
- Unchanged and passing: `acc-test.js`, `form-check.js`, `equiv-test.js` (checkpoint 1, run against its own commit).
- Retired with the V1 interface: `verify2.js` (slider panel, shared route), `stage-test.js` (three stages), `av-test.js` (fixed seats). What they checked that still applies is covered in `v2-test.js`.
