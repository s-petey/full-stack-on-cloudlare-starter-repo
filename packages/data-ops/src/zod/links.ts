import { z } from 'zod';

export const destinationsSchema = z.preprocess(
  (obj) => {
    if (typeof obj === 'string') {
      console.log(obj);
      return JSON.parse(obj);
    }
    return obj;
  },
  z
    .object({
      default: z.url(),
    })
    .catchall(z.url()),
);

export const linkSchema = z.object({
  linkId: z.string(),
  accountId: z.string(),
  name: z.string().min(1).max(100),
  destinations: destinationsSchema,
  created: z.string(),
  updated: z.string(),
});
export const createLinkSchema = linkSchema.omit({
  created: true,
  updated: true,
  accountId: true,
  linkId: true,
});

export const cloudflareInfoSchema = z.object({
  country: z.string().optional(),
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
});

export const durableObjectGeoClickSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  time: z.number(),
  country: z.string(),
});

export const durableObjectGeoClickArraySchema = z.array(
  durableObjectGeoClickSchema,
);

export const evaluationProductStatus = z
  .enum(['AVAILABLE_PRODUCT', 'NOT_AVAILABLE_PRODUCT', 'UNKNOWN_STATUS'])
  .meta({
    description: `Indicates the product's availability on the page:
- AVAILABLE_PRODUCT: The product appears available for purchase.
- NOT_AVAILABLE_PRODUCT: The product appears unavailable (sold out, discontinued, etc.).
- UNKNOWN_STATUS: The status could not be determined from the text.
`.trim(),
  });

export type EvaluationProductStatusType = z.infer<
  typeof evaluationProductStatus
>;
export type DestinationsSchemaType = z.infer<typeof destinationsSchema>;
export type DurableObjectGeoClickSchemaType = z.infer<
  typeof durableObjectGeoClickSchema
>;
export type CloudflareInfoSchemaType = z.infer<typeof cloudflareInfoSchema>;
export type LinkSchemaType = z.infer<typeof linkSchema>;
export type CreateLinkSchemaType = z.infer<typeof createLinkSchema>;
