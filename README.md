# Portfolio

A photography / creative portfolio site built with React, Vite, and Tailwind CSS.

**Live site:** _add URL after deploying_

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
```

## Project structure

```
src/
  components/   # Nav, PageTransition, and other shared UI
  pages/        # Home, Work, Project detail, About
  data/         # project/photo metadata
  hooks/        # custom React hooks
```

## Content

Project data lives in [`src/data/projects.ts`](src/data/projects.ts) — add real photos and project details there as they're ready. Placeholder gradients stand in for images until then.
