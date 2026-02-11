import { chromium, Browser, Page } from 'playwright';
import config from '../configurations';

export class BrowserManager {

  async createBrowserForBrowserless(): Promise<Browser> {
    const token = config.browserless.apiToken?.trim();
    if (!token) {
      console.warn('Missing Browserless token, falling back to local chromium');
      return chromium.launch({ headless: true });
    }

    const wsEndpoint = this.buildBrowserlessWsEndpoint(token);

    try {
      const browser = await chromium.connectOverCDP(wsEndpoint, {
        timeout: config.navigationTimeout
      });

      console.log('Connected to browserless successfully');
      return browser;
    } catch (error) {
      console.log('Error connecting to browserless:', error);
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

  private buildBrowserlessWsEndpoint(token: string): string {
    const configuredBaseUrl = config.browserless.baseUrl?.trim() || '';
    const source = configuredBaseUrl || 'https://production-sfo.browserless.io/chrome/bql';
    const endpoint = new URL(source);

    if (endpoint.protocol === 'https:') {
      endpoint.protocol = 'wss:';
    } else if (endpoint.protocol === 'http:') {
      endpoint.protocol = 'ws:';
    }

    endpoint.pathname = '/';
    endpoint.search = '';
    endpoint.searchParams.set('token', token);

    return endpoint.toString();
  }
}

export const browserManager = new BrowserManager();
