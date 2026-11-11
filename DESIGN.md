# Brightfold redesign brief

The previous design was called AI slop: dark blue, a repeated bordered card on every section, centred
heading-then-grid rhythm, tracked uppercase labels, chips, glow, a logo marquee. This redesign replaces it
using two rule sets the user attached: **taste-skill** (leonxlnx) and **unslop** (heydamir, CC BY 4.0).

## Direction
Printed-matter feel, not SaaS. Warm paper ground (`--bg`), warm near-black ink, ONE ember accent
(`--accent`, under 3% of the screen: primary button, focus, one key figure, state). Display type is
Instrument Serif at weight 400, text is Geist 400/500. `base.css` already holds tokens, type scale, nav,
buttons, `.label`, `.link`, footer. Use its tokens; do not invent new colours, fonts or radii.
No dark mode (dark is for tech pages only). One dark band (`--dark`) is allowed on the landing page at most.

## Hard rules (both rule sets)
- NO cards-in-a-grid repeated. Never 3+ same-shape bordered rounded boxes in a row. Prefer ruled lists,
  tables, editorial columns, big numerals, running text with hairlines (`1px var(--line)`), one wide plate next to one narrow note.
  Vary section structure: no two adjacent sections share a layout.
- Layout asymmetry: text left / visual right, top-aligned, never mirrored or alternating. Left-align headlines.
  12-col grid, gutters 24. Spacing from 4,8,12,16,24,32,48,64,96,128 only. Section padding 96-128 desktop, 64 mobile.
- Colour: never violet/blue-purple, no gradients (the only `linear-gradient` allowed is the 1px link underline),
  no glows, no coloured shadows, no blurred blobs, no dot-grid or noise backgrounds. Depth = surface step + hairline.
- Type: weights 400 and 500 only. Never 600/700/800. Labels are sentence case 13px/500, NO uppercase, NO letter-spacing on small text.
  Display tracking -2% to -3% from 40px. Italic only for quotes. Lines <= 62ch. Curly quotes. No exclamation marks, no trailing periods on headings/buttons/labels.
- Icons: no emoji, no sparkle, no icon on every heading. If used, one line-icon set, 1.5 stroke.
- Buttons: 44px, 24px side padding, solid primary + tonal/text link. One filled button per view. No ghost, gradient, shadowed buttons. No pills (radius 6px).
- Radius: 6 / 10 / 16 only.
- Motion: transform/opacity/colour only. Tokens: hover in 150ms, out 120ms, press 90ms, panels 200ms, slide 240ms, image 600ms.
  Easing `--ease` (UI) or `--ease-in` (entrance settle). No bounce, no overshoot, no `transition: all`.
  NOTHING reveals, fades, rises or staggers on scroll (remove the old IntersectionObserver reveal).
  No parallax, no tilt, no glow/shine hover, no pulsing dots, no marquee/carousel/auto-advancing anything on the landing page,
  no accordions (FAQ answers are all visible). One hero entrance on load only (<=1.1s, lines rise out of masks 700ms/80ms stagger,
  then fade-up 12px). Hero text must be readable without JS. Honour prefers-reduced-motion and `html[data-motion="off"]`.
  Hover only inside `@media (hover:hover)`.
- Copy: plain statements, product nouns, no hype words (unlock, supercharge, seamless, magic), no "AI-powered", no greeting headlines, no badges/"New" pills.
  Placeholder facts stay clearly marked with `<span class="ph-tag">Placeholder</span>` (reviews, ratings, rankings, press, 99% claims, famous minds).
- No captions under images. No stock photos (there are none). Visuals are code-built: the real puzzle items (SVG via `cellSVG`, `polySVG`) are the imagery.
- Mobile: 375 and 320 must have no horizontal overflow, no text under 13px, buttons full width on phones, 44px touch targets.
- Accessibility: body text 7:1 where possible, muted 4.5:1, visible focus ring, labels on inputs.

## File ownership (parallel work, do not touch another owner's files)
- `index.html`, `landing.css`, `landing.js`: landing page owner. (`data.js` is shared and read-only.)
- `app.css`, `engine.js`: test app owner (test screens, checkpoints, word memorize/recall, mock paywall gate, results, certificate, print).
- `base.css`, `DESIGN.md`, `data.js`: read-only for both. Ask the lead if base needs a change.
- `_old/` holds the previous version (`old.css`, `old-index.html`, `app-shell.html`) for reference only. Do not ship it.

## Load order
`data.js` (shapes, item bank, ITEMS, renderMatrix) -> `engine.js` (injects `#app` shell over `<div id="shell">`, engine, `bell`, `certHTML`)
-> `landing.js`. Landing buttons with class `js-start` start the test (engine wires them at load). The app shows `#app` and hides `#landing`.
Keep all existing element ids that JS reads, or update the JS in the same file you own.
