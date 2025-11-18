import {
  WorkflowEntrypoint,
  type WorkflowEvent,
  type WorkflowStep,
} from 'cloudflare:workers';
import { initDatabase } from '@repo/data-ops/database';
import { addEvaluation } from '@repo/data-ops/queries/evaluations';
import { getLinkById } from '@repo/data-ops/queries/links';
import { collectDestinationInfo } from '../helpers/browser-render';
import { aiDestinationChecker } from '../helpers/ai-destination-checker';

// TODO: Should this be zod instead?
interface DestinationStatusEvaluationParams {
  linkId: string;
  destinationUrl: string;
}

export class DestinationEvaluationWorkflow extends WorkflowEntrypoint<
  Env,
  DestinationStatusEvaluationParams
> {
  async run(
    event: Readonly<WorkflowEvent<DestinationStatusEvaluationParams>>,
    step: WorkflowStep,
  ) {
    // Is this better here or in the constructor?
    initDatabase(this.env.DB);

    const collectionData = await step.do(
      'Collect rendered destination page data and store in R2',
      async () => {
        const [collectedData, link] = await Promise.all([
          collectDestinationInfo(this.env, event.payload.destinationUrl),
          getLinkById(event.payload.linkId),
        ]);

        const evaluationId = crypto.randomUUID();
        const accountId = link.accountId;
        const pathPrefix = `evaluations/${accountId}/${evaluationId}`;
        const r2PathHtml = `${pathPrefix}.html`;
        const r2PathScreenshot = `${pathPrefix}.png`;
        const r2PathMarkdown = `${pathPrefix}.md`;

        await Promise.all([
          this.env.BUCKET.put(r2PathHtml, collectedData.html),
          this.env.BUCKET.put(r2PathMarkdown, collectedData.markdown),
          this.env.BUCKET.put(
            r2PathScreenshot,
            collectedData.screenshotDataBuffer,
          ),
        ]);

        return {
          markdown: collectedData.markdown,
          evaluationId,
          accountId,
        };
      },
    );

    const aiStatus = await step.do(
      'Use AI to check status of page',
      {
        retries: {
          limit: 0,
          delay: 0,
        },
      },
      async () => {
        return {
          status: 'UNKNOWN_STATUS',
          statusReason: 'AI evaluation is not yet implemented.',
        } as const;

        // biome-ignore lint/correctness/noUnreachable: LOCAL ONLY
        return await aiDestinationChecker(this.env, collectionData.markdown);
      },
    );

    await step.do('Save evaluation in database', async () => {
      return await addEvaluation({
        evaluationId: collectionData.evaluationId,
        linkId: event.payload.linkId,
        status: aiStatus.status,
        reason: aiStatus.statusReason,
        accountId: collectionData.accountId,
        destinationUrl: event.payload.destinationUrl,
      });
    });
  }
}
