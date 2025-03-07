module.exports = {
  reactStrictMode: true,
  images: {
    domains: ['pbs.twimg.com', 'abs.twimg.com'],
  },
  // 增加API超時限制，因為爬取可能需要時間
  api: {
    responseLimit: false,
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
  // 由於我們使用@sparticuz/chromium和puppeteer-core，需要這些配置確保外部二進制檔能夠正確載入
  experimental: {
    outputStandalone: true,
  },
}