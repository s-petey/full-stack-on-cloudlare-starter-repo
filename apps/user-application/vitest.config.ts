import { defineWorkersProject } from '@cloudflare/vitest-pool-workers/config';
import { mergeConfig } from 'vitest/config';
// biome-ignore lint/suspicious/noTsIgnore: Ignoring for now
// @ts-ignore Not listed in tsconfig
import configShared from '../../vitest.config';

export default mergeConfig(
  configShared,
  defineWorkersProject({
    test: {
      poolOptions: {
        workers: {
          wrangler: { configPath: './wrangler.jsonc' },
        },
      },
    },
  }),
);
