# Maui Tinevra: brand guidelines

Interactive websites, designed and engineered by one artist. Scottsdale, Arizona.

These rules exist so every page looks like it came from the same place. Anything that breaks them should be a deliberate choice, not an accident.

## Who the site is for

Artists, studios, restaurants and small businesses who want a site that feels like them, and have about a minute to decide.

Lead with what they came to do:

1. **Start a project**
2. **See my work**
3. **Services & pricing**

## Color: 60 / 30 / 10

| Role | Name | Hex | Used for |
| --- | --- | --- | --- |
| 60% dominant | Paper | `#f3f1ec` | The big fields (nav, page ground, footer bands) and the lines in every drawing. |
| 30% secondary | Ink | `#121a3a` | The paper that menus, panels and long reading sit on. |
| 10% accent | Wall yellow | `#f2cb3a` | Only Start a project, the button that moves you forward, selected states. |

Derived, never new hues:

- `deep` `#f7f5f2`: A shade of Paper for footers and the deepest grounds.
- `on-dominant` `#121a3a`: Text and icons on Paper.
- `on-secondary` `#f7f5f2`: Body text on Ink.
- `on-accent` `#000000`: Labels on Wall yellow buttons.
- `rule` `rgb(243 241 236 / 0.25)`: Dividers and disabled borders on Ink.
- `hairline` `rgb(18 26 58 / 0.2)`: Dividers on Paper.

No other colors. If something needs to stand out and isn't an action, give it size or weight, not a new color.

### Contrast

| Pair | Ratio | Needs | |
| --- | --- | --- | --- |
| Text on dominant | 15.07:1 | 4.5:1 | Pass |
| Body text on secondary | 15.64:1 | 4.5:1 | Pass |
| Button label on accent | 13.38:1 | 4.5:1 | Pass |
| Accent on dominant | 1.39:1 | 3:1 | **Fails.** Accent buttons, dots and outlines on the dominant ground. |
| Accent on secondary | 10.84:1 | 3:1 | Pass |
| Dominant on secondary | 15.07:1 | 3:1 | Pass |

## Type

One family: **Archivo**.

- **hero**: 88px, weight 800, width 112%, line height 0.98
- **section**: 52px, weight 800, width 112%, line height 1
- **group**: 22px, weight 800, width 112%, line height 1.2
- **lead**: 21px, weight 400, line height 1.5
- **body**: 17px, weight 400, line height 1.55
- **label**: 17px, weight 700, line height 1.4
- **small**: 15px, weight 400, line height 1.45

Prices and counts use tabular numbers. No italics for emphasis, no all-caps labels, no second typeface.

## Drawings

One style: flat shapes in the three brand colors, no outlines. `accent` only where a drawing shows something the visitor chose.

No gradients, shadows or 3D. Keep every drawing in one sprite sheet and draw nothing outside it.

## The one exception

**The street (/street).** The walkable street, the posada, the living room, the wardrobe, the yoga scene and the game keep their own art and colors. It's an opt-in experience, reached from the Walk the street button.

Nothing outside it breaks the rules above.

## Voice

First person, plain and warm. Say what I make, for whom, and what it costs.

Do:

- Lead with the visitor's goal: a site people remember.
- Name prices and timelines plainly.

Don't:

- Tech jargon (stacks, frameworks) on sales pages.
- Exclamation marks.

## Components

- **Buttons**: flat, 2px border, `2px` corners. Primary is `accent` with `on-accent` text, used for the main action only. The other variant is a transparent outline in the text color. No offset shadows.
- **Panels**: `secondary` on `dominant`, or a `dominant` outline on `secondary`, `4px` corners, no shadows.
- **Motion**: only to answer an action, under 200ms, off for reduced motion. No scroll animations, nothing floating.
- **Hover**: everything clickable changes on hover, and nothing else does.

## Page order

1. Nav: Work, Services & pricing, About, Contact, Start a project
2. Hero: who, what, two actions, the photos
3. Selected work
4. Services & pricing
5. Proof: everything here is hand-built
6. About
7. Contact
8. Sitemap footer
