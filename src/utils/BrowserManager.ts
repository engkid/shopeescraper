import { chromium, Browser, Page } from 'playwright';
import config from '../configurations';

export class BrowserManager {

  async createBrowserForBrowserless(): Promise<Browser> {
    try {
      const browser = await chromium.launch({
        headless: true,
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
}

export const browserManager = new BrowserManager();
