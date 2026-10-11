# Segmented workspace redesign: implementation record

Branch work only. Presentation and motion; no change to the Worker, generation, sliders, exports or prompts.

## What changed (structure)
Four sections on one dark page, in this DOM and focus order:
1. **Your project**: header (icon, title, panel id, summary, For line) with the existing `#own` / `#fresh` buttons; the existing form (`#byos`) is its collapsible content, closed by default as before.
2. **Shape your panel**: a disclosure (`#shape-btn`, `aria-expanded`/`aria-controls="shape-panel"`) around the existing controls, open by default.
3. **Test personas**: a disclosure (`#personas-btn`, `aria-controls="personas-panel"`) around Seats, the Journey link and the persona cards, open by default.
4. **Review and export**: the existing section, still hidden until "Review & export" is chosen.

Sections 2 and 3 are independent (any of the four open/closed combinations; nothing auto-closes another). Disclosure state is
separate from all data; collapsing never resets values.

## Preservation
- All element IDs from before are present exactly once afterwards (112; the 7 belonging to the removed pinned read-out are gone on purpose) (ledger check in the test run). Nothing was cloned, replaced or re-ID'd.
- Moved in the static markup only (before script runs): the project summary now sits inside the Your project section and the
  stage inside the Test personas section. Control order is unchanged apart from the two new disclosure buttons.
- Handlers, state, validation, exports and prompts untouched.

## Deliberate differences from the reference
- No portraits (decided with the owner); personas keep their coloured initial tokens.
- Review & export stays hidden until chosen (existing behaviour) instead of always showing as a collapsed row.
- No "View full panel" button, no Tip bar: neither exists in the product.
- The three-step list under the tool title is removed; the section titles and the intro screens say the same thing.
- Seats and persona cards stay pale surfaces on the dark page. Persona cards are three across (they carry more text than the reference cards).
- Motion uses the browser's Web Animations API (not GSAP), following the same timings: open 260 ms, close 230 ms; instant under reduced motion.

## Accessibility notes
- Disclosure is a real button inside the section heading; icons and chevrons are aria-hidden.
- Closing a section with focus inside moves focus to its button first, marks the content inert while it leaves, then hides it.
- Collapsed summary text ("3 personas · Typical · Straight through") is plain text, not a live region.

## Update: pinned P/C/J read-out removed
The sticky strip at the top is gone (markup, styles and the code that filled it). The same values remain visible in the three
slider pills and, when Shape your panel is folded, in its header summary. Its IDs (ro-*) no longer exist.

## Archetype avatars (added 2026-10-11)

- Initial-letter shapes (`LOOKS`, `SHAPES`, `tokenSVG`, `outlineSVG`) removed. One central mapping, `ARCHETYPE_CLASS`, keys the six icons by coverage lens (Core user, Newcomer, Experienced user, Time-constrained, Low confidence, Context outlier), never by persona name, challenge, journey or panel size.
- Seats: occupied = archetype icon; Open = same icon ghosted (opacity .3, grayscale). Persona cards use the same avatar (50px); roster 44–46px; copy chips 32px.
- Icons are decorative `aria-hidden` spans (CSS backgrounds): no extra tab stops, roster announcements unchanged, nothing added to exports, no independent animation.
- PNG masters in `design/avatars/`; runtime uses normalized 128px WebP data URIs (~32 KB total). The labeled reference sheet is not used at runtime.
- Verified: full suites pass; mapping unchanged after generating a different panel and changing Panel Size / Challenge / Journey, at 1100px, 360px and reduced motion.

## Horizontal workspace (added 2026-10-11)

- The three stacked disclosure sections became three stages (Project, Shape, Personas) with a `nav` of real buttons (`aria-current="step"`). Inactive stages are `display:none`, so they leave the reading order. Navigation never touches panel data or the Worker. Focus lands on the stage heading.
- The project form is a native modal `<dialog id="byos">` (focus trap, Esc, focus return, scroll lock; full-screen on phones). Cancel or Esc during a build aborts the request and leaves the current panel alone. A successful build closes it, goes to Shape and announces once.
- Shape keeps the native sliders and gains a compact live summary (six avatars, occupied vs ghosted, plus the text line). It is `aria-hidden`, not a live region, with no tab stops.
- Review & export (`#lock`) moved to the foot of Personas; `#review` opens in that stage. "Adjust settings" returns to Shape (from a locked export it behaves as "Adjust panel").
- Motion: Web Animations only (no GSAP); 16px direction-aware slide, 260ms; nothing under reduced motion.
- Removed: `secSet`, the disclosure buttons `shape-btn` / `personas-btn`. No other existing ID was removed.
- Tests: `stage-test.js` (new) plus the existing suites. The older suites run with a shim that shows every stage at once. The tab-order assertion moved into `stage-test.js`.
