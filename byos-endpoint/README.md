# BYOS endpoint

The page (`../index.html`) works on its own with the bundled sample panel. This endpoint adds **Try it with your own project**. It makes one model call per Build or Rebuild and returns a validated panel as JSON. Moving the sliders never calls it.

It is a Cloudflare Worker. The code is plain `fetch` handler JavaScript, so it can be ported to another serverless host if you prefer.

## Deploy

1. `npm install`
2. `npx wrangler login`
3. `npx wrangler secret put ANTHROPIC_API_KEY` (the key lives only in the Worker, never in the page)
4. Optional global daily ceiling: `npx wrangler kv namespace create BYOS_KV`, then paste the id into `wrangler.toml`.
5. `npx wrangler deploy`
6. Put the Worker URL in `index.html`:
   ```html
   <meta name="byos-endpoint" content="https://byos-panel.<your-subdomain>.workers.dev">
   ```

Also set a spend limit on the API key's workspace in the Anthropic Console as the final backstop.

## Request and response

`POST` with `{ "testing": "...", "audience": "...", "moments": ["", "", "", ""] }`.

Success returns `{ "panel": { experience, personas } }`:
- **experience:** summary, audience, and 4 key moments, each with `short` and `full`.
- **personas:** 6 of them. Each has a stable core plus a `baselineSaysOrDoes` example, and 3 challenge overlays (Rushed, Inconsistent, Edge case).

Errors return `{ "error": "..." }` with a 4xx or 5xx status. The page shows that message and keeps the current panel.

## Protection

The endpoint is public and credentialless. It doesn't use Origin checks, because a packaged Storyline web object can send `null` and an allowlist wouldn't stop scripted abuse anyway.

| Control | Setting (`wrangler.toml` vars) |
|---|---|
| CORS | `Access-Control-Allow-Origin: *`, POST only, no cookies |
| Input caps | 2,000-byte body; situation 300 chars, audience 120, moments 24 each |
| Per-IP throttle | `PER_IP_PER_HOUR` (default 5) |
| Concurrency | `MAX_CONCURRENT` (default 3) |
| Daily ceiling | `DAILY_LIMIT` (default 200), only when `BYOS_KV` is bound |
| Output cap | `max_tokens` 12,000 |
| Timeout | `TIMEOUT_MS` (default 80,000); the page gives up at 90 seconds |
| Validation | Request fields before the call; response shape after the call (structured outputs + the same checks the page runs) |

The throttle and concurrency counters are held in memory per Worker instance, so they're a best effort. The KV counter is eventually consistent, so the daily ceiling is approximate. The console spend limit is the hard stop.

## Model

The default is `claude-opus-5-5` at `medium` effort, with server-side refusal fallbacks (`fallbacks: "default"`). To trade quality for cost or speed, set `MODEL` in `wrangler.toml`.

## Test

`npm test` runs the handler against a fake model client. It needs no network or key.
