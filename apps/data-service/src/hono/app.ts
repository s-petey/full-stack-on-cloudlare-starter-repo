import { getRoutingDestination } from '@/helpers/route-ops';
import { cloudflareInfoSchema } from '@repo/data-ops/zod-schema/links';
import { LinkClickMessageSchema, LinkClickMessageType } from '@repo/data-ops/zod-schema/queue';
import { Hono } from 'hono';
import z from 'zod';

const App = new Hono<{ Bindings: Env }>();

const stringSchema = z.string().min(1);

App.get(
  '/:id',
  // zValidator(
  //   'json',
  //   //
  //   stringSchema,
  // ),
  // zValidator(
  //   'form',
  //   z.object({
  //     name: z.string().min(2),
  //   }),
  // ),
  async (c) => {
    const param = c.req.param('id');
    const validParam = stringSchema.parse(param);
    // const json = c.req.valid('json');
    // const form = c.req.valid('form');

    const cfInfo = cloudflareInfoSchema.safeParse(c.req.raw.cf);

    let country: string | undefined = undefined;
    if (cfInfo.success) {
      country = cfInfo.data.country;
    }

    const routingPath = await getRoutingDestination(c.env, validParam, country);

    if (routingPath === null) {
      return c.json({ error: 'Link not found' }, 404);
    }

    const queueMessage: LinkClickMessageType = {
      data: {
        country,
        latitude: cfInfo.data?.latitude,
        longitude: cfInfo.data?.longitude,
        destination: routingPath,
        id: validParam,
        timestamp: new Date(),
      },
      type: 'LINK_CLICK',
    };

    // Let CF handle sending this before the worker closes.
    c.executionCtx.waitUntil(c.env.QUEUE.send(LinkClickMessageSchema.encode(queueMessage)));

    return c.redirect(routingPath);
  },
);

export { App };
