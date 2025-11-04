import { DurableObject } from 'cloudflare:workers';
import { drizzle } from 'drizzle-orm/durable-sqlite';
import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { desc } from 'drizzle-orm';

const geoLinkClicks = sqliteTable('geo_link_clicks', {
  latitude: real().notNull(),
  longitude: real().notNull(),
  country: text().notNull(),
  time: integer().notNull(),
});

const MIGRATION = `CREATE TABLE IF NOT EXISTS geo_link_clicks (
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  country TEXT NOT NULL,
  time INTEGER NOT NULL
);`;

export class LinkClickTracker extends DurableObject<Env> {
  storage: DurableObjectStorage;
  db: ReturnType<typeof drizzle>;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);

    this.storage = ctx.storage;
    this.db = drizzle(this.storage, { logger: false });
    // Make sure all migrations complete before accepting queries.
    // Otherwise you will need to run `this.migrate()` in any function
    // that accesses the Drizzle database `this.db`.
    ctx.blockConcurrencyWhile(async () => {
      await this._migrate();
    });
  }

  private async _migrate() {
    this.db.$client.sql.exec(MIGRATION);
  }

  async addClick(geoClick: typeof geoLinkClicks.$inferSelect) {
    await this.db.insert(geoLinkClicks).values(geoClick).run();
  }

  async getLinkClicks(_: Request) {
    const clicks = await this.db
      // Get the last 100 link clicks
      .select()
      .from(geoLinkClicks)
      .orderBy(desc(geoLinkClicks.time))
      .limit(100)
      .all();

    return new Response(JSON.stringify({ clicks }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
