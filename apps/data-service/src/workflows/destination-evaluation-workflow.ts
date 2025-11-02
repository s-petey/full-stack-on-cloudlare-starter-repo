import { WorkflowEntrypoint, WorkflowEvent, WorkflowStep } from 'cloudflare:workers';
import { collectDestinationInfo } from '@/helpers/browser-render';
import { aiDestinationChecker } from '@/helpers/ai-destination-checker';
import { addEvaluation } from '@repo/data-ops/queries/evaluations';
import { initDatabase } from '@repo/data-ops/database';

// TODO: Should this be zod instead?
interface DestinationStatusEvaluationParams {
  linkId: string;
  destinationUrl: string;
  accountId: string;
}

export class DestinationEvaluationWorkflow extends WorkflowEntrypoint<Env, DestinationStatusEvaluationParams> {
  async run(event: Readonly<WorkflowEvent<DestinationStatusEvaluationParams>>, step: WorkflowStep) {
    // Is this better here or in the constructor?
    initDatabase(this.env.DB);

    const collectionData = await step.do('Collect rendered destination page data and store in R2', async () => {
      const collectedData = await collectDestinationInfo(this.env, event.payload.destinationUrl);

      const evaluationId = crypto.randomUUID();
      const accountId = event.payload.accountId;
      const pathPrefix = `evaluations/${accountId}/${evaluationId}/`;
      const r2PathHtml = `${pathPrefix}.html`;
      const r2PathScreenshot = `${pathPrefix}.png`;
      const r2PathMarkdown = `${pathPrefix}.md`;

      await Promise.all([
        this.env.BUCKET.put(r2PathHtml, collectedData.html),
        this.env.BUCKET.put(r2PathMarkdown, collectedData.markdown),
        this.env.BUCKET.put(r2PathScreenshot, collectedData.screenshotDataBuffer),
      ]);

      return {
        markdown: collectedData.markdown,
        evaluationId,
      };
    });

    const aiStatus = await step.do(
      'Use AI to check status of page',
      {
        retries: {
          limit: 0,
          delay: 0,
        },
      },
      async () => {
        return await aiDestinationChecker(this.env, collectionData.markdown);
      },
    );

    await step.do('Save evaluation in database', async () => {
      return await addEvaluation({
        evaluationId: collectionData.evaluationId,
        linkId: event.payload.linkId,
        status: aiStatus.status,
        reason: aiStatus.statusReason,
        accountId: event.payload.accountId,
        destinationUrl: event.payload.destinationUrl,
      });
    });
  }
}
