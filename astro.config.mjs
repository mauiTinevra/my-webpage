import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  // The public address of the site. Change this when a custom domain is connected:
  // the sitemap, canonical links and share previews all take it from here.
  site: 'https://mauitinevra.com',
  integrations: [
    sitemap({
      // Pages kept out of search (concept sites for imaginary businesses, the empty blog) stay out
      // of the sitemap too. The gallery is plain files in public/, so it is listed by hand.
      filter: (page) => !/\/(work\/(el-unico|el-unico-v1|saguaro)|blog)\/$/.test(page),
      customPages: ['https://mauitinevra.com/gallery/', 'https://mauitinevra.com/gallery/guide/'],
    }),
  ],
  // Code became Work: old links keep working.
  redirects: { '/code': '/work' },
});
