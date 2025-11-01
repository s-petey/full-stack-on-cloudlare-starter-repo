import { getDestinationForCountry, getRoutingDestination } from '@/helpers/route-ops';
import { getLinkDestinations } from '@repo/data-ops/queries/links';
import { cloudflareInfoSchema } from '@repo/data-ops/zod-schema/links';
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

    return c.redirect(routingPath);
  },
);

export { App };
