import { chromium, Browser, Page } from 'playwright';
import config from '../configurations';

export class BrowserManager {
  async createBrowser(): Promise<Browser> {
    const connectionUrl = config.brightDataWsEndpoint;

    if (!connectionUrl) {
      throw new Error(
        'Missing Bright Data browser endpoint. Set `BROWSER_API_ENDPOINTT` in environment variables.'
      );
    }

    try {
      const connectionResult = await chromium.connectOverCDP(connectionUrl);
      console.log('Connected to remote browser successfully');
      return connectionResult;
    } catch (error) {
      console.log('Error connecting to remote browser:', error);
      throw error;
    }
  }

  async buildPage(browser: Browser): Promise<Page> {
    const context = await browser.newContext({
      userAgent: config.userAgent
    });
    return context.newPage();
  }

  async closeBrowser(browser: Browser): Promise<void> {
    await browser.close();
  }
}

export const browserManager = new BrowserManager();
