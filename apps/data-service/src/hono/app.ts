import { captureLinkClickInBackground, getRoutingDestination } from '@/helpers/route-ops';
import { cloudflareInfoSchema } from '@repo/data-ops/zod-schema/links';
import { LinkClickMessageType } from '@repo/data-ops/zod-schema/queue';
import { Hono } from 'hono';
import z from 'zod';

const App = new Hono<{ Bindings: Env }>();

const stringSchema = z.string().min(1);

App.get('/click-socket', async (c) => {
  const upgradeHeader = c.req.header('Upgrade');
  if (!upgradeHeader || upgradeHeader !== 'websocket') {
    return c.text('Expected Upgrade: websocket', 426);
  }

  // TODO: Manage auth?
  const accountId = c.req.header('account-id');

  if (!accountId) return c.text('No Headers', 404);
  const doId = c.env.LINK_CLICK_TRACKER_OBJECT.idFromName('hhJpSiYufu');
  const stub = c.env.LINK_CLICK_TRACKER_OBJECT.get(doId);
  return await stub.fetch(c.req.raw);
});

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
    c.executionCtx.waitUntil(captureLinkClickInBackground(c.env, queueMessage));

    return c.redirect(routingPath);
  },
);

App.get('/click/:linkId', async (c) => {
  const linkId = c.req.param('linkId');

  const doId = c.env.LINK_CLICK_TRACKER_OBJECT.idFromName(linkId);
  const stub = c.env.LINK_CLICK_TRACKER_OBJECT.get(doId);

  return stub.getLinkClicks(c.req.raw);
});

export { App };
