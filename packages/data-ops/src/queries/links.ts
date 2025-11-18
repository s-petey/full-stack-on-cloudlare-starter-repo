import { and, count, desc, eq, gt, max, sql } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { getDb } from '../db/database';
import { links, linkClicks } from '../drizzle-out/schema';
import {
  type CreateLinkSchemaType,
  type LinkSchemaType,
  linkSchema,
} from '../zod/links';
import { type LinkClickMessageType, stringToIsoDateTime } from '../zod/queue';

export async function createLink(
  link: CreateLinkSchemaType,
  accountId: LinkSchemaType['accountId'],
) {
  const db = getDb();

  const newId = nanoid(10);

  const result = (
    await db
      .insert(links)
      .values({
        linkId: newId,
        accountId,
        name: link.name,
        destinations: JSON.stringify(link.destinations),
      })
      .returning()
  ).at(0);

  if (!result) {
    throw new Error('Failed to create link');
  }

  return result.linkId;
}

export async function getLinks(
  accountId: LinkSchemaType['accountId'],
  createdBefore?: string,
) {
  const db = getDb();
  const conditions = [eq(links.accountId, accountId)];

  if (createdBefore) {
    conditions.push(gt(links.created, createdBefore));
  }

  const result = await db
    .select()
    .from(links)
    .where(and(...conditions))
    .orderBy(desc(links.created))
    .limit(25);

  const parsedResults = result.map((link) => {
    const parsed = linkSchema.parse(link);
    return parsed;
  });

  return parsedResults;
}

export async function updateLinkName(
  { linkId, name }: { linkId: string; name: string },
  accountId: LinkSchemaType['accountId'],
) {
  const db = getDb();
  const parsedName = linkSchema.shape.name.parse(name);

  await db
    .update(links)
    .set({
      name: parsedName,
      updated: new Date().toISOString(),
    })
    .where(and(eq(links.linkId, linkId), eq(links.accountId, accountId)));
}

export async function getLinkById(linkId: LinkSchemaType['linkId']) {
  const db = getDb();

  const result = await db
    .select()
    .from(links)
    .where(eq(links.linkId, linkId))
    .limit(1);

  const firstResult = result.at(0);

  const parsed = linkSchema.parse(firstResult);
  return parsed;
}

export async function getLink(
  linkId: LinkSchemaType['linkId'],
  accountId: LinkSchemaType['accountId'],
) {
  const db = getDb();

  const result = await db
    .select()
    .from(links)
    .where(and(eq(links.linkId, linkId), eq(links.accountId, accountId)))
    .limit(1);

  const firstResult = result.at(0);

  if (!firstResult) {
    return null;
  }

  const parsed = linkSchema.parse(firstResult);
  return parsed;
}

export async function getLinkDestinations(linkId: LinkSchemaType['linkId']) {
  const db = getDb();

  const result = await db
    .select({
      destinations: links.destinations,
    })
    .from(links)
    .where(eq(links.linkId, linkId))
    .limit(1);

  const firstResult = result.at(0);

  if (!firstResult) {
    return null;
  }

  const parsed = linkSchema.shape.destinations.parse(
    JSON.parse(firstResult.destinations),
  );
  return parsed;
}

export async function updateLinkDestinations(
  {
    linkId,
    destinations,
  }: { linkId: string; destinations: LinkSchemaType['destinations'] },
  accountId: LinkSchemaType['accountId'],
) {
  const db = getDb();
  const destinationsParsed = linkSchema.shape.destinations.parse(destinations);

  await db
    .update(links)
    .set({
      destinations: JSON.stringify(destinationsParsed),
      updated: new Date().toISOString(),
    })
    .where(and(eq(links.linkId, linkId), eq(links.accountId, accountId)));
}

export async function addLinkClick(info: LinkClickMessageType['data']) {
  const db = getDb();
  await db.insert(linkClicks).values({
    id: info.id,
    destination: info.destination,
    country: info.country,
    clickedTime: stringToIsoDateTime.encode(info.timestamp),
    latitude: info.latitude,
    longitude: info.longitude,
  });
}

export async function activeLinksLastHour(accountId: string) {
  const db = getDb();
  const oneHourAgo = new Date();
  oneHourAgo.setHours(oneHourAgo.getHours() - 1);

  const result = await db
    .select({
      name: links.name,
      linkId: links.linkId,
      clickCount: count(linkClicks.id),
      lastClicked: max(linkClicks.clickedTime),
    })
    .from(linkClicks)
    .innerJoin(links, eq(linkClicks.id, links.linkId))
    .where(
      and(
        gt(linkClicks.clickedTime, oneHourAgo.toISOString()),
        eq(links.accountId, accountId),
      ),
    )
    .groupBy(linkClicks.id)
    .orderBy((tbl) => desc(tbl.clickCount))
    .limit(10);

  return result;
}

export async function totalLinkClickLastHour(
  accountId: string,
): Promise<number> {
  const db = getDb();
  const oneHourAgo = new Date();
  oneHourAgo.setHours(oneHourAgo.getHours() - 1);

  const result = await db
    .select({
      count: count(),
    })
    .from(linkClicks)
    .innerJoin(links, eq(linkClicks.id, links.linkId))
    .where(
      and(
        gt(linkClicks.clickedTime, oneHourAgo.toISOString()),
        eq(links.accountId, accountId),
      ),
    );

  return result[0]?.count ?? 0;
}

export async function getLast24And48HourClicks(accountId: string) {
  const db = getDb();
  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

  const result = await db
    .select({
      last24Hours: sql<number>`
          COUNT(CASE
            WHEN ${linkClicks.clickedTime} > ${twentyFourHoursAgo.toISOString()}
            THEN 1
          END)
        `,
      previous24Hours: sql<number>`
          COUNT(CASE
            WHEN ${linkClicks.clickedTime} <= ${twentyFourHoursAgo.toISOString()}
            AND ${linkClicks.clickedTime} > ${fortyEightHoursAgo.toISOString()}
            THEN 1
          END)
        `,
    })
    .from(linkClicks)
    .innerJoin(links, eq(linkClicks.id, links.linkId))
    .where(
      and(
        gt(linkClicks.clickedTime, fortyEightHoursAgo.toISOString()),
        eq(links.accountId, accountId),
      ),
    );

  const last24Hours = result[0]?.last24Hours ?? 0;
  const previous24Hours = result[0]?.previous24Hours ?? 0;

  let percentChange = 0;
  if (previous24Hours > 0) {
    percentChange = Math.round(
      ((last24Hours - previous24Hours) / previous24Hours) * 100,
    );
  } else if (last24Hours > 0) {
    percentChange = 100;
  }

  return {
    last24Hours,
    previous24Hours,
    percentChange,
  };
}

export async function getLast30DaysClicks(accountId: string) {
  const db = getDb();
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const result = await db
    .select({
      count: count(),
    })
    .from(linkClicks)
    .innerJoin(links, eq(linkClicks.id, links.linkId))
    .where(
      and(
        gt(linkClicks.clickedTime, thirtyDaysAgo.toISOString()),
        eq(links.accountId, accountId),
      ),
    );

  return result[0]?.count ?? 0;
}

export async function getLast30DaysClicksByCountry(accountId: string) {
  const db = getDb();
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const result = await db
    .select({
      country: linkClicks.country,
      count: count(linkClicks.id),
    })
    .from(linkClicks)
    .innerJoin(links, eq(linkClicks.id, links.linkId))
    .where(
      and(
        gt(linkClicks.clickedTime, thirtyDaysAgo.toISOString()),
        eq(links.accountId, accountId),
      ),
    )
    .groupBy(linkClicks.country)
    .orderBy((tbl) => desc(tbl.count));

  return result;
}
