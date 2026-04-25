// @ts-check
import { defineConfig } from 'astro/config';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import db from '@astrojs/db';
import tailwindcss from '@tailwindcss/vite';
import preact from '@astrojs/preact';

const __dirname = dirname(fileURLToPath(import.meta.url));

// https://astro.build/config
export default defineConfig({
  integrations: [db({
    connectionString: `file:${join(__dirname, '.astro/content.db')}`,
  }), preact()],

  vite: {
    plugins: [tailwindcss()]
  }
});