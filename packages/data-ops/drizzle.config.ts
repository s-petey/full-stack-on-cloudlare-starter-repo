import type { Config } from "drizzle-kit";
import { drizzleEnvLive } from "./src/zod/env";

const config: Config = {
  out: "./src/drizzle-out",
  dialect: "sqlite",
  driver: "d1-http",
  dbCredentials: {
    accountId: drizzleEnvLive.accountId,
    databaseId: drizzleEnvLive.databaseId,
    token: drizzleEnvLive.token,
  },
  tablesFilter: ["!_cf_KV"],
};

export default config satisfies Config;
