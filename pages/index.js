import { useState } from 'react';
import Head from 'next/head';
import axios from 'axios';

export default function Home() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tweetData, setTweetData] = useState(null);
  const [screenshot, setScreenshot] = useState('');
  const [customRendered, setCustomRendered] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setTweetData(null);
    setScreenshot('');
    setCustomRendered('');
    
    try {
      // 驗證URL格式
      if (!url.includes('twitter.com') && !url.includes('x.com')) {
        throw new Error('請輸入有效的Twitter/X貼文網址');
      }
      
      const response = await axios.post('/api/screenshot', { url });
      setTweetData(response.data.tweetData);
      setScreenshot(response.data.screenshot);
      
      // 生成自定義渲染的HTML
      generateCustomRender(response.data.tweetData);
    } catch (err) {
      setError(err.response?.data?.error || err.message || '獲取推文失敗，請確認URL是否正確');
    } finally {
      setLoading(false);
    }
  };

  // 生成自定義渲染的推文
  const generateCustomRender = (data) => {
    if (!data) return;

    // 創建自定義渲染的HTML
    const html = `
      <div class="tweet-card">
        <div class="tweet-header">
          <img src="${data.author.avatar}" alt="${data.author.name}" class="avatar"/>
          <div class="author-info">
            <div class="author-name">${data.author.name}</div>
            <div class="author-username">${data.author.username}</div>
          </div>
        </div>
        <div class="tweet-content">${data.text}</div>
        ${data.media.length > 0 ? `
          <div class="tweet-media ${data.media.length > 1 ? 'media-grid' : ''}">
            ${data.media.map((item, index) => `
              <img src="${item.src}" alt="圖片 ${index + 1}" class="media-item"/>
            `).join('')}
          </div>
        ` : ''}
        <div class="tweet-time">${data.display_time}</div>
      </div>
    `;

    setCustomRendered(html);
  };

  // 下載原始截圖
  const downloadOriginalScreenshot = () => {
    if (!screenshot) return;
    
    const link = document.createElement('a');
    link.href = screenshot;
    link.download = `twitter-screenshot-${new Date().getTime()}.png`;
    link.click();
  };

  // 下載自定義渲染截圖
  const downloadCustomScreenshot = () => {
    const element = document.getElementById('custom-tweet');
    if (!element) return;

    import('html2canvas').then((html2canvas) => {
      html2canvas.default(element, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
        allowTaint: true,
        useCORS: true
      }).then(canvas => {
        const image = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = image;
        link.download = `twitter-custom-${new Date().getTime()}.png`;
        link.click();
      }).catch(err => {
        console.error('截圖生成失敗:', err);
        alert('截圖生成失敗，請重試');
      });
    });
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Head>
        <title>Twitter/X 推文截圖工具</title>
        <meta name="description" content="截取完整Twitter/X貼文內容，無限制顯示" />
        <link rel="icon" href="/favicon.ico" />
        <style>{`
          .tweet-card {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            max-width: 500px;
            padding: 20px;
            border-radius: 12px;
            background-color: white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.12);
          }
          .tweet-header {
            display: flex;
            align-items: center;
            margin-bottom: 12px;
          }
          .avatar {
            width: 48px;
            height: 48px;
            border-radius: 50%;
            margin-right: 12px;
          }
          .author-info {
            display: flex;
            flex-direction: column;
          }
          .author-name {
            font-weight: bold;
            font-size: 16px;
          }
          .author-username {
            color: #536471;
            font-size: 14px;
          }
          .tweet-content {
            font-size: 16px;
            line-height: 1.4;
            margin-bottom: 12px;
            white-space: pre-wrap;
            word-wrap: break-word;
          }
          .tweet-media {
            margin-bottom: 12px;
            border-radius: 12px;
            overflow: hidden;
          }
          .media-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            grid-gap: 2px;
          }
          .media-item {
            width: 100%;
            height: auto;
            object-fit: cover;
          }
          .tweet-time {
            color: #536471;
            font-size: 14px;
          }
        `}</style>
      </Head>

      <main className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold text-center mb-8">Twitter/X 推文截圖工具</h1>
        
        <form onSubmit={handleSubmit} className="max-w-xl mx-auto mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="輸入推文URL (例如: https://twitter.com/username/status/1234567890)"
              className="flex-1 p-3 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-500 hover:bg-blue-600 text-white py-3 px-6 rounded shadow transition duration-200 disabled:opacity-50"
            >
              {loading ? '載入中...' : '獲取推文'}
            </button>
          </div>
        </form>

        {error && (
          <div className="max-w-xl mx-auto mb-6 p-4 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}

        {loading && (
          <div className="max-w-xl mx-auto my-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
            <p className="mt-2 text-gray-600">正在獲取推文並生成截圖...</p>
          </div>
        )}

        {tweetData && (
          <div className="max-w-xl mx-auto my-8 space-y-8">
            <div>
              <h2 className="text-xl font-semibold mb-4">原始推文截圖</h2>
              {screenshot && (
                <div className="mb-4">
                  <img 
                    src={screenshot} 
                    alt="推文截圖" 
                    className="w-full max-w-md mx-auto rounded-lg shadow-md"
                  />
                  <div className="mt-4 text-center">
                    <button
                      onClick={downloadOriginalScreenshot}
                      className="bg-green-500 hover:bg-green-600 text-white py-2 px-6 rounded shadow transition duration-200"
                    >
                      下載原始截圖
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-4">自定義樣式渲染</h2>
              {customRendered && (
                <div className="mb-4">
                  <div 
                    id="custom-tweet"
                    className="mx-auto"
                    dangerouslySetInnerHTML={{ __html: customRendered }}
                  />
                  <div className="mt-4 text-center">
                    <button
                      onClick={downloadCustomScreenshot}
                      className="bg-purple-500 hover:bg-purple-600 text-white py-2 px-6 rounded shadow transition duration-200"
                    >
                      下載自定義截圖
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        
        <div className="max-w-xl mx-auto mt-8">
          <h2 className="text-xl font-semibold mb-4">使用說明</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>複製您想要截圖的Twitter/X貼文URL</li>
            <li>將URL貼到上方輸入框</li>
            <li>點擊「獲取推文」按鈕</li>
            <li>等待系統爬取內容並處理（可能需要幾秒鐘）</li>
            <li>選擇下載原始截圖或自定義樣式截圖</li>
          </ul>
        </div>
      </main>

      <footer className="text-center py-6 text-gray-600">
        <p>© {new Date().getFullYear()} Twitter/X 推文截圖工具</p>
      </footer>
    </div>
  );
}