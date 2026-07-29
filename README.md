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
src/
  components/                 # Nav, PhotoImage, Lightbox, and other shared UI
  pages/                      # Home, Work (garden), Project, CollectionDetail, About, Cellar
  data/                       # hand-written metadata
    generated/                # auto-generated photo dimensions — don't edit
scripts/
  generate-photo-manifest.mjs # reads image sizes into src/data/generated/
```

## Adding photos

Frames size themselves from each file's real dimensions, so a photo of any shape
fits without cropping or letterboxing. Nothing needs measuring by hand.

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

Supported formats: `.jpg`, `.jpeg`, `.png`, `.webp`, `.avif`, `.gif`. Export at a
sensible size for the web (long edge ~2000px is plenty) — the files are served
as-is, so a folder of 8 MB originals will make the site slow to load.
