import { getLinkById, getLinkDestinations } from '@repo/data-ops/queries/links';
import {
  destinationsSchema,
  type LinkSchemaType,
} from '@repo/data-ops/zod-schema/links';
import {
  LinkClickMessageSchema,
  type LinkClickMessageType,
} from '@repo/data-ops/zod-schema/queue';

const TTL_ONE_DAY = 60 * 60 * 24;

export function getDestinationForCountry(
  destinations: LinkSchemaType['destinations'],
  countryCode?: string,
) {
  if (countryCode && countryCode in destinations) {
    return destinations[countryCode];
  }

  return destinations.default;
}

async function getLinkDestinationsFromKv(env: Env, id: string) {
  try {
    const linkDestinations = await env.KV.get(id);
    if (!linkDestinations) return null;

    return destinationsSchema.parse(linkDestinations);
  } catch (_error) {
    return null;
  }
}

async function saveLinkDestinationsToKv(
  env: Env,
  id: string,
  linkDestinations: LinkSchemaType['destinations'],
) {
  try {
    await env.KV.put(id, JSON.stringify(linkDestinations), {
      expirationTtl: TTL_ONE_DAY,
    });
  } catch (error) {
    console.error('Error saving link destinations to KV:', error);
  }
}

async function getRoutingDestinations(env: Env, id: LinkSchemaType['linkId']) {
  const cachedDestinations = await getLinkDestinationsFromKv(env, id);
  if (cachedDestinations) {
    return cachedDestinations;
  }
  try {
    const destinations = await getLinkDestinations(id);

    if (!destinations) {
      return null;
    }

    await saveLinkDestinationsToKv(env, id, destinations);

    return destinations;
  } catch (error) {
    console.error('Error fetching link destinations from DB:', error);
    return null;
  }
}

export async function getRoutingDestination(
  env: Env,
  id: LinkSchemaType['linkId'],
  countryCode?: string,
) {
  const linkDestinations = await getRoutingDestinations(env, id);
  if (!linkDestinations) {
    return null;
  }

  return getDestinationForCountry(linkDestinations, countryCode);
}

export async function scheduleEvalWorkflow(
  env: Env,
  linkInfo: LinkClickMessageType['data'],
) {
  const doId = env.EVALUATION_SCHEDULER_OBJECT.idFromName(
    `${linkInfo.id}:${linkInfo.destination}`,
  );
  const stub = env.EVALUATION_SCHEDULER_OBJECT.get(doId);
  await stub.collectLinkClick(
    linkInfo.id,
    linkInfo.destination,
    linkInfo.country || 'UNKNOWN',
  );
}

export async function captureLinkClickInBackground(
  env: Env,
  message: LinkClickMessageType,
) {
  await env.QUEUE.send(LinkClickMessageSchema.encode(message));

  // TODO: Should we really log this?
  if (
    !message.data.latitude ||
    !message.data.longitude ||
    !message.data.country
  )
    return;

  const link = await getLinkById(message.data.id);
  const doId = env.LINK_CLICK_TRACKER_OBJECT.idFromName(link.accountId);
  const stub = env.LINK_CLICK_TRACKER_OBJECT.get(doId);
  await stub.addClick({
    latitude: message.data.latitude,
    longitude: message.data.longitude,
    country: message.data.country,
    time: Date.now(),
  });
}
