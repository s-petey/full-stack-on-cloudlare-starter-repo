import { DurableObject } from 'cloudflare:workers';
import { durableObjectGeoClickArraySchema } from '@repo/data-ops/zod-schema/links';
import { desc, gt, lt } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/durable-sqlite';
import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

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
  mostRecentOffsetTime: number = 0;
  leastRecentOffsetTime: number = 0;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);

    this.storage = ctx.storage;
    this.db = drizzle(this.storage, { logger: false });
    // Make sure all migrations complete before accepting queries.
    // Otherwise you will need to run `this.migrate()` in any function
    // that accesses the Drizzle database `this.db`.
    ctx.blockConcurrencyWhile(async () => {
      const [leastRecentOffsetTime, mostRecentOffsetTime] = await Promise.all([
        ctx.storage.get<number>('leastRecentOffsetTime'),
        ctx.storage.get<number>('mostRecentOffsetTime'),
        await this._migrate(),
      ]);

      this.leastRecentOffsetTime =
        leastRecentOffsetTime ?? this.mostRecentOffsetTime;
      this.mostRecentOffsetTime =
        mostRecentOffsetTime ?? this.mostRecentOffsetTime;
    });
  }

  private async _migrate() {
    this.db.$client.sql.exec(MIGRATION);
  }

  async addClick(geoClick: typeof geoLinkClicks.$inferSelect) {
    await this.db.insert(geoLinkClicks).values(geoClick).run();

    const alarm = await this.storage.getAlarm();
    if (alarm === null) {
      const twoSecondsFromNow = Date.now() + 2 * 1000;
      await this.storage.setAlarm(twoSecondsFromNow);
    }
  }

  async alarm(_alarmInfo?: AlarmInvocationInfo): Promise<void> {
    const connections = await this.ctx.getWebSockets();
    const clickData = await this.getRecentClicks(
      this.mostRecentOffsetTime,
      100,
    );

    await Promise.all(
      connections.map(async (ws) =>
        ws.send(
          JSON.stringify(
            durableObjectGeoClickArraySchema.encode(clickData.clicks),
          ),
        ),
      ),
    );

    await Promise.all([
      this.flushOffsetTimes(clickData.mostRecentTime, clickData.oldestTime),
      this.deleteClicksBefore(this.leastRecentOffsetTime),
    ]);
  }

  private async flushOffsetTimes(
    mostRecentOffsetTime: number,
    leastRecentOffsetTime: number,
  ) {
    this.mostRecentOffsetTime = mostRecentOffsetTime;
    this.leastRecentOffsetTime = leastRecentOffsetTime;

    await Promise.all([
      this.ctx.storage.put('mostRecentOffsetTime', this.mostRecentOffsetTime),
      this.ctx.storage.put('leastRecentOffsetTime', this.leastRecentOffsetTime),
    ]);
  }

  async getLinkClicks(_: Request) {
    const clicks = await this.db
      //
      .select()
      .from(geoLinkClicks)
      .orderBy(desc(geoLinkClicks.time))
      .limit(100)
      .all();

    return new Response(JSON.stringify({ clicks }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  async fetch(_req: Request): Promise<Response> {
    const websocketPair = new WebSocketPair();
    const [client, server] = Object.values(websocketPair);
    this.ctx.acceptWebSocket(server);

    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }

  private async getRecentClicks(offsetTime: number = 0, limit: number = 50) {
    const clicks = await this.db
      .select()
      .from(geoLinkClicks)
      .where(gt(geoLinkClicks.time, offsetTime))
      .orderBy(desc(geoLinkClicks.time))
      .limit(limit)
      .all();

    const mostRecentTime = clicks.at(0)?.time ?? 0;
    const oldestTime = clicks.at(-1)?.time ?? 0;

    return { clicks, mostRecentTime, oldestTime };
  }

  private async deleteClicksBefore(time: number) {
    await this.db
      .delete(geoLinkClicks)
      .where(lt(geoLinkClicks.time, time))
      .run();
  }
}
