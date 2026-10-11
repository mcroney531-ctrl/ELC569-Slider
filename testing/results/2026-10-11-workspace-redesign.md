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
- All 119 element IDs from before are present exactly once afterwards (ledger check in the test run). Nothing was cloned, replaced or re-ID'd.
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
- The sticky read-out is aria-hidden and does not intercept clicks (found by a flaky click in testing).
- Collapsed summary text ("3 personas · Typical · Straight through") is plain text, not a live region.
