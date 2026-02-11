import { loadEnvFile } from 'node:process';

try {
  loadEnvFile();
} catch {
  // Ignore missing .env; process environment variables can still be provided by runtime.
}

export interface Config {
  brightDataWsEndpoint: string;
  navigationTimeout?: number;
  userAgent?: string;
  browserless: {
    apiToken?: string;
    baseUrl?: string;
  }
  shopee: {
    baseUrl: string;
  }
}

const config: Config = {
  brightDataWsEndpoint:
    process.env.BROWSER_API_ENDPOINT || process.env.PLAYWRIGHT_WS_ENDPOINT || '',
  navigationTimeout: Number(process.env.NAVIGATION_TIMEOUT) || 30000,
  userAgent: process.env.USER_AGENT || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36',
  browserless: {
    apiToken: process.env.BROWSERLESS_API_TOKEN || '',
    baseUrl: process.env.BROWSERLESS_SERVICE_URL || 'https://production-sfo.browserless.io/chrome/bql?token='
  },
  shopee: {
    baseUrl: process.env.SHOPEE_BASE_URL || 'https://shopee.tw'
  }
}

export default config;
