# The gallery: build standard and briefs

Six concept websites for imaginary small businesses in and around Phoenix, Arizona. They show
what Maui Tinevra (a web designer and developer in Scottsdale who sells custom interactive
websites) could build for a real client. One builder owns one folder. Nothing is shared between
sites: no templates, no components, no common CSS. They must not look related.

## Build standard (every site, no exceptions)

1. **Static and self-contained.** Plain HTML, CSS and JavaScript in your folder
   `public/gallery/<slug>/`. `index.html` is the site; `guide/index.html` is its guide. No
   framework, no build step, no CDN. All links and asset paths are relative, so the site works
   opened from disk (`file://`) and when hosted in a subfolder.
2. **Fonts are self-hosted.** The sandbox cannot reach Google Fonts. In a scratch folder
   (`/tmp/<slug>-fonts`, never the repo) run `npm init -y && npm i @fontsource/<name>` or
   `@fontsource-variable/<name>`, copy only the Latin `.woff2` files you use into
   `public/gallery/<slug>/fonts/`, and write `@font-face` rules yourself. Use the typefaces named
   in your brief. If a package is missing, pick the closest open-licensed face and say so in the guide.
3. **The customer's job comes first.** The first screen says what the business is, where, and
   gives the one action a customer came for (hours, book, order, visit). The signature moment
   sits near the top but never blocks that.
4. **Real copy only.** No lorem ipsum, no "Feature one". Plain, specific, warm. Sentence case.
   No exclamation marks, no em dashes, no marketing clichés ("elevate", "journey", "unlock").
   Prices, hours and addresses are written as plain facts.
5. **Honest about being imaginary.** A slim bar at the very top: "An imaginary business. A
   concept site by Maui Tinevra." with "Maui Tinevra" linking to `../` (the gallery). Phone
   numbers use 555-01xx, emails use `.example`. No real brands, real people, real logos, real
   song or book titles, or copyrighted characters. Invent everything.
6. **Color discipline.** Use the palette in your brief, split roughly 60 / 30 / 10. The accent
   is rare. Body text contrast is at least 4.5:1; check it.
7. **Drawings are code.** No stock photos, no generated images, no emoji as icons. Illustrations
   are SVG, canvas or CSS that you write, in one consistent style per site.
8. **One signature moment, built properly.** Your brief names it. It must really work (state,
   keyboard access, a sensible result), not be a looping decoration. Other motion only answers
   an action. Honor `prefers-reduced-motion`.
9. **Responsive and accessible.** Works at 390px and 1440px with no sideways scrolling.
   Semantic HTML, one `h1`, labelled controls, visible focus, tap targets at least 44px tall,
   everything reachable by keyboard.
10. **Zero console errors.** Sound never plays until the visitor asks for it.
11. **A sitemap footer**, then a last line: "Concept by Maui Tinevra" linking to `../`, and
    "How this was made" linking to `guide/`.
12. **Do not touch anything outside your folder. Do not run git.**

## The critique loop (mandatory, three passes)

After the first build, do this three times:

1. Render: `node tools/shot.mjs public/gallery/<slug>/index.html /tmp/<slug>/pass<N>` (run from
   `/home/claude/my-webpage`). It writes desktop and phone screenshots and prints console
   errors, page height, sideways overflow and loaded fonts. Use `--click "<selector>"` to
   capture the signature moment after an interaction.
2. Look: open the PNGs with the Read tool and critique them like a design director. Rhythm,
   alignment, contrast, cramped or empty areas, widows, anything clipped, anything that looks
   like a default template. Confirm your fonts are in `fontsLoaded`.
3. Fix what you found, then add one deliberate upgrade to craft (not more features).

Keep a short log of what each pass found and changed. It goes in your guide.

## The guide (`guide/index.html`)

A short page in the site's own visual language: the brief in two sentences, the palette and
typefaces, how the signature moment works (the real technique, with a small code excerpt),
what each critique pass found and fixed, and one honest limitation. Link back to the site.

## Final report

When done, report: files created, the three-pass log in brief, the final `shot.mjs` JSON
output for both sizes, and anything you could not finish.

---

## Brief 1: Ocotillo Records (`ocotillo-records`)

A used vinyl shop on Roosevelt Row in Phoenix. Buys collections, sells crate-dug records, has a
listening station. **Customer job:** today's hours, where it is, what came in this week.
**Look:** two-color risograph poster. Paper `#efe6d2` (60), ink blue `#1f2f6b` (30), fluorescent
orange-red `#ff5a36` (10). Misregistered overprint where the two inks overlap, coarse halftone
dots, slightly off-grid blocks. **Type:** Space Grotesk for display (tight, heavy), IBM Plex
Mono for prices and catalog numbers. **Signature moment:** a turntable drawn in SVG. Pick one
of four invented records from "this week's crate", it drops onto the platter, press play: the
platter spins, the tonearm swings in, and a short original loop plays, synthesized live with
the Web Audio API (a different groove per record: drums, bass, a lead), with vinyl crackle.
Pause lifts the arm. **Proof point:** synthesized audio with no audio files.

## Brief 2: Monsoon Clay (`monsoon-clay`)

A pottery studio in Tempe: wheel classes, memberships, kiln firing for outside work.
**Customer job:** class dates and prices, book a seat. **Look:** quiet studio catalog. Glaze
celadon `#cfe0d4` (60), iron black `#23211f` (30), oxide rust `#a4472a` (10). Thin rules, big
margins, numbers set like a kiln log. **Type:** Fraunces is banned; use Cormorant Garamond for
display and Karla for text. **Signature moment:** throw a pot. A vessel profile in SVG that
the visitor shapes by dragging handles (or arrow keys) at the foot, belly, shoulder and lip;
the pot is drawn as a lathed form with a few shaded bands so it reads as round, it turns
slowly on the wheel while being shaped, and the page names what was made (bowl, vase, cup,
bottle, plate) from the proportions, with the clay weight and the class that teaches it.
**Proof point:** generative SVG geometry driven by direct manipulation.

## Brief 3: Camelback Barber (`camelback-barber`)

A four-chair barbershop near Camelback Road. Walk-ins and bookings. **Customer job:** see the
next open chair and book it. **Look:** enamel shop sign and a tiled floor. Cream enamel
`#f4efe3` (60), oxblood `#6b1f2a` (30), brass `#c79a3b` (10), with a black-and-cream
checkerboard floor band. Bold sign lettering, pinstripe rules, a barber pole drawn in CSS.
**Type:** Alfa Slab One for the sign, Work Sans for text. **Signature moment:** the chair
board. Four chairs drawn from above, each with its barber's name and status for today,
computed from the real clock in Phoenix time against an invented schedule (open, cutting until
3:40, next at 4:00). Pick a service, then a chair and time; the booking is confirmed in-page
with a ticket stub ("Fade with Tino, Thursday 4:00, chair 2") that can be changed or
cancelled. State survives a reload within the session. **Proof point:** a complete booking
flow with real time logic.

## Brief 4: Paloma Flores (`paloma-flores`)

A florist in the Melrose district of Phoenix: daily bouquets, weddings, a Saturday flower
bar. **Customer job:** order a bouquet for pickup or delivery today. **Look:** cut-paper
collage. Butter `#f6e9b8` (60), leaf green `#2d5a3d` (30), poppy `#e8452c` (10), with one
extra flower color, cornflower `#5b7fd6`, allowed inside the drawings only. Flat overlapping
paper shapes with a faint offset shadow, hand-cut edges, no outlines. **Type:** DM Serif
Display for headlines, DM Sans for text. **Signature moment:** build a bouquet. Six invented
stem types drawn as cut-paper SVG (poppy, ranunculus, cornflower, eucalyptus, marigold,
snapdragon). Add and remove stems; they arrange themselves in a vase in a natural fan, tallest
at the back, with a little settle when one is added. A running price, a size name (posy,
bouquet, armful), wrap color, then pickup or delivery with a time and a confirmation.
**Proof point:** a product builder that is also the order form.

## Brief 5: Dark Sky Sonora (`dark-sky-sonora`)

A stargazing guide who runs small-group night tours in the desert north of Scottsdale, with
telescopes. **Customer job:** is tonight good, and book a seat. **Look:** an observatory
logbook at night. Night `#0b1026` (60), bone `#e9e2cf` (30), red lamp `#d6432a` (10, the red
flashlight astronomers use). Fine hairlines, coordinates in small figures, lots of dark.
**Type:** Syne for display, JetBrains Mono for data. **Signature moment:** tonight's sky,
computed. A canvas star field for the visitor's actual date at Scottsdale (33.49 N, 111.93 W):
compute the moon's phase and illumination, sunset and astronomical dusk, and draw the moon
phase correctly; plot a few dozen bright stars from a small built-in table of right ascension
and declination, rotated for local sidereal time, with a handful of constellation lines. A
slider scrubs the hour from dusk to dawn and the sky turns. A plain verdict: "Dark until
1:12 AM, then the moon rises." **Proof point:** real astronomy maths on a canvas.

## Brief 6: Dos Gatos Books (`dos-gatos-books`)

A used bookshop in downtown Mesa with two shop cats, a poetry shelf and a Friday reading.
**Customer job:** hours, what's on this week, ask them to hold a book. **Look:** a literary
quarterly. Newsprint `#f2f0ea` (60), black `#161616` (30), cat-collar teal `#1f7a70` (10).
Strong editorial grid, big drop cap, pull quotes, marginal notes in the gutter. **Type:**
Playfair Display for headlines, Source Serif 4 for text, small caps for labels. **Signature
moment:** the shelf. A row of forty invented books drawn as spines (varied widths, heights,
colors within the palette's tints, titles set vertically, all invented titles and authors).
Filter by section; pull a spine and it tilts out and opens a card with the staff note, price
and condition, and "Hold this for me" adds it to a hold slip that totals and takes a name.
Two cats, drawn in SVG, sit on the shelf; one moves to wherever the visitor last pulled a
book. **Proof point:** editorial typography and a browsable catalog.
