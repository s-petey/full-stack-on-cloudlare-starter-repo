import puppeteer from '@cloudflare/puppeteer';
import { htmlToMarkdown } from 'webforai';

/**
 * @throws If the page is not found...
 */
export async function collectDestinationInfo(env: Env, destinationUrl: string) {
  //
  // TODO: Should we check KV to see if we've already evaluated this recently?
  //

  const browser = await puppeteer.launch(env.VIRTUAL_BROWSER);
  const page = await browser.newPage();
  const response = await page.goto(destinationUrl);
  await page.waitForNetworkIdle();

  const html = await page.content();
  const screenshotBuffer = await page.screenshot({ fullPage: true, encoding: 'base64' });
  const screenshotDataBuffer = Buffer.from(screenshotBuffer, 'base64');
  const markdown = htmlToMarkdown(html, { baseUrl: destinationUrl });

  const status = response ? response.status() : 404;

  if (status >= 400) {
    console.warn(`Destination URL returned error status: ${status}`);

    await browser.close();
    throw new Error(`Destination URL returned status: ${status}`);
  }

  await browser.close();
  return {
    markdown,
    html,
    status,
    screenshotDataBuffer,
  };
}
