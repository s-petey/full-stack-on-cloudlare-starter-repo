import { generateObject } from 'ai';
import { createWorkersAI } from 'workers-ai-provider';
import { z } from 'zod';

const SYSTEM_PROMPT =
  'You are an AI assistant for e-commerce analysis. Your job is to determine if the product on a webpage is available, not available, or if its status is unclear, based solely on the provided text. Be concise and base your reasoning on specific evidence from the content. Do not guess if information is insufficient.';

const PROMPT_START = `You will analyze the provided webpage content and determine if it reflects a product that is currently available, not available, or if the status is unclear.

Your goal is to:
- Identify language that indicates product availability (e.g., "in stock", "available for purchase", "add to cart").
- Identify language that indicates product unavailability (e.g., "out of stock", "sold out", "unavailable", "discontinued").
- Return "UNKNOWN_STATUS" if you cannot confidently determine the status.

Provide a clear reason supporting your determination based on the text.

---`;

const productStatus = z
  .enum(['AVAILABLE_PRODUCT', 'NOT_AVAILABLE_PRODUCT', 'UNKNOWN_STATUS'])
  .meta({
    description: `Indicates the product's availability on the page:
- AVAILABLE_PRODUCT: The product appears available for purchase.
- NOT_AVAILABLE_PRODUCT: The product appears unavailable (sold out, discontinued, etc.).
- UNKNOWN_STATUS: The status could not be determined from the text.
`.trim(),
  });

const productStatusReason = z
  .string()
  .describe(
    'A concise explanation citing specific words, phrases, or patterns from the content that led to this status. If status is UNKNOWN_STATUS, explain what was missing or ambiguous.',
  );

const pageStatus = z
  .object({
    status: productStatus,
    statusReason: productStatusReason,
  })
  .describe(
    'Information about the product availability status determined from the webpage content.',
  );

const resultSchema = z
  .object({
    pageStatus,
  })
  .describe('The result object returned by the assistant.');

export async function aiDestinationChecker(env: Env, markdown: string) {
  const workersAi = createWorkersAI({ binding: env.AI });

  const result = await generateObject({
    mode: 'json',
    // biome-ignore lint/suspicious/noExplicitAny: Currently workersAi does not have all the valid input types. Cast to any as a stop gap
    model: workersAi('@cf/meta/llama-3.3-70b-instruct-fp8-fast' as any),
    prompt: `
      ${PROMPT_START}
			Webpage Content:
			${markdown}
			`.trim(),
    system: SYSTEM_PROMPT,
    schema: resultSchema,
  });

  return {
    status: result.object.pageStatus.status,
    statusReason: result.object.pageStatus.statusReason,
  };
}
