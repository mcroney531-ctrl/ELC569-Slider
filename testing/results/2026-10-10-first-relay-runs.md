# First relay runs: ChatGPT vs Claude (Marcus Reed, Panel S224)

Same prompt (v2, P6-C1-J2), same persona (Marcus Reed, Newcomer), live main build, plain chat with a human relaying screenshots.

## Scores (A–I rubric)

| | Criterion | ChatGPT (15 turns) | Claude (16 turns) |
|---|---|---|---|
| A | Start | Pass | Pass |
| B | In character | Partial: no [bracketed actions]; some reviewer voice | Pass (one slip at T13: "the route here says...") |
| C | No invented UI | Pass | Pass |
| D | Route | Pass | Partial: Describe labelled "visit 1 of 2" for T1–T5, then "1 of 1" |
| E | Challenge level | Pass | Pass |
| F | Persona fidelity | Partial: profile says he hovers on jargon; he never does | Pass: hovers, rereads, hesitates throughout |
| G | Relay format | Pass | Pass |
| H | End log | Pass | Pass, more detailed |
| I | No predictions | Pass | Pass |

Relay notes (ChatGPT run): operator clicked Lock panel without being asked (T14→T15); chat reused from an earlier "open the browser" exchange. Neither affected the persona's behavior much, but Lock discovery went untested in that run.

Verdict: the persona contract holds under relay in both models. Claude plays the character more faithfully; ChatGPT is cleaner on structure. Both completed the route and the journey check correctly.

## Tool findings (main build)

1. **Export is hidden behind "Lock panel."** Claude's Marcus scrolled to the bottom, found no export, and clicked Lock only because nothing else was left. (Branch: renamed "Review & export" plus a next-step cue.)
2. **"We'll build six simulated users" vs a default panel of 3.** The form help text promises six; the panel shows three plus dashed "Open" seats that explain nothing on hover.
3. **Thin input produces confident specifics.** From "An e-learning module for my team" / "My team", the panel invented a course structure, an acronym ("TRP"), "the client case from last month" and patchy mobile data. ChatGPT's Marcus began to distrust the panel.
4. **Nothing pushes for enough input.** Both Marcuses typed one line and left the moments blank. (Branch: soft nudge under 80 characters.)
5. **Auto-picked moments look as certain as typed ones.** "Inferred" appears on the audience line only, and isn't explained.
6. **Worker phrasing leak:** "Members of the requester's own team".
7. **Jargon:** seat, coverage lens, recovery states, journey, ".md", "AI test prompt (trial)". Mixed result: ChatGPT's Marcus found the intro enough; Claude's forgot it by the time he needed it.
8. **Role confusion:** Claude's Marcus treated the personas as learners taking his module and never realised he was meant to play them.
9. **Brief vs AI prompt:** both Marcuses chose the walkthrough brief; ChatGPT's said the brief "tells me how to run each person".

## Proposed next changes (branch)

- Change "We'll build six simulated users" to match what appears (or explain the Open seats).
- Worker: when the description is thin, write generic examples instead of invented specifics; mark inferred moments; say "your team", not "the requester's".
- One plain line in the export area: "You play each persona as you test your build."
- Keep the walkthrough brief as the default export.
- Then: the short material-sharing run with the prompt as shipped.
