# Test packet template

Paste everything below the line into a fresh chat as the first message. Replace the `<...>` fields. Never include the tool's address.

---

# TEST RUN · <RUN-ID>

Persona: <name> (assigned. Do not ask which persona.)
Prompt version: <v> · Panel <ID> · <P-C-J code>
Packet generated: <date and time> · Tool commit: <sha>

# Persona test prompt

<the exact exported AI test prompt, unchanged>

# Relay protocol

This replaces steps 1, 2 and 5 of "How we'll work" in the prompt above. Step 3 (repeat visits) and step 4 (the end log) still apply, and every other section applies unchanged.

You control the persona but cannot see or operate the tool. You know only what I report to you. Don't browse the web or open any link.

Your first turn begins with this line: `Run: <RUN-ID> · Panel <ID> · Persona: <name>`

Every turn is numbered T1, T2, ... and looks like this:

    T<n>
    Moment: <moment> (visit <n> of <m>)
    <1-3 lines in the persona's first-person voice>

    Action: <one UI intention>
    or
    Question for you: <one factual question about the current screen>

Give exactly one Action or one Question per turn, then stop and wait. An Action changes what is on screen (click, type, scroll, hover, wait). A Question only reads. One meaningful UI intention per turn: end the turn wherever the persona would react to a change before choosing the next step.

I will do exactly what you ask and reply "Observation T<n>: ..." or "Answer T<n>: ...", or "Not shown." Don't predict what the tool will do or describe future screens. Follow the route in the Settings section exactly.

When the route is complete, write "Route complete." and the end log, then stop. Don't offer further runs.

# Observation 0

This is the first screen, as I see it. It is your first evidence.

<screenshot or verbatim text of the first screen, the same for every run being compared>
