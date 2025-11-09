import { DurableObject } from 'cloudflare:workers';

// TODO: Should this be zodified?
interface ClickData {
  linkId: string;
  destinationUrl: string;
  destinationCountryCode: string;
}

const TWENTY_FOUR_HOURS_IN_MS = 24 * 60 * 60 * 1000;
const CLICK_DATA_STORAGE_KEY = 'click_data';

export class EvaluationScheduler extends DurableObject<Env> {
  private clickData: ClickData | null = null;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    ctx.blockConcurrencyWhile(async () => {
      this.clickData = (await ctx.storage.get<ClickData>(CLICK_DATA_STORAGE_KEY)) || null;
    });
  }

  async collectLinkClick(linkId: string, destinationUrl: string, destinationCountryCode: string) {
    this.clickData = {
      linkId,
      destinationUrl,
      destinationCountryCode,
    };
    await this.ctx.storage.put(CLICK_DATA_STORAGE_KEY, this.clickData);

    const alarm = await this.ctx.storage.getAlarm();
    if (!alarm) {
      const today = Date.now();
      const triggerTime = today + TWENTY_FOUR_HOURS_IN_MS;
      await this.ctx.storage.setAlarm(triggerTime);
    }
  }

  async alarm() {
    console.log('Evaluation scheduler alarm triggered');

    const clickData = this.clickData;

    if (!clickData) throw new Error('Click data not set');

    await this.env.DESTINATION_EVALUATION_WORKFLOW.create({
      params: {
        linkId: clickData.linkId,
        destinationUrl: clickData.destinationUrl,
      },
    });
  }
}
