import { z } from 'zod';
import { cloudflareInfoSchema, linkSchema } from './links';

export const stringToIsoDateTime = z.codec(
  z.iso.datetime(), // input schema: ISO date string
  z.date(), // output schema: Date object
  {
    decode: (isoString) => new Date(isoString), // ISO string → Date
    encode: (date) => date.toISOString(), // Date → ISO string
  },
);

// Base queue message schema
const BaseQueueMessageSchema = z.object({
  type: z.string(),
  data: z.unknown(),
});

// Email queue message schema
export const LinkClickMessageSchema = BaseQueueMessageSchema.extend({
  type: z.literal('LINK_CLICK'),
  data: cloudflareInfoSchema.extend({
    id: linkSchema.shape.linkId,
    destination: z.url(),
    // TODO: Should this accountId really be there?
    // as it is part of the link that is create, not related to the person requesting it...
    // If we need the account Id we can get it from this linkId...
    // accountId: linkSchema.shape.accountId,
    timestamp: stringToIsoDateTime,
  }),
});

export const QueueMessageSchema = z.discriminatedUnion('type', [LinkClickMessageSchema]);

export type LinkClickMessageType = z.infer<typeof LinkClickMessageSchema>;
export type QueueMessageType = z.infer<typeof QueueMessageSchema>;
