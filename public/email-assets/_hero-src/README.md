# What's New hero — source

The hero used to be a flat PNG with the date, count and summary baked in, and no
source, so every release meant reverse-engineering it. It is now reproducible:

- `hero-plate.png` — the backdrop, rebuilt from first principles. The gradient is
  `obs = a + b*(x+y)` per channel with
  `[(73.52,-0.022055),(102.77,-0.024334),(237.79,-0.027775)]`, and the watermark
  is the three brand-mark paths from the app's own `src/Images/apps/chatdaddy.svg`
  at `translate(501,-119) scale(25.5)`, composited at alpha `0.105`.
  `mark-mask.png` is that mark rendered white-on-black.
- `hero.html` — the copy layer. Render at 553x230 CSS with `deviceScaleFactor: 2`
  (Playwright, `scale: 'device'`) to get the 1106x460 asset.

Keep the body to three lines; a fourth runs into the watermark.
