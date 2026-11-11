# Brightfold redesign v3: "NYT Games" direction

The user rejected the previous editorial paper/ember design as ugly and asked for a redesign based on
NYT Games (Wordle, Connections, Spelling Bee, Strands, the Games hub and splash screens). This brief REPLACES the
older "paper and ember" brief. Keep the earlier anti-slop spirit (unslop, CC BY 4.0, heydamir; taste-skill, leonxlnx):
no gradients, no glows, no violet-blue neon, no emoji, no fake-hype copy, nothing revealing on scroll, honour
reduced motion, no horizontal overflow at 320/375, 44px touch targets.

## The NYT Games look (what to reproduce)
- White page, near-black ink (`--ink`), thin grey hairlines. Playful but plain, content first.
- Chunky rounded **game tiles** in the Connections palette: `--tile` (#efefe6 neutral), `--yellow`, `--green`,
  `--blue`, `--purple` (+ `--orange`). Tiles are 6-12px radius, bold 600-700 uppercase-free sentence/Title text, centred,
  no borders (flat fill), a subtle press (scale .97). Colour carries meaning: each of the six domains owns a colour.
  Wordle-style feedback: correct `--good` green, present `--warn`, wrong/absent grey.
- **Splash / hub screens** like the Wordle and Connections launch screens: a large simple glyph (built from the real puzzle SVGs),
  a serif headline (Source Serif 4, weight 700), one-line subhead, then stacked pill buttons: black filled "Play" (or "Start the test"),
  outlined "How it works". Date line under (use "Free · 16 minutes · 20 questions"), small muted footer links.
- Buttons are **pills** (radius 999, height 48, 28px padding): black filled primary, white outlined secondary. Small 36px variant in header.
- Header: white, 56/64px, hairline under, wordmark in bold serif, small bold sans links, one small black pill "Start test".
- Game boards: centred column (max 560px on test screens), progress as a row of small rounded squares or a thin bar, a rounded
  "Submit/Next" pill under the board, a toast-style message above the board (black bg white text, 6px radius) for encouragement.
- Results like the Wordle/Connections end-card: big serif score, a coloured share-style tile row summarising domains
  (one coloured tile per domain, filled by performance), stats row (like Wordle's statistics: big numbers with small captions), and a
  black pill "Share" / "Download certificate" with an outlined secondary.
- Landing sections to include (structure may vary, avoid identical repeated card grids except where tiles are the game motif):
  1 hero splash (headline + pills + a live mini puzzle board), 2 "Six kinds of questions" as the colourful tile set (a Connections-style 3x2 or 2x3 board of
  coloured tiles, each opening into a short description; static, no accordion required), 3 how it works (three numbered steps, plain), 4 score curve with the
  bell, 5 stats row Wordle-style (placeholder tagged), 6 sample certificate, 7 FAQ with all answers visible (plain list), 8 closing CTA, footer.
- Fonts: Source Serif 4 (display, 600/700) and Libre Franklin (UI, 400/500/600/700). Loaded in index.html head from Google Fonts.
- Motion: transform/opacity/colour only; one load animation on the hero tiles (tiles flip/pop in sequence 60ms stagger, 200-240ms each) is welcome;
  tile press and correct/incorrect feedback (small shake 300ms for incorrect, pop for correct) are in the spirit. Nothing on scroll.
  Honour `prefers-reduced-motion` and `html[data-motion="off"]`.
- Copy: plain, short, no exclamation overload, no hype words. Placeholder facts keep `<span class="ph-tag">Placeholder</span>`.
- Radii 6/12/16 and pill 999 only. Weights 400-700 allowed now. Shadows: none except a single 1px hairline.

## Tokens
All in `base.css` (already rewritten for this direction): colours, `--f-display`, `--f-sans`, `--r-s/m/l/pill`, `.btn`, `.btn-primary`, `.btn-line`, `.btn-sm`,
`.nav`, `.logo`, `.nav-links`, `.link`, `.label`, `.ph-tag`, `footer.closing`, `.wrap`, `.lead`. Use them; do not redefine.

## File ownership
- landing: `index.html`, `landing.css`, `landing.js` (the head must load Source Serif 4 + Libre Franklin and base/landing/app css).
- app: `app.css`, `engine.js` (test screens, checkpoints, word memorize/recall, mock paywall gate, results, certificate, print).
- `base.css`, `data.js`, `DESIGN.md`: read-only for agents. Keep every element id/class that JS reads (or update it in the file you own).

## Load order
`data.js` -> `engine.js` (injects `#app` over `<div id="shell">`) -> `landing.js`. `.js-start` buttons start the test. `#app` shown, `#landing` hidden while testing.
