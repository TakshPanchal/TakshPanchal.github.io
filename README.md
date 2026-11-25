# takshpanchal.github.io

Personal site and blog, live at https://takshpanchal.github.io. Built with [Astro](https://astro.build).

## Develop

Requires Node 24 (see `.nvmrc`).

```sh
npm install
npm run dev      # local dev server
npm run build    # static build to dist/
npm run preview  # serve the build
```

## Layout

- `src/pages/` – home, resume, hire-me
- `src/content/posts/` – blog posts (Markdown)
- `src/layouts/Base.astro` – shared layout
- `public/` – static files: `resume.pdf`, `resume.md`, `llms.txt`, OG images

## Deploy

Pushes to `main` deploy to GitHub Pages via `.github/workflows/deploy.yml`.
