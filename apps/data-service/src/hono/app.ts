import { getDestinationForCountry } from '@/helpers/route-ops';
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

    const link = await getLinkDestinations(validParam);

    if (link === null) {
      return c.json({ error: 'Link not found' }, 404);
    }

    const cfInfo = cloudflareInfoSchema.safeParse(c.req.raw.cf);

    if (!cfInfo.success) {
      // TODO: Replace with default routing...
      return c.text('Invalid Cloudflare info', 400);
    }

    const { country, latitude, longitude } = cfInfo.data;

    const routingPath = getDestinationForCountry(link, country);

    return c.redirect(routingPath);
  },
);

export { App };
