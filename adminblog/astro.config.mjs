import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import tailwind from '@astrojs/tailwind';

// https://astro.build/config
export default defineConfig({
  integrations: [tailwind()],
  output: 'server',
  adapter: node({
    mode: 'standalone'
  }),
  server: {
    port: 4322,
    host: true
  },
  vite: {
    define: {
      'import.meta.env.OPENAI_API_KEY': JSON.stringify(process.env.OPENAI_API_KEY || ''),
      'import.meta.env.OPENAI_MODEL': JSON.stringify(process.env.OPENAI_MODEL || 'gpt-4o')
    }
  }
});
