export interface ShopeeQueryParam {
    storeId: string;
    dealId: string;
}

export interface ShopeeScrapeResult {
    bff_meta: unknown | null;
    error: unknown | null;
    error_msg: unknown | null;
    data: {
        item: {
            item_id: number;
            shop_id: number;
            title: string;
            currency: string;
            brand: string;
            shop_location: string;
            show_discount: number;
            price: number;
            price_min: number;
            price_max: number;
            [key: string]: any;
        };
        [key: string]: any;
    };
}

export interface ScrapingResult {
    success: boolean;
    result?: ShopeeScrapeResult;
    error?: string;
}