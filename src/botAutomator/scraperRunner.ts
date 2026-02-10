import { url } from 'inspector/promises';
import config from '../configurations/index.js';
import { ShopeeQueryParam, ShopeeScrapeResult } from '../types';
import { Page } from 'playwright';
import playwright from 'playwright-core';

const PREVIEW_LIMIT = 400;
const timeout = 45000;

const token = "2TxEFYr7yV7mObu171a6549a55d313233aa182ab3b7daef6d";

const query = `
  mutation Reconnect($url: String!) {
    goto(url: $url, waitUntil: networkIdle) {
      status
    }
    reconnect(timeout: ${timeout}) {
      browserWSEndpoint
    }
  }
`;

const endpoint = `https://production-sfo.browserless.io/chrome/bql?token=${token}`;

export type ScraperRunnerResult = {
  result: ShopeeScrapeResult | null;
  error?: string;
};

export class ScraperRunner {
  private targetAPIs = [
    '/api/v4/pdp/get_pc',
    '/api/v4/pdp/get_rw'
  ];

  async runScraper(page: Page, param: ShopeeQueryParam): Promise<ScraperRunnerResult> {

    const { storeId, dealId } = param;

    console.log(`scrape starting for storeId=${storeId}, dealId=${dealId}`);

    await this.setupRequestInterception(page);
    const targetApiResponsePromise = this.waitForTargetApiResponse(page);

    const shopeeProductUrl = `${config.shopee.baseUrl}/a-i.${storeId}.${dealId}`;
    console.log(`Navigating to URL: ${shopeeProductUrl}`);

    await this.navigateToDestinationPage(page, shopeeProductUrl);

    return targetApiResponsePromise;
  }

  private async setupRequestInterception(page: Page): Promise<void> {
    await page.route('**/*', async (route) => {
      console.log(`Intercepted request: ${route.request().url()}`);
      await route.continue();
    })


    page.on('request', (request) => {

      // get target apis
      if (this.targetAPIs.some(api => request.url().includes(api))) {
        console.log('--- Target API Request Intercepted ---');
        console.log('[Browserless-Reconnect] Preparing reconnect request payload');

        const options = {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ query, variables: { url: request.url() } }),
        };

        (async () => {
          console.log(`[Browserless-Reconnect] Calling reconnect endpoint: ${endpoint}`);
          const res = await fetch(endpoint, options);
          console.log(`[Browserless-Reconnect] Reconnect response status: ${res.status}`);
          const { data } = await res.json();
          console.log('[Browserless-Reconnect] Reconnect payload received');
          const ws = data.reconnect.browserWSEndpoint;
          console.log(`[Browserless-Reconnect] browserWSEndpoint: ${ws}`);

          const wsWithToken = ws + "?token=" + token;
          console.log('[Browserless-Reconnect] Connecting playwright over CDP');
          const browser = await playwright.chromium.connectOverCDP(wsWithToken);
          console.log('[Browserless-Reconnect] CDP connection established, closing browser');

          await browser.close();
          console.log('[Browserless-Reconnect] Browser closed');
        })();

        console.log(`Request made: ${request.url()}`);
        console.log(`Request method: ${request.method()}`);
        console.log(`Request headers: ${JSON.stringify(request.headers(), null, 2)}`);
      }
    })


  }

  private async waitForTargetApiResponse(page: Page): Promise<ScraperRunnerResult> {
    try {
      const response = await page.waitForResponse(
        (networkResponse) => this.targetAPIs.some((api) => networkResponse.url().includes(api)),
        { timeout: timeout }
      );

      const responseBody = await response.text();
      const preview = responseBody.slice(0, PREVIEW_LIMIT);
      console.log(`Response status: ${response.status()}`);
      console.log(`Response body (preview): ${preview}${responseBody.length > PREVIEW_LIMIT ? '...' : ''}`);

      if (!responseBody.trim()) {
        return {
          result: null,
          error: 'Target Shopee API returned an empty response body.'
        };
      }

      let parsedBody: unknown;
      try {
        parsedBody = JSON.parse(responseBody);
      } catch {
        return {
          result: null,
          error: 'Target Shopee API returned a non-JSON response body.'
        };
      }

      return {
        result: parsedBody as ShopeeScrapeResult
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        result: null,
        error: `Failed waiting for Shopee API response: ${message}`
      };
    }
  }

  private async navigateToDestinationPage(page: Page, url: string): Promise<void> {
    try {

      const navigationResponse = await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      });

      console.log(`Page navigation response status: ${navigationResponse?.status()}`);

      await this.makeUserBehaviorLikeOnWindowLevel(page);

      return;
    } catch (error) {
      console.error('Error during page navigation:', error);

    }

    throw new Error('Failed to navigate to Shopee product page after multiple attempts');
  }

  private async randomDelay(minMs: number, maxMs: number): Promise<void> {
    const delay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
    return new Promise((resolve) => setTimeout(resolve, delay));
  }

  private async makeUserBehaviorLikeOnWindowLevel(page: Page): Promise<void> {
    const viewport = page.viewportSize() || { width: 1366, height: 768 };

    await this.randomDelay(1500, 3500);

    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight / 2);
    });

    await page.mouse.wheel(0, Math.floor(viewport.height / 3));
    await this.randomDelay(200, 500);

    await page.mouse.wheel(0, -Math.floor(viewport.height / 6));
    await this.randomDelay(150, 350);

    await this.randomDelay(1500, 3500);

    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight / 4);
    });

    await page.evaluate(() => {
      window.dispatchEvent(new Event('focus'));
      window.dispatchEvent(new Event('mousemove'));
      window.dispatchEvent(new Event('scroll'));
    });
  }

}

export const scraperRunner = new ScraperRunner();
