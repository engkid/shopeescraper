# Shopee Scraper API

Simple Express + TypeScript API for Shopee scraping workflows.

## Requirements

- Node.js `>=22`
- npm or pnpm

## Install

```bash
npm install
```

or

```bash
pnpm install
```

## Run

```bash
npm start
```

`npm start` will compile TypeScript (`tsc`) and run `dist/index.js`.

Server default URL:

`http://localhost:3000`

## API Endpoints

### Health Check

- Method: `GET`
- URL: `/api/health`

Example:

```bash
curl -i http://localhost:3000/api/health
```

Example response:

```json
{
  "status": "OK",
  "timestamp": "2026-02-08T00:00:00.000Z",
  "uptime": 12.345
}
```

### Shopee Scraper Endpoint

- Method: `GET`
- URL: `/api/shopee`
- Query params (planned): `storeId`, `dealId`

Current response:

```json
{
  "message": "Shopee scraper endpoint"
}
```

## Scripts

- `npm run build` - compile TypeScript to `dist/`
- `npm start` - build then run server

## Project Structure

```text
src/
  index.ts
  api/
    routes/index.ts
    controller/shopee.scrapercontroller.ts
  botAutomator/
    scraper.bot.ts
  types/
    index.ts
```

## Notes

- Scraper implementation in `src/botAutomator/scraper.bot.ts` is still a scaffold.
- Health check is useful for readiness/liveness checks in deployment.
