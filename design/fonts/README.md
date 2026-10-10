# Fonts

**Instrument Sans**, by the Instrument Sans Project Authors (https://github.com/Instrument/instrument-sans),
licensed under the SIL Open Font License 1.1 (https://openfontlicense.org), which allows embedding in web pages.

`InstrumentSans-latin-wght400-700.woff2` is the Latin subset of the variable font (weights 400 to 700), as served
by Google Fonts. The page embeds it as a data URI in `index.html`, so it makes no font request at all.

- The tool uses weight 800 in a few places; Instrument Sans stops at 700, so those render at 700.
- Italic is not embedded; the few italic words (onboarding step 4 examples) use the browser's slanted version.
- Characters outside the Latin subset (for example Polish or Vietnamese letters in generated names) fall back to the
  next font in the stack ("Segoe UI", then the system font). To cover more languages, add the `latin-ext` subset.
