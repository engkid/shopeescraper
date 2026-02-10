import { Request, Response } from 'express';
import { ShopeeQueryParam } from '../../types';
import { uptime } from 'node:process';
import { scraperBot } from '../../botAutomator/scraperbot.js';

export const scraperController = {
  async scrapeShopee(req: Request<{}, any, any, ShopeeQueryParam>, res: Response) {
    try {

      const { storeId, dealId } = req.query;
      const result = await scraperBot.scrapeShopee(storeId, dealId);

      if (result.success === false) {
        return res.status(500).json(result);
      }

      res.status(200).json(result);

    } catch (error) {
      console.error('Error in scrapeShopee controller:', error);
      res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
  },

  async healthCheck (_req: Request, res: Response) {
    res.status(200).json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: uptime()
    });
  }
};
