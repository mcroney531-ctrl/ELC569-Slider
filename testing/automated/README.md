# Automated browser tests

Playwright scripts that run against `index.html` in this repo (no server needed). Each prints `ok` / `FAIL` lines and ends with `ALL PASS` or a failure count.

```
node testing/automated/jr-tour-test.js   # journey window during the tour (stops 2 and 3): usable, closes every way, tour intact
node testing/automated/tour-regress.js   # tour isolation: outside the region blocked, Tab contained, every way out frees the page
node testing/automated/copy-verify.js    # final intro copy: exact wording, layout at 320/390/1280, no horizontal overflow
```

Rule: a test used as evidence for a merge is committed here, not left in a temporary folder.

Earlier suites (Try it isolation, generation lifecycle, focus and accessibility, exports, loading screen) were lost with a temporary container. Rebuild them here gradually, in that priority order.
