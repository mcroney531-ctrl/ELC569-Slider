# BYOS endpoint

The page (`../index.html`) works on its own with the bundled sample panel. This endpoint adds **Try it with your own project**. It makes one model call per Build or Rebuild and returns a validated panel as JSON. Moving the sliders never calls it.

It is a Cloudflare Worker. The code is plain `fetch` handler JavaScript, so it can be ported to another serverless host if you prefer.

## Order of work

1. **Spend limit (required).** In the Anthropic Console, create a dedicated workspace for this endpoint, set a monthly spend limit on it, and create the API key inside that workspace. The Worker refuses to run until `SPEND_LIMIT_CONFIRMED = "yes"`. This is the only hard ceiling: the Worker's own throttles are best effort (see Protection).
2. **Bakeoff.** Run the real-model comparison below and pick the cheapest config that reliably produces useful panels. `MODEL` has no default on purpose.
3. **Staging.** Deploy the chosen candidate to staging and try it from the real page.
4. **Production.** Set `MODEL`, `EFFORT` and a tightened `MAX_TOKENS` from the bakeoff, then deploy.

## Bakeoff

```bash
npm install
export BYOS_BAKEOFF_KEY=...         # a key from the spend-limited workspace (set the limit first)
node bakeoff/run.mjs                              # round 1
node bakeoff/run.mjs --playoff sonnet-low opus-low   # round 2, with your top two
```

In a Claude Code cloud environment, add the key as `BYOS_BAKEOFF_KEY`, because `ANTHROPIC_API_KEY` is reserved for Claude Code itself. That variables box is plain text, so delete the key after the bakeoff.

**Round 1 (breadth, 40 calls)** runs the 10 situations in `bakeoff/situations.json` against four configs: `haiku`, `sonnet-low`, `opus-low`, and `opus-medium` as the quality reference. The situations are a learning module, a form, a checkout with supplied moments, a game, a chatbot, an onboarding flow, a vague one-liner, an accessibility-specific course, an AI workflow, and one with instructions embedded in the input. Use it to eliminate the obvious losers.

**Round 2 (consistency playoff, 18 calls)** runs your top two configs on the three hardest situations (vague, accessibility, game), three times each. Pick the config whose *worst* run is still usable, not the one with the best single draw.

- **Pinned models:** every bakeoff request has server-side fallbacks turned off (`FALLBACKS = "off"`), so each row is the named model's own work. The model that served each response is recorded, and any run served by a different model is discarded. Production fallback behavior is a separate decision, made after the winner is chosen.
- **Prompt and checks:** it uses the endpoint's own prompt, schema and validation, so what passes here is what the page would get.
- **Cost:** likely a few dollars for both rounds. Each report states its total.
- **Output:** written to `bakeoff/results/round1-…` or `playoff-…`, which are gitignored.
  - `report.md` has the per-config summary (valid count, latency, output tokens, cost per panel, a suggested `MAX_TOKENS`), a consistency table in the playoff, and every panel laid out for reading.
  - It also has heuristic flags. For the accessibility situation, it flags context kept by no stable persona, context given to all six (flattening the lenses), and context used in any overlay field.
  - `scores.csv` is for your 1–5 judgements: lenses distinct, Typical preserves the person, overlays are the same person, moments useful, and would you use it.
- **Dry run:** `BAKEOFF_DRY=1 node bakeoff/run.mjs` checks the harness with a fake model, at no cost.

Opus at medium is the reference for what "good" looks like, not the default.

## Deploy

1. `npx wrangler login`
2. `npx wrangler secret put ANTHROPIC_API_KEY` (add `--env staging` for staging). The key lives only in the Worker, never in the page.
3. Edit `wrangler.toml`: `MODEL`, `EFFORT`, `MAX_TOKENS`, and `SPEND_LIMIT_CONFIRMED = "yes"`.
4. Optional extra daily ceiling: `npx wrangler kv namespace create BYOS_KV`, then paste the id into `wrangler.toml`.
5. `npx wrangler deploy --env staging` (or `npx wrangler deploy` for production).
6. Put the Worker URL in `index.html`:
   ```html
   <meta name="byos-endpoint" content="https://byos-panel.<your-subdomain>.workers.dev">
   ```

## Request and response

`POST` with `{ "testing": "...", "audience": "...", "moments": ["", "", "", ""] }`.

Success returns `{ "panel": { experience, personas } }`:
- **experience:** summary, audience, and 4 key moments, each with `short` and `full`.
- **personas:** 6 of them. Each has a stable core plus a `baselineSaysOrDoes` example, and 3 challenge overlays (Rushed, Inconsistent, Edge case).

Errors return `{ "error": "..." }` with a 4xx or 5xx status. The page shows that message and keeps the current panel.

## Protection

The endpoint is public and credentialless. It doesn't use Origin checks, because a packaged Storyline web object can send `null` and an allowlist wouldn't stop scripted abuse anyway.

| Control | Setting |
|---|---|
| Spend | Workspace spend limit in the Anthropic Console (required, the hard stop) |
| CORS | `Access-Control-Allow-Origin: *`, POST only, no cookies |
| Input caps | 2,000-byte body; situation 300 chars, audience 120, moments 24 each |
| Per-IP throttle | `PER_IP_PER_HOUR` (default 5) |
| Concurrency | `MAX_CONCURRENT` (default 3) |
| Daily ceiling | `DAILY_LIMIT` (default 200), only when `BYOS_KV` is bound |
| Output cap | `MAX_TOKENS` (default 8,000; tighten from the bakeoff) |
| Refusal fallbacks | `FALLBACKS` (`"default"` or `"off"`); decide for production after the bakeoff |
| Timeout | `TIMEOUT_MS` (default 80,000); the page gives up at 90 seconds |
| Validation | Request fields before the call; response shape after the call (structured outputs + the same checks the page runs) |

The throttle and concurrency counters are held in memory per Worker instance, and the KV counter is eventually consistent. Treat them as abuse dampers, not limits. The workspace spend limit is the real one.

## Prompt policy on personal characteristics

The model never invents protected characteristics to create variety, and never uses them as challenge behavior. If the person's description names relevant audience context, such as screen-reader users, it is kept neutrally in the stable core of the personas it applies to. The `accessibility` bakeoff situation checks this.

## Test

`npm test` runs the handler against a fake model client. It needs no network or key.
