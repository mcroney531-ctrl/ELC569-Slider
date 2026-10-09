# Live persona test: relay protocol (v1)

How to check that the AI test prompt holds up when a model plays a persona against the real tool. It is deliberately small: one repeated loop, a packet, a run sheet and a rubric. No backend and no helper UI.

## What this does and doesn't show

The product's normal use is **material-sharing**: you paste the exported prompt into an AI assistant and show it each moment (a screenshot, a script, a description).

This protocol is a stricter **relay** mode. The model decides what to do, a person performs it in the real tool, and reports what happened. A pass shows that the persona rules (stay in character, don't invent UI, Journey owns movement, Challenge stays put) survive a harder interaction model. It does **not** by itself prove the exported prompt works unchanged in normal use. After a relay pass, run one short material-sharing test with the prompt exactly as shipped.

## The loop

One model, one fresh chat, one freshly loaded tool, one run ID.

1. The model sends a numbered turn: `T1`, `T2`, ...
2. Each turn ends with exactly **one** `Action:` or `Question for you:`, then stops.
3. The person does exactly that action in the tool, nothing more, and replies `Observation T<n>:` (or `Answer T<n>:` for a question).
4. Repeat until the model writes `Route complete.` and the end log.

The person does not interpret the persona, plan the route, or decide what happens next. Their job is: read, do, report.

## Turn format

```
Run: RUN-7F2K · Panel S224 · Persona: Marcus Reed      (first turn only)

T1
Moment: Describe (visit 1 of 1)
<1-3 lines in the persona's first-person voice>

Action: <one UI intention>
```

A question turn is the same, but ends with `Question for you: <one factual question about the current screen>`.

- An **Action** changes what is on screen (click, type, scroll, hover, wait). A **Question** only reads.
- **One meaningful UI intention per turn.** Fields typed into one form are one intention. Split whenever the screen changes in a way the persona would react to (a build finishing, a slider moving, navigating), or whenever the persona's next choice depends on what the step produced.
- The model never predicts what the tool will do or describes future screens.

## Replies

| Situation | Reply |
|---|---|
| Action done | `Observation T3: "<verbatim visible text>"` and a screenshot if the policy below calls for one |
| Question | `Answer T4: "..."` |
| Not tried or not visible | `Not shown.` |
| No such control | `Observation T5: Not possible. <what is there instead>` |
| Waited | `Observation T6 (after 41s): ...` (say what stayed on screen while waiting) |
| Anything you did that wasn't asked, or any slip | `Relay note: ...` |
| The model repeated an Action | `T7 already done: <earlier observation>` and don't repeat it |
| The model asked for several actions | Do only the first, and add `Relay note: asked for 3, did 1` |

Observations quote visible text verbatim, describe the **current** state (not only what changed), include elapsed time for waits, and contain no interpretation ("it seemed confusing").

**Screenshots:** after a build finishes, the first screen of each new or repeated moment, and whenever something unexpected or ambiguous happens. Nothing more.

Never use "Regenerate", never edit a model turn, and never correct or coach the model during a validation run.

## Packet and Observation 0

The packet establishes identity, rules and provenance. **Observation 0** establishes reality: the first screen as a person sees it, as the first evidence. The model must know nothing about the tool that the person hasn't shown it. The packet never contains the tool's address, and it tells the model not to browse. See `test-packet.template.md`.

## Isolation

- Fresh private or temporary chat with memory off. Check that custom instructions are off, or record them.
- Freshly loaded tool in a new tab (it keeps nothing between loads).
- No contact between runs. Don't reuse choices from another run: the same packet, then let each run diverge.
- Opaque run IDs. The model-to-run key lives only on the run sheet.
- One run per model for a feasibility comparison. Run a second sample only if a result is strange or borderline.

## Stop rules

Record the stop and score what the evidence supports. Stop on:

- the third violation of the same core rule (invents UI, chooses the next moment, becomes a reviewer, escalates the Challenge level, uses unseen information, ignores the relay format);
- two consecutive turns out of character;
- about 40 turns;
- **immediately**, if the model begins browsing or opening the tool itself. That breaks the relay condition.

A single small slip is evidence, not a reason to stop.

## Closure and records

Every run ends with `Status: complete` or `Status: stopped at T<n> - <reason>`. Transcripts are never edited afterwards. Use `supersedes: RUN-xxxx` only when a later run intentionally replaces or retests an earlier one.

Keep, per run: the full transcript, the screenshots with turn numbers, and the completed run sheet (`run-sheet.template.md`).

## Scoring

Score from the transcript, with model names and obvious headers stripped. Perfect blinding isn't the goal. Reducing avoidable bias is.

Use `rubric.md`. Every rating needs a quote and a turn number. Every finding is classed as:

- **Model failure:** the prompt contract was broken.
- **Tool finding:** the tool behaved unexpectedly, or was unclear.
- **Relay failure:** the test was run wrongly (wrong packet, an unrequested action, a paraphrased observation, tool not reset).

Keeping the third class separate is what stops a testing mistake being read as a defect.
