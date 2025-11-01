import { getDb } from '@/db/database';
import { linkClicks, links } from '@/drizzle-out/schema';
import { CreateLinkSchemaType, linkSchema, LinkSchemaType } from '@/zod/links';
import { nanoid } from 'nanoid';
import { eq, and, gt, desc } from 'drizzle-orm';
import { LinkClickMessageType, stringToIsoDateTime } from '@/zod/queue';

export async function createLink(link: CreateLinkSchemaType, accountId: LinkSchemaType['accountId']) {
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

export async function getLinks(accountId: LinkSchemaType['accountId'], createdBefore?: string) {
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

export async function updateLinkName({ linkId, name }: { linkId: string; name: string }, accountId: LinkSchemaType['accountId']) {
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

export async function getLink(linkId: LinkSchemaType['linkId'], accountId: LinkSchemaType['accountId']) {
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

  const parsed = linkSchema.shape.destinations.parse(JSON.parse(firstResult.destinations));
  return parsed;
}

export async function updateLinkDestinations(
  { linkId, destinations }: { linkId: string; destinations: LinkSchemaType['destinations'] },
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
