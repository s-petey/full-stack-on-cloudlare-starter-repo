import { t } from '@/worker/trpc/trpc-instance';
import { z } from 'zod';
import { createLinkSchema, destinationsSchema } from '@repo/data-ops/zod-schema/links';
import { createLink, getLink, getLinks, updateLinkDestinations, updateLinkName } from '@repo/data-ops/queries/links';

import { TRPCError } from '@trpc/server';
import { ACTIVE_LINKS_LAST_HOUR, LAST_30_DAYS_BY_COUNTRY } from './dummy-data';

export const linksTrpcRoutes = t.router({
  linkList: t.procedure
    .input(
      z.object({
        offset: z.number().optional(),
      }),
    )
    .query(async ({ ctx }) => {
      // TODO: Why the hell is offset a number, but a string internally?
      const links = await getLinks(ctx.userInfo.userId);

      return links;
    }),

  createLink: t.procedure.input(createLinkSchema).mutation(async ({ input, ctx }) => {
    return await createLink(input, ctx.userInfo.userId);
  }),

  updateLinkName: t.procedure
    .input(
      z.object({
        linkId: z.string(),
        name: z.string().min(1).max(300),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      return await updateLinkName(
        {
          linkId: input.linkId,
          name: input.name,
        },
        ctx.userInfo.userId,
      );
    }),

  getLink: t.procedure
    .input(
      z.object({
        linkId: z.string(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const foundLink = await getLink(input.linkId, ctx.userInfo.userId);

      if (!foundLink) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      return foundLink;
    }),

  updateLinkDestinations: t.procedure
    .input(
      z.object({
        linkId: z.string(),
        destinations: destinationsSchema,
      }),
    )
    .mutation(async ({ input, ctx }) => {
      return await updateLinkDestinations(
        {
          linkId: input.linkId,
          destinations: input.destinations,
        },
        ctx.userInfo.userId,
      );
    }),

  activeLinks: t.procedure.query(async () => {
    return ACTIVE_LINKS_LAST_HOUR;
  }),
  totalLinkClickLastHour: t.procedure.query(async () => {
    return 13;
  }),
  last24HourClicks: t.procedure.query(async () => {
    return {
      last24Hours: 56,
      previous24Hours: 532,
      percentChange: 12,
    };
  }),
  last30DaysClicks: t.procedure.query(async () => {
    return 78;
  }),
  clicksByCountry: t.procedure.query(async () => {
    return LAST_30_DAYS_BY_COUNTRY;
  }),
});
