import { sqliteTable, AnySQLiteColumn, text, numeric, index, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { evaluationProductStatus } from '@/zod/links';

export const links = sqliteTable('links', {
  linkId: text('link_id').primaryKey().notNull(),
  accountId: text('account_id').notNull(),
  destinations: text().notNull(),
  created: numeric()
    .default(sql`(CURRENT_TIMESTAMP)`)
    .notNull(),
  updated: numeric()
    .default(sql`(CURRENT_TIMESTAMP)`)
    .notNull(),
  name: text().notNull(),
});

export const linkClicks = sqliteTable(
  'link_clicks',
  {
    id: text().notNull(),
    country: text(),
    destination: text().notNull(),
    clickedTime: numeric('clicked_time').notNull(),
    latitude: real(),
    longitude: real(),
  },
  (table) => [index('idx_link_clicks_id').on(table.id), index('idx_link_clicks_clicked_time').on(table.clickedTime)],
);

export const destinationEvaluations = sqliteTable(
  'destination_evaluations',
  {
    id: text().primaryKey(),
    linkId: text('link_id').notNull(),
    accountId: text('account_id').notNull(),
    destinationUrl: text('destination_url').notNull(),
    status: text({
      enum: [
        evaluationProductStatus.enum.AVAILABLE_PRODUCT,
        evaluationProductStatus.enum.NOT_AVAILABLE_PRODUCT,
        evaluationProductStatus.enum.UNKNOWN_STATUS,
      ],
    }).notNull(),
    reason: text().notNull(),
    createdAt: numeric('created_at')
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
  },
  (table) => [index('idx_destination_evaluations_account_time').on(table.accountId, table.createdAt)],
);
