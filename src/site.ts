// Everything about you that appears across the site lives here.
export const site = {
  name: 'Sam Tinevra',
  intro:
    'I practice Ashtanga yoga, I engineer and I design, but I just call myself an artist. Mexican, Italian and Korean, currently based in Scottsdale, Arizona.',
  // Add or remove links freely, e.g. { label: 'Instagram', href: 'https://instagram.com/yourname' }
  links: [{ label: 'GitHub', href: 'https://github.com/mauiTinevra' }],
};

export const sections = [
  { href: '/blog', name: 'Blog', fabric: 'cord', note: 'Longer writing' },
  { href: '/art', name: 'Art', fabric: 'canvas', note: 'Things I made' },
  { href: '/code', name: 'Code', fabric: 'denim', note: 'Things I built' },
  { href: '/journal', name: 'Journal', fabric: 'gingham', note: 'Short notes, day by day' },
] as const;
