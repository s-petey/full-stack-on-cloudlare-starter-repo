import { createFileRoute } from '@tanstack/react-router';
import { EvaluationsTable } from 'src/components/evaluations/evaluations-table';

export const Route = createFileRoute('/app/_authed/evaluations')({
  component: RouteComponent,
  loader: async ({ context }) => {
    await context.queryClient.prefetchQuery(
      context.trpc.evaluations.recentEvaluations.queryOptions(),
    );
  },
});

function RouteComponent() {
  return (
    <div className="p-6">
      <EvaluationsTable />
    </div>
  );
}
