# V2: individual persona builder (2026-10-12)

Branch `claude/v2-persona-builder`, started from the release candidate `4b2474a`. Decision record: the V2 review with GPT (V2 ships with one person per archetype; duplicates and 10 people are V2.1).

## Checkpoint 1: entries model, exports unchanged
- The panel became an ordered list of entries `{iid, a, challenge, journey}`; `deriveEntry` derives behavior and route per entry.
- 2,040 outputs (whole brief, whole prompt and every single-persona prompt for all 120 settings, sample and generated panels) byte-identical to `4b2474a`.

## Checkpoints 2 and 3: per-persona settings and the archetype builder
- Stages: Project → Build → Your panel → Export. Navigation never changes the panel or calls the Worker.
- **Build:**
  - Six archetype choices as a native radio group: icon, lens name, one-line hint, and an "In your panel" badge in text.
  - A preview of the person, which needs no call because they already exist.
  - The shared editor (the same two native sliders and value text as V1).
  - "Add [name] to your panel". The panel summary sits under the choices.
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

## Checkpoint 4: another person per archetype, up to 10 (V2.1)
- **Worker `mode: "one"`** (`byos-endpoint`). It covers:
  - The request: the archetype, the project as built, and everyone already generated for it. Only same-archetype people send their profiles.
  - The prompt: it reuses the build's persona rules plus the difference rule (at least two of role or situation, starting point and working style; never difficulty, protected characteristics or overlay material).
  - Response and names: a single-persona schema, one retry on a repeated name, and a separate per-IP allowance (`ONE_PER_IP_PER_HOUR`, default 12).
  - Limits: it counts toward the daily ceiling and has a `ONE_MAX_TOKENS` cap.
  - Tests: 7 new Worker tests in `test/one.test.js`; 26 pass in total.
  - Needs a deploy (staging first) before the page's "Create another" works anywhere live.
- **Page:**
  - **The pool:** every person generated for the project, each with an archetype. Build previews the first person of the chosen archetype who isn't in the panel. When there is none, it explains why and offers "Create another [archetype]".
  - **While creating:** the button shows progress (`aria-busy`, a timer) and the result is announced once. Focus moves to the preview, and the new person starts at Typical / Straight through.
  - **Pool reuse:** removed people go back to the pool and are offered again without a call.
  - **Sample mode:** it says "Want another Newcomer? Build a panel for your own project to create additional people." and makes no request.
  - **Caps:** 10 people per panel and 16 generated per project. A full panel says so.
  - **Rebuilds:** a person requested for a project that was rebuilt meanwhile is dropped, never mixed in.
  - **Names:** the page checks again that the new person repeats no first name or surname.
- **Tests:** `v21-test.js` (new, 1200px and 360px with reduced motion). It covers:
  - The sample explanation, and the request contents.
  - Progress, and a double press making one request.
  - Default settings for the new person, and two distinct Newcomers with independent settings.
  - Re-offering from the pool without a call.
  - Error and repeated-name rejections.
  - Ten distinct people, the full-panel state, and a ten-person export.
  - A rebuild during creation.

## Simplified guidance (user review)
- Removed "Start with the recommended three" and the "Suggested next" tag. The panel summary moved up under the archetype choices.
- After an add, the choice still moves to the next archetype not yet covered, in the tool's coverage order. This is silent, with no tag or announcement.
- The test settings sit above the preview.

## Settings-surface visual hierarchy (approved handoff, 2026-10-12)
- **Editor (the configuration surface):**
  - One step lighter than the Build workspace (#17485C → #133B50), with a thin teal top accent, a subtle border and a soft shadow.
  - The Challenge and Journey cards sit a step darker (#102B41), with borders tinted by their own purple or blue accent.
  - The white Preview is unchanged.
- **Header:**
  - The archetype icon (decorative), a "Configuring persona" kicker, the person's real name, an archetype pill, and the existing archetype hint.
  - View journey stays in the header.
  - The group is labelled "Configuring persona [name] [archetype]". No new tab stops.
- **Responsive and contrast checks:**
  - Long names wrap at 360, 900 and 1280px, with no sideways scroll.
  - Text contrast on the new surfaces is 6.3:1 to 11.9:1.
- **Unchanged:** no logic, slider, export or stage changes.

## Control cards (approved treatment, 2026-10-12)
- Challenge and Journey cards are tinted from the top-left corner in their accent (purple, blue), with an accent border, an inner top highlight and a soft shadow.
- The Challenge icon sits on a glossy purple tile. Journey uses the approved glossy tile artwork (`design/icons/journey-tile.png` master; a 96px WebP of about 4 KB is embedded). In forced-colors mode the line icon returns.
- A gentle accent glow on the slider thumb and fill. No animation was added.
- Contrast on the tinted cards: muted text at least 4.7:1 (hover 5.0:1 or more); white at least 8.6:1.

## Route folded into the cards (2026-10-12)
- Persona cards (Build preview and Your panel) replace the Route chip row with a "View route" link. Screen readers hear it as "View route for [name]".
- The link opens the existing Journey window for that card's person. Focus returns to the link that opened it. The route stays in both exports.
- v2-test checks every journey pattern through the card link against the export.
