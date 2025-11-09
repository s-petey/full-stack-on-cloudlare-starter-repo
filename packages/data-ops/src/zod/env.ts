import z from 'zod';

const drizzleEnv = z.object({
  accountId: z.string().readonly(),
  databaseId: z.string().readonly(),
  token: z.string().readonly(),
});

export const drizzleEnvLive = drizzleEnv.parse({
  // @ts-expect-error We are using process even though we shouldn't with cloudflare...
  accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
  // @ts-expect-error We are using process even though we shouldn't with cloudflare...
  databaseId: process.env.CLOUDFLARE_DATABASE_ID,
  // @ts-expect-error We are using process even though we shouldn't with cloudflare...
  token: process.env.CLOUDFLARE_D1_TOKEN,
});
