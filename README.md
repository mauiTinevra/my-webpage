# my-webpage

A personal site built as a street: painted walls, roll-up shutters for the blog, art, code and journal, and spray cans for visitors. Built with
[Astro](https://astro.build) and hosted on Vercel. Every push to `main` redeploys it.

## Changing things

| To change | Edit |
| --- | --- |
| Your name, intro line, footer links | `src/site.ts` |
| Blog posts | add a Markdown file to `src/content/blog/` |
| Journal entries | add a Markdown file to `src/content/journal/` |
| Art | drop images into `src/assets/art/` (the file name becomes the caption) |
| Code projects | `src/data/projects.json` |
| Photos on the home wall | `src/assets/photos/` and `src/pages/index.astro` |
| Colors, fonts, layout | `src/styles/global.css` |

A blog post starts like this:

```md
---
title: The title
date: 2026-11-12
summary: One line shown in the list.
---

The post itself.
```

A journal entry only needs a `date` (a `title` is optional).

## Running it locally

```sh
npm install
npm run dev
```
