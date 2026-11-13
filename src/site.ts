// Everything about you that appears across the site lives here.
export const site = {
  name: 'Maui Tinevra',
  intro:
    'I practice Ashtanga yoga, I engineer and I design, but I just call myself an artist. Mexican, Italian and Korean, currently based in Scottsdale, Arizona.',
  // What search engines and link previews say about the site.
  tagline: 'Web designer in Scottsdale, Arizona',
  description:
    'Maui Tinevra is a web designer and developer in Scottsdale, Arizona, making custom, interactive websites for people and small businesses. Email to start a project.',
  email: 'sam.tinevra@gmail.com',
  // Add or remove links freely, e.g. { label: 'Instagram', href: 'https://instagram.com/yourname' }
  links: [{ label: 'GitHub', href: 'https://github.com/mauiTinevra' }],
};

// Each section is a storefront on the street: a painted wall and a roll-up shutter.
export const sections = [
  { href: '/blog', name: 'Blog', place: 'blog', note: 'Longer writing' },
  { href: '/art', name: 'Art', place: 'art', note: 'Things I made' },
  { href: '/code', name: 'Code', place: 'code', note: 'Things I built' },
  { href: '/journal', name: 'Journal', place: 'journal', note: 'Short notes, day by day' },
] as const;

export type Place = (typeof sections)[number]['place'];
