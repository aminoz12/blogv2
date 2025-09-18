import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import node from '@astrojs/node';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Create __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  site: 'https://mad2moi.store/blog',
  output: 'server',
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
    resolve: {
      alias: {
        '~': dirname(__filename) + '/src'
      }
    },
    optimizeDeps: {
      include: ['openai']
    }
  }
});
