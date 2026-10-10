# Fonts

**Plus Jakarta Sans**, by Tokotype (Gumpita Rahayu) and contributors (https://github.com/tokotype/PlusJakartaSans),
licensed under the SIL Open Font License 1.1 (https://openfontlicense.org), which allows embedding in web pages.

`PlusJakartaSans-latin-wght400-800.woff2` is the Latin subset of the variable font (weights 400 to 800), as served
by Google Fonts. The page embeds it as a data URI in `index.html`, so it makes no font request at all.

- Italic is not embedded; the few italic words (onboarding step 4 examples) use the browser's slanted version.
- Characters outside the Latin subset (for example Polish or Vietnamese letters in generated names) fall back to the
  next font in the stack ("Segoe UI", then the system font). To cover more languages, add the `latin-ext` subset.
