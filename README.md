# Twitter X Snap

使用Puppeteer抓取並重新渲染Twitter/X貼文的完整內容截圖工具。

## 主要功能

- 輸入Twitter/X貼文URL，獲取完整內容截圖
- 自動展開「顯示更多」內容，確保截取完整貼文
- 提供原始版面截圖與自定義樣式截圖兩種選擇
- 支援多媒體內容（圖片等）
- 無需Twitter API憑證，直接從網頁抓取

## 技術實現

- **前端框架**: Next.js + React
- **樣式**: Tailwind CSS
- **爬蟲**: Puppeteer-core
- **無伺服器Chrome**: @sparticuz/chromium
- **截圖工具**: html2canvas

## 本地開發

```bash
# 安裝依賴
npm install

# 啟動開發伺服器
npm run dev
```

## 部署到Vercel

1. Fork 或 Clone 此專案
2. 連接到Vercel
3. 在Vercel設置中增加函數執行時間限制（建議30秒以上）

## 使用須知

- 本工具僅供學習和個人使用
- 請遵守Twitter的服務條款
- 響應時間可能較長（5-10秒），請耐心等待

## 授權

MIT
