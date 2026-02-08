import { Router } from 'express';
import { scraperController } from '../controller/shopee.scrapercontroller';

const router: Router = Router();

router.get('/health', scraperController.healthCheck);
router.get('/shopee', scraperController.scrapeShopee);

export default router;
