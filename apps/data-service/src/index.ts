import { WorkerEntrypoint } from 'cloudflare:workers';
import { App } from './hono/app';
import { initDatabase } from '@repo/data-ops/database';
import { LinkClickMessageSchema } from '@repo/data-ops/zod-schema/queue';
import { handleLinkClick } from './queue-handlers/link-clicks-handler';

export default class DataService extends WorkerEntrypoint<Env> {
  constructor(ctx: ExecutionContext, env: Env) {
    super(ctx, env);

    initDatabase(env.DB);
  }

  async fetch(request: Request) {
    return App.fetch(request, this.env, this.ctx);
  }

  async queue(batch: MessageBatch<unknown>) {
    for (const message of batch.messages) {
      const result = LinkClickMessageSchema.safeParse(message.body);
      if (!result.success) {
        console.error('Invalid message format:', result.error);
        continue;
      }

      switch (result.data.type) {
        case 'LINK_CLICK':
          await handleLinkClick(result.data);
          break;
        default:
          console.error('Unknown message type:', result.data.type);
      }
    }
  }
}
