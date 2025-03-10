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

  let browser = null;

  try {
    console.log('啟動瀏覽器...');
    
    // 設定瀏覽器選項，針對Vercel無伺服器環境優化
    const executablePath = await chrome.executablePath;
    
    browser = await puppeteer.launch({
      args: [
        ...chrome.args,
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu'
      ],
      executablePath,
      headless: true,
      ignoreHTTPSErrors: true,
    });

    console.log('瀏覽器啟動成功');
    
    const page = await browser.newPage();
    
    // 設置模擬用戶代理
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    // 設定視窗大小
    await page.setViewport({ width: 600, height: 800 });
    
    console.log(`導航到URL: ${url}`);
    
    // 導航到Twitter貼文頁面，增加超時時間
    await page.goto(url, { 
      waitUntil: 'networkidle2',
      timeout: 20000 
    });
    
    console.log('頁面加載完成，等待推文內容...');
    
    // 等待貼文載入
    await page.waitForSelector('article[data-testid="tweet"]', { timeout: 15000 });
    
    console.log('推文內容已找到');
    
    // 等待一下讓頁面充分渲染
    await page.waitForTimeout(1000);
    
    // 展開所有內容（如果有「顯示更多」按鈕）
    try {
      const moreButtons = await page.$$('[data-testid="tweet"] [role="button"][tabindex="0"]');
      for (const button of moreButtons) {
        try {
          await button.click();
          await page.waitForTimeout(500);
        } catch (err) {
          // 忽略按鈕點擊錯誤
        }
      }
    } catch (error) {
      console.log('處理展開按鈕時出錯，繼續處理');
    }
    
    console.log('提取推文數據...');
    
    // 提取貼文數據
    const tweetData = await page.evaluate(() => {
      const article = document.querySelector('article[data-testid="tweet"]');
      if (!article) return null;

      // 獲取作者信息
      const authorElement = article.querySelector('[data-testid="User-Name"]');
      const authorName = authorElement?.querySelector('span')?.innerText || 'Unknown';
      const authorUsername = authorElement?.querySelector('div[dir="ltr"]')?.innerText || '@unknown';
      
      // 獲取頭像
      const avatarImg = article.querySelector('[data-testid="Tweet-User-Avatar"] img');
      const avatarSrc = avatarImg?.src || '';

      // 獲取貼文文本
      const textElement = article.querySelector('[data-testid="tweetText"]');
      const tweetText = textElement?.innerText || '';

      // 獲取圖片（如果有）
      const mediaElements = article.querySelectorAll('[data-testid="tweetPhoto"] img');
      const media = Array.from(mediaElements).map(img => ({
        src: img.src,
        alt: img.alt
      }));

      // 獲取日期時間
      const timeElement = article.querySelector('time');
      const datetime = timeElement?.getAttribute('datetime') || '';
      const displayTime = timeElement?.innerText || '';

      return {
        author: {
          name: authorName,
          username: authorUsername,
          avatar: avatarSrc
        },
        text: tweetText,
        media: media,
        created_at: datetime,
        display_time: displayTime
      };
    });

    if (!tweetData) {
      console.log('無法提取推文數據');
      await browser.close();
      return res.status(404).json({ error: '無法找到或提取貼文內容' });
    }

    console.log('成功提取推文數據，準備截圖...');
    
    // 截取整個推文的截圖
    const tweetElement = await page.$('article[data-testid="tweet"]');
    const screenshot = await tweetElement.screenshot({ encoding: 'base64' });

    console.log('截圖完成，關閉瀏覽器...');
    await browser.close();

    // 返回貼文數據和截圖
    return res.status(200).json({
      tweetData,
      screenshot: `data:image/png;base64,${screenshot}`
    });
  } catch (error) {
    console.error('截圖錯誤:', error);
    
    if (browser) {
      try {
        await browser.close();
      } catch (err) {
        console.error('關閉瀏覽器失敗:', err);
      }
    }
    
    return res.status(500).json({ 
      error: '獲取貼文失敗', 
      details: error.message,
      stack: error.stack
    });
  }
}