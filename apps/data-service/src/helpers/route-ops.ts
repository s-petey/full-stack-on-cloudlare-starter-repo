import type { LinkSchemaType } from '@repo/data-ops/zod-schema/links';

export function getDestinationForCountry(destinations: LinkSchemaType['destinations'], countryCode?: string) {
  // Check if the country code exists in destinations
  if (countryCode && countryCode in destinations) {
    return destinations[countryCode];
  }

  // Fallback to default
  return destinations.default;
}
