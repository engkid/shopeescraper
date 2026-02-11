import config from '../configurations/index.js';
import { ShopeeQueryParam, ShopeeScrapeResult } from '../types';
import { Page } from 'playwright';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const PREVIEW_LIMIT = 400;
const SCRAPER_TIMEOUT_MS = 45000;
const CAPTCHA_INDICATOR_PATTERN = /(captcha|verify|verification|challenge|security check|are you human|robot check)/i;

export type ScraperRunnerResult = {
  result: ShopeeScrapeResult | null;
  captchaSignals?: string[];
  error?: string;
};

type CaptchaSignalTracker = {
  network: boolean;
};

export class ScraperRunner {
  private targetAPIs = [
    '/api/v4/pdp/get_pc',
    '/api/v4/pdp/get_rw'
  ];

  async runScraper(page: Page, param: ShopeeQueryParam): Promise<ScraperRunnerResult> {
    const { storeId, dealId } = param;
    const captchaSignalTracker: CaptchaSignalTracker = {
      network: false
    };

    console.log(`scrape starting for storeId=${storeId}, dealId=${dealId}`);

    await this.setupRequestInterception(page, captchaSignalTracker);
    const targetApiResponsePromise = this.waitForTargetApiResponse(page, storeId, dealId, captchaSignalTracker);

    const shopeeProductUrl = `${config.shopee.baseUrl}/a-i.${storeId}.${dealId}`;
    console.log(`Navigating to URL: ${shopeeProductUrl}`);

    await this.navigateToDestinationPage(page, shopeeProductUrl);

    return targetApiResponsePromise;
  }

  private async setupRequestInterception(page: Page, captchaSignalTracker: CaptchaSignalTracker): Promise<void> {
    await page.route('**/*', async (route) => {
      const requestUrl = route.request().url();
      console.log(`Intercepted request: ${requestUrl}`);

      if (this.hasCaptchaIndicator(requestUrl)) {
        captchaSignalTracker.network = true;
      }

      await route.continue();
    });

    page.on('request', (request) => {
      const requestUrl = request.url();
      if (this.hasCaptchaIndicator(requestUrl)) {
        captchaSignalTracker.network = true;
      }

      if (this.targetAPIs.some((api) => requestUrl.includes(api))) {
        console.log('--- Target API Request Intercepted ---');
        console.log(`Request made: ${requestUrl}`);
        console.log(`Request method: ${request.method()}`);
        console.log(`Request headers: ${JSON.stringify(request.headers(), null, 2)}`);
      }
    });
  }

  private async waitForTargetApiResponse(
    page: Page,
    storeId: string,
    dealId: string,
    captchaSignalTracker: CaptchaSignalTracker
  ): Promise<ScraperRunnerResult> {
    try {
      const response = await page.waitForResponse(
        (networkResponse) => this.targetAPIs.some((api) => networkResponse.url().includes(api)),
        { timeout: SCRAPER_TIMEOUT_MS }
      );

      await this.capturePageView(page, storeId, dealId);

      const parsedOutput = this.parseApiResponse(response.status(), await response.text());
      const captchaSignals = new Set<string>(parsedOutput.captchaSignals || []);

      if (captchaSignalTracker.network) {
        captchaSignals.add('network');
      }

      return {
        ...parsedOutput,
        captchaSignals: Array.from(captchaSignals)
      };

    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        result: null,
        captchaSignals: captchaSignalTracker.network ? ['network'] : [],
        error: `Failed waiting for Shopee API response: ${message}`
      };
    }
  }

  private async capturePageView(page: Page, storeId: string, dealId: string): Promise<void> {
    try {
      const screenshotDir = path.resolve(process.cwd(), 'logs', 'screenshots');
      await mkdir(screenshotDir, { recursive: true });

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `shopee-${storeId}-${dealId}-${timestamp}.png`;
      const filePath = path.join(screenshotDir, fileName);

      await page.screenshot({
        path: filePath,
        fullPage: true
      });

      console.log(`[Capture] Page screenshot saved: ${filePath}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`[Capture] Failed to save screenshot: ${message}`);
    }
  }

  private parseApiResponse(status: number, responseBody: string): ScraperRunnerResult {
    const preview = responseBody.slice(0, PREVIEW_LIMIT);
    console.log(`Response status: ${status}`);
    console.log(`Response body (preview): ${preview}${responseBody.length > PREVIEW_LIMIT ? '...' : ''}`);

    if (!responseBody.trim()) {
      return {
        result: null,
        captchaSignals: [],
        error: 'Target Shopee API returned an empty response body.'
      };
    }

    let parsedBody: unknown;
    try {
      parsedBody = JSON.parse(responseBody);
    } catch {
      return {
        result: null,
        captchaSignals: [],
        error: 'Target Shopee API returned a non-JSON response body.'
      };
    }

    const captchaSignals = new Set<string>();
    if (this.hasCaptchaSignalFromPayload(parsedBody)) {
      captchaSignals.add('api_payload');
    }

    return {
      result: parsedBody as ShopeeScrapeResult,
      captchaSignals: Array.from(captchaSignals)
    };
  }

  private hasCaptchaIndicator(value: string): boolean {
    return CAPTCHA_INDICATOR_PATTERN.test(value);
  }

  private hasCaptchaSignalFromPayload(payload: unknown): boolean {
    if (typeof payload !== 'object' || payload === null) {
      return false;
    }

    const record = payload as Record<string, unknown>;
    const errorMessage = record.error_msg;
    const errorValue = record.error;

    if (typeof errorMessage === 'string' && this.hasCaptchaIndicator(errorMessage)) {
      return true;
    }

    if (typeof errorValue === 'string' && this.hasCaptchaIndicator(errorValue)) {
      return true;
    }

    return false;
  }

  private async navigateToDestinationPage(page: Page, url: string): Promise<void> {
    try {
      const navigationResponse = await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: 30000
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
