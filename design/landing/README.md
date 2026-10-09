# Landing page artwork

Source: the landing-page visual handoff (three character cutouts). The page embeds these as
WebP data URIs so it stays one self-contained file; these PNGs are the cleaned sources.

Cleanup applied to the supplied `character-left`, `character-center` and `character-right` files:
- removed a stray fragment of a neighbouring figure on the center image's left edge
- filled see-through pixels inside the figures (the left figure's teeth)
- trimmed the pale 1px fringe left around the silhouettes by the background removal, and smoothed the edge
- cropped to the figures

The three files named `character_female`, `character_male` and `character_male_glasses` in the same
handoff were not used: they carry caption text from the contact sheet they were cut from.

The images are small (about 170 px wide). They look sharp on standard screens and slightly soft on
high-density screens; a 2x version of the three figures would fix that.
