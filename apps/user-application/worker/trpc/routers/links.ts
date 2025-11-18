import {
  activeLinksLastHour,
  createLink,
  getLast24And48HourClicks,
  getLast30DaysClicks,
  getLast30DaysClicksByCountry,
  getLink,
  getLinks,
  totalLinkClickLastHour,
  updateLinkDestinations,
  updateLinkName,
} from '@repo/data-ops/queries/links';
import {
  createLinkSchema,
  destinationsSchema,
} from '@repo/data-ops/zod-schema/links';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { t } from '../trpc-instance';

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

  createLink: t.procedure
    .input(createLinkSchema)
    .mutation(async ({ input, ctx }) => {
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

  activeLinks: t.procedure.query(async ({ ctx }) => {
    return activeLinksLastHour(ctx.userInfo.userId);
  }),
  totalLinkClickLastHour: t.procedure.query(async ({ ctx }) => {
    return totalLinkClickLastHour(ctx.userInfo.userId);
  }),
  last24HourClicks: t.procedure.query(async ({ ctx }) => {
    return getLast24And48HourClicks(ctx.userInfo.userId);
  }),
  last30DaysClicks: t.procedure.query(async ({ ctx }) => {
    return getLast30DaysClicks(ctx.userInfo.userId);
  }),
  clicksByCountry: t.procedure.query(async ({ ctx }) => {
    return getLast30DaysClicksByCountry(ctx.userInfo.userId);
  }),
});
