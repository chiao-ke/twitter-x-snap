// 簡化版的推文截圖API，減少使用Puppeteer的複雜性
import puppeteer from 'puppeteer-core';
import chrome from '@sparticuz/chromium';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url } = req.body;

  if (!url || (!url.includes('twitter.com') && !url.includes('x.com'))) {
    return res.status(400).json({ error: '請提供有效的Twitter/X貼文網址' });
  }

  console.log(`開始處理URL: ${url}`);
  let browser = null;

  try {
    console.log('嘗試啟動Chromium...');
    
    // 最簡化的瀏覽器配置
    browser = await puppeteer.launch({
      args: [
        ...chrome.args,
        '--no-sandbox',
        '--disable-setuid-sandbox'
      ],
      executablePath: await chrome.executablePath,
      headless: true
    });

    console.log('啟動瀏覽器成功');
    
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    console.log(`導航到頁面...`);
    await page.goto(url, { 
      waitUntil: 'networkidle0', 
      timeout: 30000 
    });
    
    console.log('頁面加載完成，查找推文元素');
    await page.waitForSelector('article[data-testid="tweet"]', { timeout: 20000 });
    
    // 最簡化的數據提取
    const tweetData = await page.evaluate(() => {
      const article = document.querySelector('article[data-testid="tweet"]');
      const text = article?.querySelector('[data-testid="tweetText"]')?.innerText || '無文本內容';
      
      return { text };
    });
    
    console.log('成功提取推文文本:', tweetData.text.substring(0, 50) + '...');
    
    // 獲取截圖
    const tweetElement = await page.$('article[data-testid="tweet"]');
    const screenshot = await tweetElement.screenshot({ encoding: 'base64' });
    
    console.log('截圖完成，關閉瀏覽器');
    await browser.close();
    
    return res.status(200).json({
      success: true,
      tweetData,
      screenshot: `data:image/png;base64,${screenshot}`
    });
  } catch (error) {
    console.error('錯誤詳情:', error);
    
    if (browser) {
      try { await browser.close(); } catch (e) {}
    }
    
    return res.status(500).json({ 
      error: '獲取推文失敗',
      message: error.message,
      stack: error.stack
    });
  }
}