export interface Config {
  port: number;
  nodeEnv: string;
  shopee: {
    baseUrl: string;
  }
}

const config: Config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  shopee: {
    baseUrl: process.env.SHOPEE_BASE_URL || 'https://shopee.tw'
  }
}

export default config;
