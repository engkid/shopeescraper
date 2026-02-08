import { Request, Response } from 'express';
import { ShopeeQueryParam } from '../../types';
import { uptime } from 'node:process';

export const scraperController = {
    scrapeShopee: async (req: Request<{}, any, any, ShopeeQueryParam>, res: Response) => {
        res.status(200).json({ message: 'Shopee scraper endpoint' });
    },
    
    healthCheck: async (_req: Request, res: Response) => {
        res.status(200).json({
            status: 'OK',
            timestamp: new Date().toISOString(),
            uptime: uptime()
        });
    }
};
