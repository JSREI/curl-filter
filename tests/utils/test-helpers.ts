import { Page, Locator, expect } from '@playwright/test';

/**
 * 测试辅助工具函数
 */

/**
 * 等待元素可见并返回
 */
export async function waitForElement(page: Page, selector: string, timeout = 10000): Promise<Locator> {
  const element = page.locator(selector);
  await expect(element).toBeVisible({ timeout });
  return element;
}

/**
 * 等待元素消失
 */
export async function waitForElementToDisappear(page: Page, selector: string, timeout = 10000): Promise<void> {
  const element = page.locator(selector);
  await expect(element).toBeHidden({ timeout });
}

/**
 * 安全点击元素（等待可见后点击）
 */
export async function safeClick(page: Page, selector: string, timeout = 10000): Promise<void> {
  const element = await waitForElement(page, selector, timeout);
  await element.click();
}

/**
 * 安全输入文本（清空后输入）
 */
export async function safeType(page: Page, selector: string, text: string, timeout = 10000): Promise<void> {
  const element = await waitForElement(page, selector, timeout);
  await element.clear();
  await element.fill(text);
}

/**
 * 等待并获取元素文本
 */
export async function getElementText(page: Page, selector: string, timeout = 10000): Promise<string> {
  const element = await waitForElement(page, selector, timeout);
  return await element.textContent() || '';
}

/**
 * 检查元素是否包含指定文本
 */
export async function expectElementToContainText(page: Page, selector: string, text: string, timeout = 10000): Promise<void> {
  const element = page.locator(selector);
  await expect(element).toContainText(text, { timeout });
}

/**
 * 等待网络请求完成
 */
export async function waitForNetworkIdle(page: Page, timeout = 5000): Promise<void> {
  await page.waitForLoadState('networkidle', { timeout });
}

/**
 * 截图并保存
 */
export async function takeScreenshot(page: Page, name: string): Promise<void> {
  await page.screenshot({ 
    path: `test-results/screenshots/${name}-${Date.now()}.png`,
    fullPage: true 
  });
}

/**
 * 模拟键盘快捷键
 */
export async function pressShortcut(page: Page, shortcut: string): Promise<void> {
  await page.keyboard.press(shortcut);
}

/**
 * 等待对话框出现
 */
export async function waitForDialog(page: Page, timeout = 10000): Promise<void> {
  await page.waitForSelector('[role="dialog"]', { timeout });
}

/**
 * 关闭对话框
 */
export async function closeDialog(page: Page): Promise<void> {
  // 尝试点击关闭按钮
  const closeButton = page.locator('[role="dialog"] button[aria-label*="close"], [role="dialog"] button[aria-label*="关闭"]');
  if (await closeButton.isVisible()) {
    await closeButton.click();
    return;
  }
  
  // 尝试按ESC键
  await page.keyboard.press('Escape');
}

/**
 * 检查控制台错误
 */
export async function checkConsoleErrors(page: Page): Promise<string[]> {
  const errors: string[] = [];
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  
  return errors;
}

/**
 * 清理浏览器存储
 */
export async function clearBrowserStorage(page: Page): Promise<void> {
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
    
    // 清理IndexedDB
    if ('indexedDB' in window) {
      indexedDB.deleteDatabase('curl-filter-db');
    }
  });
}

/**
 * 设置浏览器存储数据
 */
export async function setBrowserStorage(page: Page, key: string, value: any): Promise<void> {
  await page.evaluate(({ key, value }) => {
    localStorage.setItem(key, JSON.stringify(value));
  }, { key, value });
}

/**
 * 获取浏览器存储数据
 */
export async function getBrowserStorage(page: Page, key: string): Promise<any> {
  return await page.evaluate((key) => {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  }, key);
}

/**
 * 等待元素属性值
 */
export async function waitForElementAttribute(
  page: Page, 
  selector: string, 
  attribute: string, 
  value: string, 
  timeout = 10000
): Promise<void> {
  const element = page.locator(selector);
  await expect(element).toHaveAttribute(attribute, value, { timeout });
}

/**
 * 滚动到元素位置
 */
export async function scrollToElement(page: Page, selector: string): Promise<void> {
  const element = page.locator(selector);
  await element.scrollIntoViewIfNeeded();
}

/**
 * 拖拽元素
 */
export async function dragAndDrop(page: Page, sourceSelector: string, targetSelector: string): Promise<void> {
  const source = page.locator(sourceSelector);
  const target = page.locator(targetSelector);
  await source.dragTo(target);
}

/**
 * 模拟文件上传
 */
export async function uploadFile(page: Page, inputSelector: string, filePath: string): Promise<void> {
  const fileInput = page.locator(inputSelector);
  await fileInput.setInputFiles(filePath);
}

/**
 * 等待下载完成
 */
export async function waitForDownload(page: Page, triggerAction: () => Promise<void>): Promise<string> {
  const downloadPromise = page.waitForEvent('download');
  await triggerAction();
  const download = await downloadPromise;
  const path = await download.path();
  return path || '';
}
