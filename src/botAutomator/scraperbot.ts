import { Browser } from 'playwright';
import { ScrapingResult, ShopeeScrapeResult } from '../types/index.js';
import { browserManager } from '../utils/BrowserManager.js';
import { scraperRunner } from './scraperRunner.js';

const isNonEmptyString = (value: unknown): value is string => {
  return typeof value === 'string' && value.trim().length > 0;
};

const hasShopeePayloadError = (result: ShopeeScrapeResult): boolean => {
  const hasErrorCode =
    result.error !== null &&
    result.error !== 0 &&
    result.error !== '0' &&
    result.error !== false;

  const hasErrorMessage =
    result.error_msg !== null &&
    result.error_msg !== undefined &&
    (typeof result.error_msg === 'string'
      ? result.error_msg.trim().length > 0
      : true);

  return hasErrorCode || hasErrorMessage;
};

const formatShopeePayloadError = (result: ShopeeScrapeResult): string => {
  if (isNonEmptyString(result.error_msg)) {
    return result.error_msg.trim();
  }

  if (result.error !== null && result.error !== undefined) {
    return `Shopee API returned error: ${String(result.error)}`;
  }

  return 'Shopee API returned an error payload.';
};

export const scraperBot = {
  async scrapeShopee(storeId: string, dealId: string): Promise<ScrapingResult> {
    let lastError: Error | null = null;
    let browser: Browser | null = null;

    console.log('Starting scrapeShopee');

    try {
      browser = await browserManager.createBrowserForBrowserless();
      const page = await browserManager.buildPage(browser);
      console.log('Browser and page created');

      const runnerOutput = await scraperRunner.runScraper(page, { storeId, dealId });
      const result = runnerOutput.result;

      console.log(`got the result from targetUrl`, result);

      if (!result) {
        return {
          success: false,
          error: runnerOutput.error || 'No target Shopee API response was captured.'
        };
      }

      if (hasShopeePayloadError(result)) {
        return {
          success: false,
          error: formatShopeePayloadError(result)
        };
      }

      console.log('[SCRAPER_RESULT]');
      console.log(JSON.stringify(result, null, 2));

      return {
        success: true,
        result
      };
    } catch (error) {
      lastError = error as Error;
    } finally {
      if (browser) {
        await browserManager.closeBrowser(browser);
      }
    }

    return {
      success: false,
      error: lastError?.message || 'Failed to scrape Shopee product after multiple attempts'
    };
  }
};
