# Notes for working on this repo

Things that cost time to work out the first time, and that the code alone
doesn't explain. The README covers how to *use* the site; this covers how to
change it.

## Running commands

Node is installed through nvm, and every shell starts fresh, so any command that
touches node or npm needs the prefix:

```bash
export NVM_DIR="$HOME/.nvm" && . "$NVM_DIR/nvm.sh" && npm run build
```

Without it you get `command not found: npm`.

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server on 5173. Regenerates the photo manifest first. |
| `npm run photos` | Reads `public/photos`, writes previews and `src/data/generated/photo-manifest.ts`. Warns about camera-sized files. |
| `npm run trim` | Cuts 2400px web masters in place; archives originals to `~/Pictures/exire-originals`. `-- --dry` to preview. |
| `npm run build` | Type-check and build. |
| `npm run lint` | oxlint. |

## The home photograph's fade is tonal, not a mask

`public/photos/home/` holds one photograph, and it meets the page with no
visible border. **This is done by setting its black point to the page's own
colour** (`HERO_BLACK_POINT` in `scripts/generate-photo-manifest.mjs`) —
everything darker than ~30/255 becomes exactly `#0a0a0a`, everything above is
stretched back up to keep contrast. About 87% of that frame is now literally the
background.

Do not replace this with a CSS mask. Four attempts were made — linear edge
ramps, wider ramps, eased multi-stop ramps, an elliptical arch — and every one
was visible at full brightness:

- A night frame has no edge to hide. It has a *sky* a few levels off the page,
  so the boundary the eye finds is wherever the fade stops, not the frame edge.
- A mask's alpha is quantised to 8 bits and composited live. Across a wide band
  in near-black that resolves into rings. Multi-stop easing made it worse: every
  stop is a corner in the alpha, and stacked corners in two axes read as
  concentric contours.

The home page's `<img>` therefore carries no mask class, and `.blend-edges` no
longer exists in `src/index.css`.

Consequences elsewhere: the picture's top third is now background-coloured
pixels, which the layout still counts as height. Where the page stacks, the
photo is pulled up under the words with a negative margin, its wrapper takes
`pointer-events-none` so the link beneath keeps its target, and the text column
sits at `z-10` — those pixels are *opaque*, so without it the picture painted
over "Enter the garden".

## The garden pile

`layout` in `src/pages/Work.tsx` is per-slot `left`/`top`/`width`/`rotate` in
percent, and `zIndex` is DOM order (`index + 1`), so later entries paint on top.

Two things are easy to get wrong:

- **Width follows the photo's ratio, not the slot.** `top`/`width` are percentages
  of the container, so a photo's height is `width × containerAspect / photoRatio`.
  A portrait at a landscape's width stands nearly twice as tall and takes 2.2×
  the area. Widths are set from the ratio (∝ `ratio^0.4`), which lands portraits
  about 1.19× a landscape by area.
- **The frame's aspect is the vertical-spread knob.** Positions are percentages,
  so a taller frame pulls the same photos apart. A phone frame of 3:4 split the
  pile into two bands with a quarter of the frame empty; it's 4:3 now, 16:9 from
  `lg`.

The positions were searched, not eyeballed: rotated rectangles stacked in paint
order, scored on how much of each is left showing, hill-climbed with restarts.
Every photo keeps at least half of itself in view and the pile averages ~70%. If
you move one by hand, check what it buries.

To measure the real thing, hit-test the rendered pile — sample points inside each
card's rotated rect and ask `document.elementFromPoint` what's on top.
**Reload first.** Clicking a photo sets `activeIndex`, which lifts it to
`z-index: 50`, and a stale active card will make a neighbour look 30% buried when
it isn't.

## The foot glow

`BottomGlow` stands over the bottom 70px of the viewport once a page reaches its
end, softening the white the browser reveals on rubber-band overscroll. It has a
`backdrop-blur`, so **anything the page ends on needs clearance** — `SiteFooter`
carries `pb-24` for exactly this reason.

## Entrances

The home photograph and the office cylinder share a beat: 1.9s delay, 1.6s ease.
The cylinder additionally waits on itself — `PoemCylinder` calls `onReady` when
its geometry and texture exist, and `About` reveals it at whichever is later,
with a 4s backstop for browsers where WebGL never arrives.

## Typefaces

Helvetica (`--font-sans`, with Arial as the metric-compatible fallback) for
titles and body; Pinyon Script for the logo; Space Grotesk for the nav;
Instrument Serif for the poem on the cylinder.

## Verifying changes in the preview pane

The pane renders hidden, which breaks the obvious approaches:

- `requestAnimationFrame` runs at ~1fps and `setTimeout` is clamped to ~1s, so
  CSS transitions and Framer animations barely advance. An opacity read taken
  "after 400ms" is meaningless; take several samples over seconds and read the
  *order* of events rather than the clock.
- WebGL contexts are lost, so the office cylinder shows its prose fallback.
  That's the pane, not a bug.
- Screenshots are often scaled or letterboxed oddly after a resize.

So verify by measuring, not by looking: `getBoundingClientRect`,
`getComputedStyle`, `document.elementFromPoint`, and canvas pixel reads of a
served image all work and are exact. Screenshots are for showing the user, not
for deciding whether something is right.

## Deep links need the rewrite

Routing is client-side, so the server only ever has `index.html` to give. Without
`vercel.json` every route but `/` returned 404 on a direct load or a refresh —
clicking through from the home page worked, which is why it went unnoticed. The
rewrite sends everything to `index.html` and lets the router take it from there;
Vercel checks the filesystem first, so `/assets/*` and `/photos/*` still serve as
files.

## Tailwind

v4, wired as a Vite plugin (not PostCSS). Design tokens live in `@theme` in
`src/index.css`. Arbitrary spacing steps like `-mt-25` work — the scale is
computed, not enumerated.
