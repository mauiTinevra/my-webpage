import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  // The public address of the site. Change this when a custom domain is connected:
  // the sitemap, canonical links and share previews all take it from here.
  site: 'https://mauitinevra.com',
  integrations: [sitemap()],
  // Code became Work: old links keep working.
  redirects: { '/code': '/work' },
});
