// Everything about you that appears across the site lives here.
export const site = {
  name: 'mauiTinevra',
  intro: 'This is where I keep what I write, what I make and what I build.',
  // Add or remove links freely, e.g. { label: 'Instagram', href: 'https://instagram.com/yourname' }
  links: [{ label: 'GitHub', href: 'https://github.com/mauiTinevra' }],
};

export const sections = [
  { href: '/blog', name: 'Blog', fabric: 'cord', note: 'Longer writing' },
  { href: '/art', name: 'Art', fabric: 'canvas', note: 'Things I made' },
  { href: '/code', name: 'Code', fabric: 'denim', note: 'Things I built' },
  { href: '/journal', name: 'Journal', fabric: 'gingham', note: 'Short notes, day by day' },
] as const;
