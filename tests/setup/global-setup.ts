import { chromium, FullConfig } from '@playwright/test';

/**
 * 全局测试设置
 * 在所有测试开始前执行
 */
async function globalSetup(config: FullConfig) {
  console.log('🚀 开始全局测试设置...');
  
  // 启动浏览器进行预热
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // 访问应用首页，确保服务正常
    console.log('📡 检查应用服务状态...');
    await page.goto(config.projects[0].use?.baseURL || 'http://localhost:25519');
    
    // 等待页面加载完成
    await page.waitForSelector('[data-testid="curl-filter-container"]', { timeout: 30000 });
    console.log('✅ 应用服务正常');
    
    // 清理测试数据
    console.log('🧹 清理测试数据...');
    await page.evaluate(() => {
      // 清理localStorage
      localStorage.clear();
      
      // 清理sessionStorage
      sessionStorage.clear();
      
      // 清理IndexedDB
      if ('indexedDB' in window) {
        indexedDB.deleteDatabase('curl-filter-db');
      }
    });
    
    console.log('✅ 测试数据清理完成');
    
  } catch (error) {
    console.error('❌ 全局设置失败:', error);
    throw error;
  } finally {
    await context.close();
    await browser.close();
  }
  
  console.log('✅ 全局测试设置完成');
}

export default globalSetup;
