import { getLinkDestinations } from '@repo/data-ops/queries/links';
import { destinationsSchema, linkSchema, type LinkSchemaType } from '@repo/data-ops/zod-schema/links';

const TTL_ONE_DAY = 60 * 60 * 24;

export function getDestinationForCountry(destinations: LinkSchemaType['destinations'], countryCode?: string) {
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
  } catch (error) {
    return null;
  }
}

async function saveLinkDestinationsToKv(env: Env, id: string, linkDestinations: LinkSchemaType['destinations']) {
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

export async function getRoutingDestination(env: Env, id: LinkSchemaType['linkId'], countryCode?: string) {
  const linkDestinations = await getRoutingDestinations(env, id);
  if (!linkDestinations) {
    return null;
  }

  return getDestinationForCountry(linkDestinations, countryCode);
}
