import {
  getEvaluations,
  getNotAvailableEvaluations,
} from '@repo/data-ops/queries/evaluations';
import { z } from 'zod';
import { t } from '@/worker/trpc/trpc-instance';

export const evaluationsTrpcRoutes = t.router({
  problematicDestinations: t.procedure.query(async ({ ctx }) => {
    const userId = ctx.userInfo.userId;

    return await getNotAvailableEvaluations(userId);
  }),
  recentEvaluations: t.procedure
    .input(
      z
        .object({
          createdBefore: z.string().optional(),
        })
        .optional(),
    )
    .query(async ({ ctx }) => {
      const userId = ctx.userInfo.userId;
      const evaluations = await getEvaluations(userId);

      const oldestCreatedAt =
        evaluations.length > 0
          ? // TODO: Should this use the `encode` for my date helper?
            evaluations[evaluations.length - 1].createdAt
          : null;

      return {
        data: evaluations,
        oldestCreatedAt,
      };
    }),
});
