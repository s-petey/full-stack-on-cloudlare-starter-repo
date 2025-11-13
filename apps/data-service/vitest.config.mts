import { defineWorkersConfig } from '@cloudflare/vitest-pool-workers/config';
import path from 'node:path';

export default defineWorkersConfig({
  test: {
    poolOptions: {
      workers: {
        wrangler: { configPath: './wrangler.jsonc' },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
