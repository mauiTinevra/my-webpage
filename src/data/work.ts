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
    line: 'A figure practising Ashtanga under the real Scottsdale hour, and a walkable street, all drawn in code.',
    href: '/work#this-site',
    image: '/work/street.jpg',
    alt: 'This site\u2019s home page: a silhouette practising yoga in front of a large disc on a night horizon',
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
  {
    id: 'gallery',
    name: 'The gallery',
    kind: 'Six concepts, directed with AI agents',
    line: 'A record shop, a potter, a barber, a florist, a stargazing guide and a bookshop, each with one moment that really works.',
    href: '/work#gallery',
    image: '/work/gallery.jpg',
    alt: 'A grid of six different websites: a record shop, a pottery studio, a barbershop, a florist, a stargazing guide and a bookshop',
    problem:
      'I wanted to know how far a clear brief could go. Could six sites be built at the same time, look nothing alike, and each still put the customer first?',
    did: [
      'Wrote one build standard and six briefs: a business, the customer\u2019s errand, a palette, typefaces and one signature moment each.',
      'Had six AI agents build one site each in parallel, sharing nothing, so the sites would not converge.',
      'Made every builder look at screenshots of its own work three times and fix what it saw.',
      'Reviewed all six on phone and desktop before publishing, and wrote down the whole method.',
    ],
    result: 'Six working concept sites in an afternoon. I directed them; AI agents built them, and the guide says exactly how.',
    links: [
      { label: 'Open the gallery', href: '/gallery/' },
      { label: 'How it was made', href: '/gallery/guide/' },
    ],
  },
];
