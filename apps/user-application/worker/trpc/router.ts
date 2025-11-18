import { evaluationsTrpcRoutes } from './routers/evaluations';
import { linksTrpcRoutes } from './routers/links';
import { t } from './trpc-instance';

export const appRouter = t.router({
  links: linksTrpcRoutes,
  evaluations: evaluationsTrpcRoutes,
});

export type AppRouter = typeof appRouter;
