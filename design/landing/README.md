# Landing page artwork

Masters: transparent PNGs isolated from the GPT board, numbered as in the board spec. These are the
sources; the page embeds optimized WebP derivatives (trimmed to the artwork, sized at about 2x the
largest display size) as data URIs so it stays one self-contained file.

| # | File | Role on the landing page | Accessibility |
|---|------|--------------------------|---------------|
| 1 | `01-lightbulb.png` | idea bubble, top left | decorative |
| 2 | `02-woman-laptop.png` | left figure | decorative (the group has one label) |
| 3 | `03-thinking-man.png` | center figure | decorative |
| 4 | `04-chat-bubble.png` | chat bubble, top center | decorative |
| 5 | `05-bearded-man.png` | right figure | decorative |
| 6 | `06-question-bubble.png` | question bubble, top right | decorative |

CSS controls display size, so the masters carry transparent breathing room and no baked sizing.
If a figure is later used to represent a specific test persona, it stops being decorative and needs alt text.

Replaces the earlier hand-cleaned cutouts (`character-left/center/right.png`, about 170 px wide), which
were soft on high-density screens. Those remain in git history.
