import type { Config } from 'drizzle-kit';
import { drizzleEnvLive } from './src/zod/env';

const config: Config = {
  out: './src/drizzle-out',
  schema: ['./src/drizzle-out/schema.ts', './src/drizzle-out/auth-schema.ts'],
  dialect: 'sqlite',
  driver: 'd1-http',
  dbCredentials: {
    accountId: drizzleEnvLive.accountId,
    databaseId: drizzleEnvLive.databaseId,
    token: drizzleEnvLive.token,
  },
  tablesFilter: ['!_cf_KV'],
};

export default config satisfies Config;
