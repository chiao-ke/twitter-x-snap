// 簡單的API端點測試，不使用Puppeteer
export default function handler(req, res) {
  try {
    console.log('測試API連接中...');
    
    // 返回簡單的成功訊息
    return res.status(200).json({ 
      status: 'success',
      message: '連接測試成功',
      time: new Date().toISOString(),
      environment: {
        nodeVersion: process.version,
        platform: process.platform
      }
    });
  } catch (error) {
    console.error('測試連接錯誤:', error);
    
    return res.status(500).json({ 
      status: 'error', 
      message: '測試連接失敗', 
      error: error.message,
      stack: error.stack
    });
  }
}