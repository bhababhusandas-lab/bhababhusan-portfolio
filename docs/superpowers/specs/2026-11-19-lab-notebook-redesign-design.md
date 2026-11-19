# Lab Notebook redesign — design

Approved 2026-11-19. Replaces the v1 editorial design (kept in `_backup-v1/`).

## Concept
The portfolio is an engineer's lab notebook. Graph-paper grid background, technical-drawing details
(dimension lines, title block, sheet numbers), and one circuit trace down the left edge that powers on
as the visitor scrolls. Each section is a node the current reaches.

## Content
Same content as v1: bio text, photo, 4 projects (`projects.js`), education, toolbox, approach, email.

## Visual system
- Paper theme: paper `#f3efe4`, ink `#1d2321`, blueprint blue `#2747d9`, signal amber `#ff9a1f`.
- Blueprint theme (dark): navy paper, cyan lines, light ink; amber stays as the "live" color.
- Type: Space Grotesk (headings/body), JetBrains Mono (labels), Caveat (handwritten margin notes).

## Sections
1. Title block hero — name, dimension line, taped photo, drawing title-block table, power switch (theme toggle).
2. Experiments — `EXP-01…04` spec sheets (hypothesis, components BOM, status). Click unfolds a full sheet dialog.
3. Materials — story, circuit-style education timeline, toolbox as a bill-of-materials table, "more about me" dialog.
4. Method — 3-step flowchart with self-drawing arrows and a loop back.
5. Output — "Let's make something." with plug/socket; hover/focus or reaching the end connects it and lights the email.

## Behaviour
- Circuit: one SVG path built in JS from section node positions; `stroke-dashoffset` follows scroll; nodes light when reached; spark at the tip.
- Reveal-on-scroll and handwriting reveal via IntersectionObserver.
- Theme saved in `localStorage` (`portfolio-theme`), wrapped in try/catch.
- `prefers-reduced-motion`: circuit fully lit, no animation.
- Mobile (≤700px): single column, circuit becomes a thin rail at the left edge.

## Files
`index.html`, `styles.css`, `script.js` rewritten; `projects.js` unchanged; `world3d.js` left unused.
