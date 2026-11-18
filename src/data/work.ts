// The work, as case studies: what it is, what I did and why. Shared by the home page and /work.
// Images are screenshots of the live pieces, in public/work/.

export type Work = {
  id: string;
  name: string;
  kind: string;
  line: string;
  href: string;
  image: string;
  alt: string;
  problem: string;
  did: string[];
  result: string;
  links: { label: string; href: string }[];
  /** Built by AI agents from Maui's brief (the gallery), not by hand. */
  ai?: boolean;
};

export const work: Work[] = [
  {
    id: 'el-unico',
    name: 'El Único Taquería',
    kind: 'Restaurant concept',
    line: 'One taco, a menu that is also the order, and a shop window that lights up only when it’s open.',
    href: '/work#el-unico',
    image: '/work/el-unico.jpg',
    alt: 'The El Único site: a turning trompo and a neon sign beside today’s hours and the order button',
    problem:
      'My first version was full of animations: build a taco, pour a drink, bite a dessert. A senior designer reviewed it and said he wouldn’t buy it. Each trick ended in a price, the colors were everywhere, and a hungry visitor couldn’t tell how to order.',
    did: [
      'Wrote brand rules first: three colors split 60/30/10, one typeface, one flat line style.',
      'Put what people came for first: today’s hours, where it is, the menu and ordering.',
      'Turned the taco builder into the real order: choose toppings, see your plate, pick a pickup time and check out.',
      'Kept one deliberate moment of character, the turning trompo and the neon sign, and only in the first row.',
    ],
    result: 'A site a restaurant could use the day it launches, that still feels like nowhere else.',
    links: [
      { label: 'See the rebuilt site', href: '/work/el-unico' },
      { label: 'See the first version', href: '/work/el-unico-v1' },
    ],
  },
  {
    id: 'dos-gatos-books',
    name: 'Dos Gatos Books',
    kind: 'Bookshop concept',
    line: 'A shelf of forty invented books. Pull one, read the staff note, and put it on your hold slip.',
    href: '/work#dos-gatos-books',
    image: '/gallery/thumbs/dos-gatos-books.jpg',
    alt: 'The Dos Gatos Books site',
    problem:
      'A used bookshop in Mesa with two cats, a poetry shelf and a Friday reading. A used-book shop sells on the staff\u2019s taste.',
    did: [
      'Laid out like a literary quarterly: newsprint, black and one teal, with drop caps and margin notes.',
      'A shelf of forty invented books drawn as spines; pull one and it tilts out to show the staff note, price and condition.',
      '\u201cHold this for me\u201d adds the book to a hold slip that totals up and takes your name.',
      'Two cats drawn in code sit on the shelf, and one follows the book you last pulled.',
    ],
    result: 'Browsing the shelf feels like the shop, and holding a book takes one tap.',
    links: [
      { label: 'Visit the site', href: '/gallery/dos-gatos-books/' },
      { label: 'How it was made', href: '/gallery/dos-gatos-books/guide/' },
    ],
    ai: true,
  },
  {
    id: 'ocotillo-records',
    name: 'Ocotillo Records',
    kind: 'Record shop concept',
    line: 'Pick a record and press play. The music is made live in the browser, with no audio files.',
    href: '/work#ocotillo-records',
    image: '/gallery/thumbs/ocotillo-records.jpg',
    alt: 'The Ocotillo Records site',
    problem:
      'A used vinyl shop on Roosevelt Row. People want today\u2019s hours, where it is and what came in this week, and a record shop should sound like something.',
    did: [
      'Printed like a two-color poster: black and yellow on paper, with overprint where the inks meet.',
      'A turntable drawn in code: pick one of four invented records, it drops on the platter, and the tonearm swings in.',
      'Each record plays its own short groove, synthesized live with the Web Audio API, with crackle that follows the record\u2019s grade.',
      'Today\u2019s hours on Phoenix time, ten new arrivals with grades and prices, and how to sell a collection.',
    ],
    result: 'A record shop site you can hear before you visit.',
    links: [
      { label: 'Visit the site', href: '/gallery/ocotillo-records/' },
      { label: 'How it was made', href: '/gallery/ocotillo-records/guide/' },
    ],
    ai: true,
  },
  {
    id: 'monsoon-clay',
    name: 'Monsoon Clay',
    kind: 'Pottery studio concept',
    line: 'Drag four marks to throw a pot, and the page names what you made and the class that teaches it.',
    href: '/work#monsoon-clay',
    image: '/gallery/thumbs/monsoon-clay.jpg',
    alt: 'The Monsoon Clay site',
    problem:
      'A pottery studio in Tempe with classes, memberships and kiln firing. Newcomers don\u2019t know which class fits what they want to make.',
    did: [
      'A quiet studio-catalog look: celadon, iron black and one rust accent, with numbers set like a kiln log.',
      'Throw a pot: drag the foot, belly, shoulder and lip (or use the arrow keys) while it turns on the wheel.',
      'The page names the form you made (bowl, cup, vase, bottle or plate), its size and clay weight, and the class that teaches it.',
      'Class dates worked out from today, a booking form, membership prices and a firing chart.',
    ],
    result: 'Playing with the clay leads straight to the right class.',
    links: [
      { label: 'Visit the site', href: '/gallery/monsoon-clay/' },
      { label: 'How it was made', href: '/gallery/monsoon-clay/guide/' },
    ],
    ai: true,
  },
  {
    id: 'camelback-barber',
    name: 'Camelback Barber',
    kind: 'Barbershop concept',
    line: 'A chair board on the real Phoenix clock, and a booking that ends in a ticket stub.',
    href: '/work#camelback-barber',
    image: '/gallery/thumbs/camelback-barber.jpg',
    alt: 'The Camelback Barber site',
    problem:
      'A four-chair shop near Camelback Road that takes walk-ins and bookings. The question is always the same: who\u2019s free, and when?',
    did: [
      'An enamel shop sign, a barber pole in CSS and a checkerboard floor, in cream, oxblood and brass.',
      'Four chairs drawn from above, each showing its barber\u2019s status right now, worked out from the real time in Phoenix.',
      'Pick a service, a chair and a time; the booking is confirmed as a ticket stub you can change or cancel.',
      'A price board, the barbers, hours with today marked and a drawn map.',
    ],
    result: 'The next open chair is on the first screen, and booking it takes four taps.',
    links: [
      { label: 'Visit the site', href: '/gallery/camelback-barber/' },
      { label: 'How it was made', href: '/gallery/camelback-barber/guide/' },
    ],
    ai: true,
  },
  {
    id: 'paloma-flores',
    name: 'Paloma Flores',
    kind: 'Florist concept',
    line: 'Build a bouquet stem by stem. It arranges itself in the vase, and the builder is the order form.',
    href: '/work#paloma-flores',
    image: '/gallery/thumbs/paloma-flores.jpg',
    alt: 'The Paloma Flores site',
    problem:
      'A florist in the Melrose district. Most visitors want flowers today, for pickup or delivery, and want to see what they\u2019re getting.',
    did: [
      'A cut-paper collage look in butter, leaf green and poppy, with flowers made of flat overlapping shapes.',
      'Six stem types to add and remove; they fan into the vase, tallest at the back, with a running price and size.',
      'Choose a wrap, then pickup or delivery with a real time slot, and get an in-page confirmation.',
      'Three ready-made bouquets of the day, weddings and the Saturday flower bar.',
    ],
    result: 'Choosing the flowers and placing the order are the same step.',
    links: [
      { label: 'Visit the site', href: '/gallery/paloma-flores/' },
      { label: 'How it was made', href: '/gallery/paloma-flores/guide/' },
    ],
    ai: true,
  },
  {
    id: 'dark-sky-sonora',
    name: 'Dark Sky Sonora',
    kind: 'Stargazing tours concept',
    line: 'Tonight\u2019s real sky over Scottsdale, computed: the moon, the planets and when it gets dark.',
    href: '/work#dark-sky-sonora',
    image: '/gallery/thumbs/dark-sky-sonora.jpg',
    alt: 'The Dark Sky Sonora site',
    problem:
      'A guide running small-group telescope tours in the desert. Whether tonight is worth it depends on the moon, so that answer has to come first.',
    did: [
      'An observatory logbook at night: deep navy, bone and the red of an astronomer\u2019s flashlight.',
      'A sky chart drawn on a canvas for Scottsdale: real stars, constellations, planets and the moon in its true phase.',
      'Sunset, full dark, moonrise and moonset are computed for each night, with a plain verdict and the tour that runs.',
      'A slider turns the sky from dusk to dawn, plus a week ahead, booking and a red-lamp mode.',
    ],
    result: '\u201cIs tonight good?\u201d is answered before anything else.',
    links: [
      { label: 'Visit the site', href: '/gallery/dark-sky-sonora/' },
      { label: 'How it was made', href: '/gallery/dark-sky-sonora/guide/' },
    ],
    ai: true,
  },
  {
    id: 'saguaro',
    name: 'Saguaro Yoga Club',
    kind: 'Yoga studio concept',
    line: 'A calm studio site in one serif, with a schedule that opens on today and knows what class is next.',
    href: '/work#saguaro',
    image: '/work/saguaro.jpg',
    alt: 'The Saguaro Yoga Club site: a fine-line drawing of a saguaro beside the headline Stand tall, bend a little, on warm paper',
    problem: 'A mixed-style studio has a lot of classes, and newcomers don’t know which one to pick.',
    did: [
      'A “How do you feel today?” picker that suggests a class and when it next runs.',
      'A weekly schedule that opens on today, grays out finished classes and filters by style.',
      'A $29 first week up front, and a plain first-class FAQ.',
      'One serif, three colors and a fine-line saguaro, so the studio feels calm before you walk in.',
    ],
    result: 'A studio site that answers “what should I take, and when?” in one tap.',
    links: [{ label: 'See the site', href: '/work/saguaro' }],
  },
  {
    id: 'this-site',
    name: 'This site, and the street',
    kind: 'Personal site',
    line: 'A clear home page for clients, and a walkable street with a yoga practice, all drawn in code.',
    href: '/work#this-site',
    image: '/work/street.jpg',
    alt: 'This site\u2019s home page: the headline Striking, colorful, elegant design beside flat color blocks, with a figure practising yoga in the blue one',
    problem: 'Show what one person can build without templates, page builders or stock art.',
    did: [
      'A street of storefronts, a posada, a living room and a wardrobe, each drawn in code.',
      'A sky that follows the real sun in Scottsdale, and a figure practicing the Ashtanga primary series.',
      'A small arcade game at the end of the street.',
      'Then, after a design review, a home page that puts the work and prices first.',
    ],
    result: 'The street is still here for anyone who wants the long way in.',
    links: [{ label: 'Walk the street', href: '/street' }],
  },
];
