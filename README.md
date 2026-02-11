# Shopee Scraper API

Express + TypeScript API to scrape Shopee product payloads using Playwright.

## Requirements

- Node.js `>=22`
- npm or pnpm

## Install

```bash
npm install
```

## Environment

Create a `.env` file (or copy from `.env.sample`) and set:

- `NAVIGATION_TIMEOUT`
- `SHOPEE_BASE_URL`
- `USER_AGENT`
- `BROWSER_API_ENDPOINT` (remote CDP endpoint)

Notes:
- Server port is currently hardcoded to `3000` in `src/index.ts`.
- Browserless reconnect settings are currently configured directly in `src/botAutomator/scraperRunner.ts`.

## Run

```bash
npm start
```

`npm start` compiles TypeScript and runs `dist/index.js`.

Base URL:

`http://localhost:3000`

## API Endpoints

### Health

- Method: `GET`
- URL: `/health`

```bash
curl -i http://localhost:3000/health
```

### Scrape Shopee

- Method: `GET`
- URL: `/shopee`
- Query: `storeId`, `dealId`

```bash
curl "http://localhost:3000/shopee?storeId=178926468&dealId=21448123549"
```

Success response shape:

```json
{
  "success": true,
  "result": {
    "error": null,
    "error_msg": null,
    "data": {
      "item": {}
    }
  }
}
```

Failure response shape:

```json
{
  "success": false,
  "error": "Failed to scrape Shopee product after multiple attempts"
}
```

## Scripts

- `npm run build`: compile TypeScript to `dist/`
- `npm start`: build and run API server

## Project Structure

```text
src/
  index.ts
  api/
    controller/
      shopee.scrapercontroller.ts
    routes/
      index.ts
  botAutomator/
    scraperbot.ts
    scraperRunner.ts
  configurations/
    index.ts
  types/
    index.ts
  utils/
    BrowserManager.ts
```

## High-Level Flow

1. Request enters `GET /shopee`.
2. Controller validates query and calls `scraperBot.scrapeShopee`.
3. Bot creates a browser/page and executes `scraperRunner.runScraper`.
4. Runner navigates to Shopee product page, intercepts target API responses, and returns parsed JSON payload.
