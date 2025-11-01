import { addLinkClick } from '@repo/data-ops/queries/links';
import { LinkClickMessageType } from '@repo/data-ops/zod-schema/queue';

export async function handleLinkClick(
  // TODO: Why is this here if it isn't needed?
  // env: Env,
  event: LinkClickMessageType,
) {
  return await addLinkClick(event.data);
}
