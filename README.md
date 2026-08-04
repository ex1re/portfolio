# Portfolio

A photography / creative portfolio site built with React, Vite, and Tailwind CSS.

**Live site:** [portfolio-liard-one-48.vercel.app](https://portfolio-liard-one-48.vercel.app/)

## Tech stack

- [Vite](https://vite.dev/) + React + TypeScript
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [React Router](https://reactrouter.com/) for page navigation
- [Framer Motion](https://motion.dev/) for animation and page transitions

## Getting started

```bash
npm install
npm run dev
```

Opens the dev server at `http://localhost:5173`.

## Other commands

```bash
npm run build     # type-check and build for production into dist/
npm run preview   # preview the production build locally
npm run lint      # lint the project
npm run photos    # re-read photo dimensions (runs automatically on dev/build)
```

## Project structure

```
public/photos/
  selections/                 # the scattered pile on the garden page
  collections/<slug>/         # one folder per album
  previews/                   # generated, git-ignored — don't edit
public/models/
  text-cylinder.glb           # geometry only, texture drawn at runtime
src/
  components/                 # Nav, PhotoImage, Lightbox, and other shared UI
  pages/                      # Home, Work (garden), Project, CollectionDetail, About, Cellar
  data/                       # hand-written metadata
    generated/                # auto-generated photo data — don't edit
scripts/
  generate-photo-manifest.mjs # reads sizes, writes previews
  strip-glb-texture.mjs       # one-off: removes a GLB's baked texture
  build-favicon.mjs           # one-off: outlines the logo into the favicon
```

## The favicon

The logo mark, as `favicon.svg` plus PNG fallbacks. The source artwork sets
"ex" as live text in Pinyon Script, which a favicon can't load — anywhere the
face isn't installed it falls back to a default serif and the script is lost.
So the lettering is converted to outlines once and committed:

```bash
node scripts/build-favicon.mjs /path/to/PinyonScript-Regular.ttf
```

The SVG carries its own `prefers-color-scheme` rule, so the near-black mark
inverts to light on a dark tab strip rather than disappearing into it. The PNGs
can't adapt, so they sit on a light disc that reads either way.

## The office cylinder

The verse on the office page is the exported `text-cylinder` model, rendered with
three.js. Its geometry is UV-mapped, so the poem is painted to a canvas in
Instrument Serif and bound as the texture — the words are yours rather than the
exporter's baked-in placeholder copy. Drag to turn it, scroll to zoom; it
turntables on its own until you touch it, and holds still under
`prefers-reduced-motion`.

The original export is 1.1 MB, of which 99% is that placeholder texture. It was
stripped once, leaving 11 KB of geometry:

```bash
node scripts/strip-glb-texture.mjs <original>.glb public/models/text-cylinder.glb
```

three.js is a large dependency next to everything else here, so the page loads it
as its own chunk — nothing else on the site pays for it, and the garden fetches
none of it. Where WebGL is unavailable the poem falls back to plain text.

## Adding photos

Drop in **one full-resolution file per photo** — you don't need to resize or
measure anything. The build reads each file's real dimensions (applying EXIF
orientation) so frames fit any shape without cropping or letterboxing, and writes
a compressed preview alongside it.

Pages load only previews. The full-size file is fetched by the lightbox alone, so
browsing stays light and the full detail is still there when someone opens a
photo.

**The home page photograph** — drop one image into `public/photos/home/`. It
appears beside the opening words on desktop and below them on a phone, standing
on the foot of the page. Being the one photo shown large, it gets its own pair of
renditions rather than the standard preview — 1600px and 3000px, cut straight
from the original at high quality — and the browser picks between them on the
width the slot asks for.

Its fade into the page is **blended into the file**, not masked over it at
display time. A CSS mask is composited live, and over a wide band in near-black
its quantised alpha resolves into visible rings; blending once at build time, in
floating point with the rounding dithered, leaves the border exactly the page's
colour and nothing in between. The build finds the subject on its own — the lit
part of the frame — and fades only the clear margin around it, so no tuning is
needed when the photo changes. If the folder is empty the page falls back to the
words alone, full width.

**A collection (album)** — drop images into `public/photos/collections/<slug>/`,
matching a `slug` in [`src/data/collections.ts`](src/data/collections.ts). They're
ordered by filename, so prefix them (`01-`, `02-`) to arrange them. The first
photo becomes the album cover, and the photo count updates itself.

**A selection (a photo in the garden pile)** — drop the image into
`public/photos/selections/`, then set `image` on its entry in
[`src/data/projects.ts`](src/data/projects.ts):

```ts
{ slug: 'coastline', title: 'Coastline', /* … */ image: 'coastline.jpg' }
```

Then restart `npm run dev` (or run `npm run photos`) to pick up the new files.

Two things stay deliberately manual: the `width` and `rotate` values in the
`layout` array in [`src/pages/Work.tsx`](src/pages/Work.tsx), which compose how
the pile is arranged; and the titles, years, and descriptions in the data files.

Until a photo file exists, an entry falls back to its gradient placeholder and
its `aspect` value, so the site always renders. Those gradients also show behind
real photos while they load.

Supported formats: `.jpg`, `.jpeg`, `.png`, `.webp`, `.avif`, `.gif`.

### File sizes

Previews are generated for you, so the only file you control is the original —
the one the lightbox serves. Long edge **2400px at quality ~82** (usually
400–800 KB) is a good target: enough for a full-screen view on a retina display
without being wasteful. Beyond ~3000px nobody sees the difference here, since the
lightbox caps at 768px wide.

Previews come out at 1200px on the long edge as WebP, typically 100–250 KB, which
covers the widest grid slot at 2× density.

Keep camera originals out of the repo — a 40MP file is tens of megabytes, all of
it committed and none of it served. Cut a web master first (3000px is generous;
the largest rendition the site serves is 2400px) and keep the full-size file
wherever you archive your work.

Tuning lives at the top of
[`scripts/generate-photo-manifest.mjs`](scripts/generate-photo-manifest.mjs)
(`PREVIEW_EDGE`, `PREVIEW_QUALITY`). Previews are cached by modification time, so
re-runs only rebuild what changed, and previews whose original was deleted are
cleaned up automatically.
