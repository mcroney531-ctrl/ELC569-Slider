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

## Card fixes and Challenge icon (2026-10-12)
- "View route" now sits on its own line. On Inconsistent and Edge case it used to run straight into the challenge tag.
- Removed the Edge case "irregular top rule" (a short purple dashed mark at the card's top-left). The rounded corner clipped it, so it read as a stray artifact. The "Unexpected request" tag still marks Edge case in text.
- Challenge uses the approved glossy tile artwork (`design/icons/challenge-tile.png` master; a 96px WebP of about 3 KB is embedded). The faint speckle row above the tile was cleared in the small version. The line icon returns in forced-colors mode.

## Guided example replaces the worked example (2026-10-12)
- **Intro step 4, "Try it with an example":** three-line preview, the "same person, different conditions" point, and Key terms kept as an optional closed `<details>`. Actions: "Start the guided example" and "Skip to my project". Priya removed. Step 3 no longer describes seats or the Panel size slider.
- **Guided example:** runs in the real workspace on a throwaway copy of the sample. The person's own project, panel, settings and export format are set aside, then restored exactly on Skip, Esc or finish.
  - Step 1: Build, add any archetype.
  - Step 2: Your panel, with that person open; any Challenge other than Typical completes it, and focus stays on the slider.
  - Step 3: open Export, by the step's button or the stage nav.
  - Done: "Go to my project" leads to the Project stage. The form is never opened automatically.
  - Steps are inline regions in reading order, not overlays. Focus moves to a step's heading only when the step moves stage.
  - A real build during the example ends it without restoring the sample.
- **Project stage with no project:** "No project yet", a 40-second expectation, "Try it with your own project" as the primary action, and "Explore the sample" as the secondary one. On Build, the sample is labelled as the sample.
- **Tests:** `tour-test.js` (new, 1200px and 360px with reduced motion). Updated wording in `v2-test` and `onboard-test`.

## Spotlight tour replaces the three guided tasks (2026-10-12)
- **Consolidation (flagged before building):** the earlier guided example had its own three task steps, an inline banner and a throwaway copy of the sample. The spotlight replaces all of it, so there is no second step counter.
  - The spotlight only reads the page, so it runs over whatever Build shows: the sample with no project, or the person's own project on a replay. There is nothing to restore.
- **Three stops**, moved only by Next and Back: the archetype list, the Challenge/Journey settings, the white preview. "Start exploring" ends it.
  - Skip tour and Esc exit at once. Ending puts focus on the chosen archetype.
  - It starts only from "Start the guided example" (intro step 4, also reached from the refresher). It never starts on entering the tool, moving between stages or after a build. No tracking is stored.
- **Card:** a modal `<dialog>`, so the dimmed page is inert. It is a group named "Step X of 3 [title]" and described by "Highlighted: …" plus the explanation; focus moves to it on each step.
  - Desktop: placed beside, above or below the region, never over it.
  - Phone: anchored at the bottom with the safe-area inset. The highlight stops above the card, so the tall settings area is never covered and Next/Back/Skip stay on screen.
- **Highlight:** a fixed outline plus a dimming shadow. Web Animations: 220ms between stops, 180ms card fade, none under reduced motion. Forced colors: a Highlight outline and a bordered card.
- **Tests:** `tour-test.js` rewritten (1200px, 390px, and 360px with reduced motion). It covers:
  - Never auto-starting.
  - Each stop's text, focus and accessible name, no overlap with the highlight, and buttons on screen.
  - Tab confined to the card. Next, Back, Skip, Esc and completion.
  - No state change and no request, and the sample usable afterwards. Replay over a real project leaves it untouched.
- **Tour card colour (approved option A, soft mint):** `#E6FBF7` card, `#8EE3D6` border, `#14B8A6` top line and Next button, navy text.
  - Contrast: title 13.2:1, body 9.9:1, teal labels 5.1:1, Next 5.9:1 (hover 4.9:1), focus ring 5.4:1.
  - The card stays clear of the highlight at all three stops on desktop and phone (tested).

## Sample mode orientation (approved reduced scope, 2026-10-12)
- **Banner:** a "Sample mode" strip under the stepper on Build, Your panel and Export, not Project, which already says "No project yet". It replaces Build's old sample note. It is plain text, never announced, and is two rows on a phone (tag and button, then the sentence).
- **Export:** one "Build my own panel" button next to "Back to Your panel", in sample mode only.
- **One label:** every button that opens the project form says "Build my own panel". That covers the Project card, the banner, Export, and the "another Newcomer" note.
- **Form:** moved out of the Project stage so it opens from any stage. This fixed a real bug the new test caught: from the banner it opened invisibly, because Project was hidden.
  - Cancel and Esc return focus to whichever button opened it, on the same stage.
  - In sample mode there is no "replaces your panel" warning; a real panel still gets it.
- **Exports:** sample briefs and prompts (whole and single) open with "SAMPLE — Made with the built-in example project." Downloads are `sample-panel-brief.md` and `sample-panel-ai-prompt.md`. Real projects get neither, and their files are `brief.md` and `ai-prompt.md`.
- **Tests:** `sample-test.js` (new, 1200px and 360px with reduced motion). It covers:
  - Banner placement and size, and the single label.
  - Open, then Cancel or Esc, from Project, Build, Your panel and Export (twice), with focus and stage kept and sample data unchanged.
  - A failed build keeping the sample and the draft, with Cancel returning to Export.
  - Markers and file names, and a success ending sample mode.
  - Real exports clean, and the real-panel warning kept.
- Updated three V2/V2.1 assertions for the intended wording, file-name and warning changes.
- **Banner colours (approved):**
  - Mint `#E6FBF7` with a 2px navy `#0B2F3A` outline, a thin teal ring and a soft shadow.
  - A navy tag, and a navy "Build my own panel" button with white text.
  - Contrast: text 9.9:1, tag 10.8:1, button 14.2:1. Forced colors: plain outline.
- **Project form:**
  - The section icons ("Describe your project", "Map the journey") now match the active step number in the stepper: teal `#25D6C4` disc with a dark glyph (8.1:1).
  - "Build my panel" is solid navy (`--navy`, white text 14.2:1; hover `--navy-2`, 8.7:1), matching the Cancel button's navy outline.

## Intro teaches, workspace does the work (2026-10-12, approved)
- **Boundary:**
  - The built-in sample stays loaded internally as `current` when there is no project.
  - One check decides what may render: `hasProject()` for the workspace, and `sampleAllowed()` (true only while Try it is open). `render()` writes `data-project` once, and CSS swaps every workspace stage to its empty state from that attribute.
  - The editor and the builder refuse to render sample data unless Try it is open.
- **Workspace with no project:**
  - Project says "No project yet" and offers Build my own panel.
  - Build, Your panel and Export each show "Start with your project", with the same button. All four stages stay navigable.
  - Removed: the sample banner, the sample Export button, sample export markers and file names, "Explore the sample", and the sample replace-warning exception.
  - Downloads are `test-panel-brief.md` and `test-panel-ai-prompt.md`.
- **Intro:** three steps: Why persona testing, Why AI, Try it. The accordion and the worked-example step are gone.
- **Try it:**
  - It moves the one real builder (`.build-grid`: archetype list, settings editor, preview) into the intro. Add and the panel summary are hidden there.
  - "See what this becomes" (collapsed) is `buildBrief` for the person and settings shown.
  - The spotlight starts on entering and its last stop points to the brief. Key terms stay optional.
  - Buttons: Back, Build my own panel (exits, opens the form on Project), Skip to the tool.
- **Lifecycle:** `demoEnter()` and `demoExit()` are the only way in and out, called from `showStep` and `enterTool`. That covers every route: Next, Back, Skip, the landing links, the refresher and Build my own panel.
  - Exit restores the project, entries, settings memo, selection, chosen archetype, next id and stage, and puts the builder back.
- The project form, the Journey window and the spotlight are moved to `<body>` at start, so they open from the intro too.
- **Tests:**
  - `split-test.js` (new): no sample text anywhere in any workspace stage without a project; the three empty states; Cancel returns focus from all four stages; failure keeps "no project"; success shows the real project, and exports carry no sample.
  - `try-test.js` (new, 1200px, 390px, and 360px with reduced motion):
    - One builder, the intro step count, and the tour (including stop 3 not overlapping the highlight).
    - The compact demo; the brief equals the export and starts collapsed.
    - Build my own panel → Project with the form open.
    - Five different exit routes, each restoring the exact project state (entries, settings, open editor, selection, stage); the sample never in the pool; one Worker call in total.
  - Updated `v2-test`, `v21-test` and `jr-test` to drive a real project. `onboard-test` covers the three-step intro.
  - Retired `tour-test`, `sample-test` and `acc-test` (their behaviour is covered by the new suites or no longer exists).

## Try it on phones: scrolling settings and preview, tour buttons always visible

- Request: on a phone, tour stops 2 and 3 cut off the settings and the preview, and on stop 3 the tour card clipped its own buttons.
- Phones (≤620px), Try it only: the settings editor and the preview each have a maximum height of 44svh and scroll inside their own box, with a thin cyan scrollbar and contained overscroll. In Try it the preview gets `tabindex="0"` and the label "Persona preview" so keyboard users can scroll it. Both are removed when the builder goes back to the workspace. The workspace and desktop are unchanged.
- Tour card: it is now a flex column. The explanation scrolls if it has to, and Skip, Back and Next never scroll out of view. On phones the buttons stay on one row.
- Tour placement on phones: the highlighted region is scrolled to 20px from the top (was 76px). While the tour runs, temporary bottom room lets the last region rise above the card; that room is removed when the tour ends.
- Measured (region top–bottom vs card top):
  - 390×844: stop 2 is 20–391 vs 549; stop 3 is 20–392 vs 522.
  - 360×740: stop 2 is 20–346 vs 422; stop 3 is 20–346 vs 418.
- Tests: try-test adds checks at every stop and viewport that the buttons are visible and that the region fits above the card on a phone. It also checks that the phone sections scroll, that desktop and the workspace have no inner scrolling, and that the tab stop and the bottom room are cleaned up. try, split, onboard, v2, v21 and jr all pass.
- Caveat: phone scrollbars are overlay and only appear while scrolling, so the cue is content cut off mid-line at the box edge.

## Try it on phones: archetypes scroll too; a bottom fade shows there is more

- The archetype list in Try it on phones is capped at min(40svh, 260px) and scrolls inside its box. The cap ends partway through the fourth archetype, so the cut is visible. Stop 1 now fits above the tour card at 390px and 360px (region bottom 307 vs card top 569 and 465).
- Bottom fade: the archetypes, settings and preview boxes each get a soft 32px fade while there is more below. It goes away at the end of the box and comes back when scrolled up. A ResizeObserver plus `render()` keep it current, because the boxes are first measured while Try it is still hidden. It only applies inside Try it, and nothing in the workspace or on desktop is affected.
- Tests: try-test checks that the archetypes scroll on phones, that all three boxes fade while more is below, that the fade clears at the end of the list and comes back at the top, that desktop shows no fades, and that the workspace shows no fades and no boxed archetypes. try, split, onboard, v2, v21 and jr all pass.

## Tour: the highlighted region stays live (scroll and try it while the card is up)

- Request: the phone scroll boxes couldn't be used during the tour. The tour card was a modal dialog, so the whole page behind it was inert, and the tour covers most of the time someone spends in Try it.
- Change:
  - The tour card now opens non-modally (`show()` rather than `showModal()`).
  - `spotIsolate()` makes every sibling along the path from the highlighted region up to `<body>` inert, keeping only the card and the spotlight live. So only the card and the highlighted region can be reached by pointer or keyboard.
  - `spotFree()` undoes this on every stop change and when the tour ends.
  - On a phone, the region's box scrolls under a finger or wheel and the page stays put. The region can also be tried out: choose an archetype on stop 1, move a slider on stop 2.
- Esc: the dialog's `cancel` event is replaced by a document keydown, so Esc ends the tour from the card or from inside the region. It is skipped when another dialog is open, for example View journey opened from stop 2.
- Refit: when the region changes size while live, `spotRefit()` re-measures the spotlight without scrolling or animating. The ResizeObserver from the fade cue triggers it.
- The card has z-index 1001 because it is no longer in the top layer.
- Tests: try-test checks that during the tour only the region and the card are live. On phones it checks that the archetype list scrolls on wheel at stop 1 and the page does not move. It also checks that Esc from inside the region ends the tour and leaves nothing inert. All six suites pass.
