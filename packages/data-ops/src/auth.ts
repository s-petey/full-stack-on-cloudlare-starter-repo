import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import {
  account,
  session,
  user,
  verification,
} from '../src/drizzle-out/auth-schema';
import { getDb } from './db/database';

let auth: ReturnType<typeof betterAuth> | null = null;

export function createBetterAuth(
  db: NonNullable<Parameters<typeof betterAuth>[0]['database']>,
  google?: { clientId: string; clientSecret: string },
) {
  return betterAuth({
    database: db,
    socialProviders: {
      google: {
        clientId: google?.clientId || '',
        clientSecret: google?.clientSecret || '',
      },
    },
  });
}

export function getAuth(google: { clientId: string; clientSecret: string }) {
  if (auth !== null) return auth;

  auth = createBetterAuth(
    drizzleAdapter(getDb(), {
      provider: 'sqlite',
      schema: {
        user,
        session,
        account,
        verification,
      },
    }),
    google,
  );
  return auth;
}
