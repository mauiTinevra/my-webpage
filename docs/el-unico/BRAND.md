# El Único: brand guidelines

El Único is an imaginary taquería inside Scottsdale Fashion Square that sells one taco. These
guidelines exist so every part of the site looks like it came from the same place. Anything
that breaks them should be a deliberate choice, not an accident.

## Who the site is for

People who already know what a taquería is and want one of three things, fast:

1. **See the menu.** Everything, with prices, in one place.
2. **Order.** Pickup orders from the counter's side window. Walk-up is the other way to eat.
   There are no reservations and no delivery.
3. **Know if it's open, and where it is.** Today's hours and the location, without scrolling.

The story (why one taco) comes after those, because it's what makes the place memorable, not
what people came to do.

## Color: 60 / 30 / 10

| Role | Name | Hex | Used for |
| --- | --- | --- | --- |
| 60% dominant | Cobalt | `#1d3a8a` | Big fields: nav, hero, hours, footer. Text on cream. All line art. |
| 30% secondary | Masa | `#f6eedc` | Paper: the menu and order panel, the story. Text on cobalt. |
| 10% accent | Rosa | `#ff4f8b` | Only things that do or mean something: the order buttons, the "open now" dot, selected states, prices in the cart total. |

Plus two tints, never new hues:

- Deep cobalt `#142a66` for body text on masa and the footer.
- Line cobalt at 25% (`rgb(29 58 138 / 0.25)`) for dividers on masa.

No green, yellow, orange, brown or a second blue anywhere. If something needs to stand out and
it isn't an action, it gets size or weight, not a new color.

## Type

One family: **Archivo** (variable, with width).

- Display: weight 800, width 112%, tight leading (1.0). Headings and the wordmark.
- Body: weight 400, width 100%, 1.55 leading, 17–18px.
- Labels and prices: weight 700, width 100%, tabular numbers.

No italics for emphasis, no all-caps labels, no second typeface.

## Art style

One style for every drawing: **flat 2D line art**, like a one-color print.

- Stroke: cobalt, 2.5 units, round caps and joins.
- Fill: masa, or nothing. Rosa only where the drawing shows something you chose (your toppings).
- No gradients, no shadows, no 3D, no rotation for effect.
- All drawings live in one sprite sheet (`<symbol>`s at the top of the page): taco, trompo, agua,
  La Única, chocoflan, tres leches, pineapple, onion, cilantro, salsa. Nothing else is drawn.

## Components

- **Buttons:** flat, 2px border, 999px radius. Primary is rosa with cobalt text. Secondary is
  transparent with a border in the text color. No offset shadows.
- **Cards and panels:** masa on cobalt or cobalt-outlined on masa, 12px radius, no shadows.
- **Motion:** only to answer an action (a topping appearing on your taco, the cart updating),
  under 200ms, and off when reduced motion is set. No scroll animations, nothing floating.
- **Hover:** every clickable thing changes on hover (underline or fill), and nothing else does.

## Page order

1. Top nav: Menu, Order pickup, Hours & location, Our story, plus today's status.
2. Hero: what it is in one line, today's hours, where, how to order, two buttons.
3. Menu that is also the pickup order (add items, choose toppings, check out).
4. Hours and location.
5. Our story.
6. Catering, gift cards, jobs.
7. Sitemap footer.
