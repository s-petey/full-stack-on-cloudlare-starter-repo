import puppeteer from '@cloudflare/puppeteer';

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

  // TODO: Why do we need body text and the HTML? -- instead should we get it as markdown? using (webforai) or other package?
  // const bodyText = await page.$eval('body', (el) => el.innerText);
  const html = await page.content();

  const status = response ? response.status() : 404;

  if (status >= 400) {
    console.warn(`Destination URL returned error status: ${status}`);

    await browser.close();
    throw new Error(`Destination URL returned status: ${status}`);
  }

  await browser.close();
  return {
    // bodyText,
    html,
    status,
  };
}
