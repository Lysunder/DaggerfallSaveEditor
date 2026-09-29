import { defineConfig } from 'vitest/config';

// Separate from vite.config.ts so tests don't load vite-plugin-electron (which would launch Electron).
export default defineConfig({
  test: {
    include: ['electron/**/*.test.ts', 'src/**/*.test.ts'],
    environment: 'node',
  },
});
