
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import node from '@astrojs/node';


export default defineConfig({
  site: '',
  output: 'server', //  
  adapter: node({
    mode: 'standalone'
  }),
  integrations: [
    tailwind(),
    mdx(), 
    sitemap()
  ],
  markdown: {
    shikiConfig: {
      theme: 'github-dark',
      wrap: true
    }
  },
  server: {
    port: 4321,
    host: true
  },
  build: {
    format: 'file'
  },
  vite: {
    optimizeDeps: {
      include: ['openai']
    }
  }
});
