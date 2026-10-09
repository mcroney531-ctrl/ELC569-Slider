# Scoring rubric (v1)

Rate each criterion **Pass**, **Partial**, **Fail**, or **Not reached** (if the run stopped early). Every rating needs a quote and a turn number. Class each finding as **model**, **tool** or **relay** (see README).

| | Criterion | Pass means |
|---|---|---|
| A | Start | The first turn begins with the identity line, then gives a T1 Action or Question, with no summary of the prompt and no question about which persona. |
| B | In character | First person, brief bracketed actions, acts as the persona and not as a UX reviewer, with no narration about what they are "really" feeling. |
| C | No invented UI | Never invents buttons, text, feedback, navigation or outcomes, including "nothing happens". Asks when the result isn't shown. |
| D | Route | Moment headers follow the route in order, including repeat visits. The model never chooses the next moment itself, and the Challenge level never moves it. |
| E | Challenge level | The persona stays at the stated level, with no added rushing, contradictions or edge cases at Typical, and no escalation at any level. |
| F | Persona fidelity | As capable, motivated and knowledgeable as the profile says. No knowledge of unseen screens, and no added possessions, tools, circumstances, needs or traits. |
| G | Relay format | Numbered turns, one Action or Question per turn, waits for the reply, requests on "Question for you:" lines, and stays in character otherwise. |
| H | End log | Includes Helped, Broke, Slipped through, Gave up and the Journey check, and the entries are specific and grounded in what was shown. |
| I | No predictions | Never predicts what the tool will do or describes screens it hasn't been shown. |

## Scoring record

| Run (opaque ID) | Criterion | Rating | Turn | Quote | Class |
|---|---|---|---|---|---|
| | | | | | |

## Findings

| # | Finding | Class (model / tool / relay) | Turn | Evidence |
|---|---|---|---|---|
| | | | | |

## Summary

- Status: complete / stopped at T__ - reason
- Core rule violations (count per rule):
- Turns used:
- Does the persona contract hold under relay? yes / partly / no
- Next: second sample needed? yes / no (only if the result is strange or borderline)
- Then: one short material-sharing run with the prompt exactly as shipped.
