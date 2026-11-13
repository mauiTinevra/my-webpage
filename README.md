# my-webpage

A personal site built as a street: painted walls, roll-up shutters for the blog, art, code and journal, and spray cans for visitors. Built with
[Astro](https://astro.build) and hosted on Vercel. Every push to `main` redeploys it.

## How the home page works

The home page is a stack of rows. Scrolling walks along a row from Sam to Journal,
then drops down to the next row, which presents the same five places a different way.

- Row 1, the street: `src/components/rows/StreetRow.astro`
- Row 2, the posada (Christmas piñatas): `src/components/rows/PinataRow.astro`
- Row 3, the living room: `src/components/rows/LivingRoomRow.astro`
- Row 4, the outfitter's (clothes on a rail): `src/components/rows/WardrobeRow.astro`

A page is always four rows. After the fourth, scrolling climbs straight back up past all of them and through a sky to page two, a single full-page picture (`src/components/PageTwo.astro`). The picture is live: its sky follows the real time in Scottsdale, Arizona (`src/lib/sky.ts`), and the figure works through a selection of the Ashtanga primary and second series (`src/lib/yogi.ts`). Add `?hour=6.5` to the address to preview any time of day.

Scrolling on down from page two, the ground fades to black and page three is an arcade game in white pixels (`src/components/SpacePage.astro`).

Rows alternate direction (right, left, right, left). A row with `data-reverse` on its root runs right to left.

To add a row, create another component in that folder and place it in `src/pages/index.astro`.

## Changing things

| To change | Edit |
| --- | --- |
| Your name, intro line, footer links | `src/site.ts` |
| The pitch and contact email on the last page | `src/components/SellPage.astro` |
| Blog posts | add a Markdown file to `src/content/blog/` |
| Journal entries | add a Markdown file to `src/content/journal/` |
| Art | drop images into `src/assets/art/` (the file name becomes the caption) |
| Code projects | `src/data/projects.json` |
| Paintings in the living room | `src/assets/room/` |
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
