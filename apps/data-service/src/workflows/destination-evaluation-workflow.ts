import { WorkflowEntrypoint, WorkflowEvent, WorkflowStep } from 'cloudflare:workers';

export class DestinationEvaluationWorkflow extends WorkflowEntrypoint<Env, unknown> {
  async run(event: Readonly<WorkflowEvent<unknown>>, step: WorkflowStep) {
    const collectedData = await step.do('Collect rendered destination page data', async () => {
      console.log('Collecting rendered destination page data');
      return {
        dummydata: 'dummydata',
        url: 'url' in event.payload && typeof event.payload.url === 'string' ? event.payload.url : 'unknown',
      };
    });
    console.log(collectedData);
  }
}
