import { test, expect } from '@playwright/test';
import { CurlFilterPage } from '../page-objects/CurlFilterPage';
import { HistoryManagerPage } from '../page-objects/HistoryManagerPage';
import { STANDARD_CURL_COMMANDS, I18N_TEST_DATA } from '../utils/test-data';
import { takeScreenshot, clearBrowserStorage, setBrowserStorage, getBrowserStorage } from '../utils/test-helpers';

test.describe('综合功能测试', () => {
  let curlFilterPage: CurlFilterPage;
  let historyManagerPage: HistoryManagerPage;

  test.beforeEach(async ({ page }) => {
    curlFilterPage = new CurlFilterPage(page);
    historyManagerPage = new HistoryManagerPage(page);
    await clearBrowserStorage(page);
    await curlFilterPage.goto();
  });

  test.describe('历史记录管理', () => {
    test('应该自动保存过滤历史', async ({ page }) => {
      // 执行过滤操作
      const result = await curlFilterPage.performCompleteFilterFlow(STANDARD_CURL_COMMANDS.simpleGet);
      expect(result.success).toBe(true);
      
      // 打开历史记录
      await curlFilterPage.openHistory();
      await historyManagerPage.waitForLoad();
      
      // 检查历史记录是否存在
      const historyCount = await historyManagerPage.getHistoryCount();
      expect(historyCount).toBeGreaterThan(0);
      
      // 检查第一条记录
      const firstEntry = await historyManagerPage.getHistoryItemByIndex(0);
      expect(firstEntry.title).toBeTruthy();
      expect(firstEntry.timestamp).toBeTruthy();
    });

    test('应该能够查看历史记录详情', async ({ page }) => {
      // 先创建一条历史记录
      await curlFilterPage.performCompleteFilterFlow(STANDARD_CURL_COMMANDS.postWithJson);
      
      // 打开历史记录
      await curlFilterPage.openHistory();
      await historyManagerPage.waitForLoad();
      
      // 查看第一条记录详情
      await historyManagerPage.viewHistory(0);
      
      // 检查详情内容
      const inputCurl = await historyManagerPage.getDetailInputCurl();
      const outputCurl = await historyManagerPage.getDetailOutputCurl();
      
      expect(inputCurl).toContain('https://api.example.com/users');
      expect(outputCurl).toContain('curl');
    });

    test('应该能够编辑历史记录', async ({ page }) => {
      // 先创建一条历史记录
      await curlFilterPage.performCompleteFilterFlow(STANDARD_CURL_COMMANDS.simpleGet);
      
      // 打开历史记录
      await curlFilterPage.openHistory();
      await historyManagerPage.waitForLoad();
      
      // 编辑第一条记录
      await historyManagerPage.editHistory(0);
      
      // 修改标题和标签
      await historyManagerPage.editHistoryDetails('自定义标题', ['api', 'test']);
      
      // 检查修改是否生效
      const updatedEntry = await historyManagerPage.getHistoryItemByIndex(0);
      expect(updatedEntry.title).toBe('自定义标题');
      expect(updatedEntry.tags).toContain('api');
      expect(updatedEntry.tags).toContain('test');
    });

    test('应该能够搜索历史记录', async ({ page }) => {
      // 创建多条不同的历史记录
      await curlFilterPage.performCompleteFilterFlow(STANDARD_CURL_COMMANDS.simpleGet);
      await curlFilterPage.performCompleteFilterFlow(STANDARD_CURL_COMMANDS.postWithJson);
      
      // 打开历史记录
      await curlFilterPage.openHistory();
      await historyManagerPage.waitForLoad();
      
      // 搜索包含'POST'的记录
      await historyManagerPage.searchHistory('POST');
      
      // 检查搜索结果
      const historyCount = await historyManagerPage.getHistoryCount();
      expect(historyCount).toBe(1);
    });

    test('应该能够收藏历史记录', async ({ page }) => {
      // 创建历史记录
      await curlFilterPage.performCompleteFilterFlow(STANDARD_CURL_COMMANDS.simpleGet);
      
      // 打开历史记录
      await curlFilterPage.openHistory();
      await historyManagerPage.waitForLoad();
      
      // 收藏第一条记录
      await historyManagerPage.toggleFavorite(0);
      
      // 检查收藏状态
      const entry = await historyManagerPage.getHistoryItemByIndex(0);
      expect(entry.favorite).toBe(true);
      
      // 过滤只显示收藏的记录
      await historyManagerPage.filterFavoriteOnly(true);
      
      const favoriteCount = await historyManagerPage.getHistoryCount();
      expect(favoriteCount).toBe(1);
    });

    test('应该能够删除历史记录', async ({ page }) => {
      // 创建历史记录
      await curlFilterPage.performCompleteFilterFlow(STANDARD_CURL_COMMANDS.simpleGet);
      
      // 打开历史记录
      await curlFilterPage.openHistory();
      await historyManagerPage.waitForLoad();
      
      const initialCount = await historyManagerPage.getHistoryCount();
      
      // 删除第一条记录
      await historyManagerPage.deleteHistory(0);
      
      // 检查记录是否被删除
      const newCount = await historyManagerPage.getHistoryCount();
      expect(newCount).toBe(initialCount - 1);
    });
  });

  test.describe('数据存储和持久化', () => {
    test('应该持久化规则配置', async ({ page }) => {
      // 创建一个规则
      await curlFilterPage.openRuleManager();
      const ruleManagerPage = new (await import('../page-objects/RuleManagerPage')).RuleManagerPage(page);
      await ruleManagerPage.waitForLoad();
      await ruleManagerPage.addNewRule();
      
      const testRule = {
        name: '持久化测试规则',
        action: 'delete',
        target: 'headers',
        matchMode: 'exact',
        matchValue: 'test-header',
        priority: 50,
        enabled: true
      };
      
      await ruleManagerPage.fillRuleForm(testRule);
      await ruleManagerPage.saveRule();
      await curlFilterPage.closeCurrentDialog();
      
      // 刷新页面
      await page.reload();
      await curlFilterPage.waitForPageLoad();
      
      // 检查规则是否仍然存在
      await curlFilterPage.openRuleManager();
      await ruleManagerPage.waitForLoad();
      
      const ruleIndex = await ruleManagerPage.findRuleByName(testRule.name);
      expect(ruleIndex).toBeGreaterThanOrEqual(0);
    });

    test('应该持久化语言设置', async ({ page }) => {
      // 切换到英文
      await curlFilterPage.switchLanguage('en');
      
      // 刷新页面
      await page.reload();
      await curlFilterPage.waitForPageLoad();
      
      // 检查语言是否保持
      const currentLanguage = await curlFilterPage.getCurrentLanguage();
      expect(currentLanguage).toBe('en');
      
      const title = await curlFilterPage.getTitle();
      expect(title).toContain(I18N_TEST_DATA.expectedTexts.en.title);
    });

    test('应该处理存储容量限制', async ({ page }) => {
      // 创建大量历史记录来测试存储限制
      for (let i = 0; i < 10; i++) {
        await curlFilterPage.performCompleteFilterFlow(`curl 'https://api.example.com/test${i}'`);
      }
      
      // 打开历史记录检查
      await curlFilterPage.openHistory();
      await historyManagerPage.waitForLoad();
      
      const historyCount = await historyManagerPage.getHistoryCount();
      expect(historyCount).toBe(10);
    });

    test('应该处理存储错误', async ({ page }) => {
      // 模拟存储错误（通过禁用IndexedDB）
      await page.evaluate(() => {
        // 临时禁用IndexedDB
        Object.defineProperty(window, 'indexedDB', {
          value: undefined,
          writable: false
        });
      });
      
      // 尝试执行过滤操作
      const result = await curlFilterPage.performCompleteFilterFlow(STANDARD_CURL_COMMANDS.simpleGet);
      
      // 应该仍然能够工作，只是不保存历史记录
      expect(result.success).toBe(true);
    });
  });

  test.describe('多语言和国际化', () => {
    test('应该正确显示中文界面', async ({ page }) => {
      // 确保是中文
      await curlFilterPage.switchLanguage('zh');
      
      // 检查各种文本
      const title = await curlFilterPage.getTitle();
      expect(title).toContain(I18N_TEST_DATA.expectedTexts.zh.title);
      
      const subtitle = await curlFilterPage.getSubtitle();
      expect(subtitle).toContain(I18N_TEST_DATA.expectedTexts.zh.subtitle);
      
      // 检查按钮文本
      const filterButtonText = await page.locator(curlFilterPage.selectors.filterButton).textContent();
      expect(filterButtonText).toContain(I18N_TEST_DATA.expectedTexts.zh.applyFilter);
    });

    test('应该正确显示英文界面', async ({ page }) => {
      // 切换到英文
      await curlFilterPage.switchLanguage('en');
      
      // 检查各种文本
      const title = await curlFilterPage.getTitle();
      expect(title).toContain(I18N_TEST_DATA.expectedTexts.en.title);
      
      const subtitle = await curlFilterPage.getSubtitle();
      expect(subtitle).toContain(I18N_TEST_DATA.expectedTexts.en.subtitle);
      
      // 检查按钮文本
      const filterButtonText = await page.locator(curlFilterPage.selectors.filterButton).textContent();
      expect(filterButtonText).toContain(I18N_TEST_DATA.expectedTexts.en.applyFilter);
    });

    test('应该在不同语言间正确切换', async ({ page }) => {
      // 中文 -> 英文 -> 中文
      await curlFilterPage.switchLanguage('zh');
      let title = await curlFilterPage.getTitle();
      expect(title).toContain('过滤器');
      
      await curlFilterPage.switchLanguage('en');
      title = await curlFilterPage.getTitle();
      expect(title).toContain('Filter');
      
      await curlFilterPage.switchLanguage('zh');
      title = await curlFilterPage.getTitle();
      expect(title).toContain('过滤器');
    });
  });

  test.describe('错误处理和边界条件', () => {
    test('应该处理网络连接错误', async ({ page }) => {
      // 模拟网络离线
      await page.context().setOffline(true);
      
      // 尝试执行操作
      await curlFilterPage.inputCurlCommand(STANDARD_CURL_COMMANDS.simpleGet);
      await curlFilterPage.applyFilter();
      
      // 应该显示适当的错误消息
      const errorMessage = await curlFilterPage.getErrorMessage();
      expect(errorMessage).toBeTruthy();
      
      // 恢复网络
      await page.context().setOffline(false);
    });

    test('应该处理无效的规则配置', async ({ page }) => {
      // 通过直接设置存储来模拟无效配置
      await setBrowserStorage(page, 'curl-filter-rules', [
        {
          id: 'invalid-rule',
          name: '',  // 无效的空名称
          action: 'invalid-action',  // 无效的动作
          target: 'headers',
          matchMode: 'exact',
          matchValue: 'test',
          priority: 50,
          enabled: true
        }
      ]);
      
      // 刷新页面
      await page.reload();
      await curlFilterPage.waitForPageLoad();
      
      // 应该能够正常加载（忽略无效规则）
      const title = await curlFilterPage.getTitle();
      expect(title).toBeTruthy();
    });

    test('应该处理大文本输入', async ({ page }) => {
      // 创建超大的cURL命令
      let largeCurl = 'curl https://api.example.com/test';
      for (let i = 0; i < 100; i++) {
        largeCurl += ` -H "header-${i}: ${'value'.repeat(100)}"`;
      }
      
      // 输入大文本
      await curlFilterPage.inputCurlCommand(largeCurl);
      
      // 应该能够处理
      const result = await curlFilterPage.performCompleteFilterFlow(largeCurl);
      expect(result.success).toBe(true);
    });
  });

  test.describe('性能和压力测试', () => {
    test('应该在合理时间内处理复杂操作', async ({ page }) => {
      const startTime = Date.now();
      
      // 执行复杂的过滤操作
      const result = await curlFilterPage.performCompleteFilterFlow(STANDARD_CURL_COMMANDS.chromeComplex);
      
      const endTime = Date.now();
      const processingTime = endTime - startTime;
      
      expect(result.success).toBe(true);
      expect(processingTime).toBeLessThan(5000); // 5秒内完成
    });

    test('应该处理并发操作', async ({ page }) => {
      // 快速连续执行多个操作
      const operations = [];
      for (let i = 0; i < 5; i++) {
        operations.push(
          curlFilterPage.performCompleteFilterFlow(`curl 'https://api.example.com/test${i}'`)
        );
      }
      
      // 等待所有操作完成
      const results = await Promise.all(operations);
      
      // 检查所有操作都成功
      results.forEach(result => {
        expect(result.success).toBe(true);
      });
    });
  });

  test.describe('端到端工作流程', () => {
    test('完整的用户工作流程', async ({ page }) => {
      // 1. 创建自定义规则
      await curlFilterPage.openRuleManager();
      const ruleManagerPage = new (await import('../page-objects/RuleManagerPage')).RuleManagerPage(page);
      await ruleManagerPage.waitForLoad();
      await ruleManagerPage.addNewRule();
      
      const customRule = {
        name: '端到端测试规则',
        action: 'delete',
        target: 'headers',
        matchMode: 'contains',
        matchValue: 'test',
        priority: 50,
        enabled: true
      };
      
      await ruleManagerPage.fillRuleForm(customRule);
      await ruleManagerPage.saveRule();
      await curlFilterPage.closeCurrentDialog();
      
      // 2. 执行过滤操作
      const testCurl = `curl 'https://api.example.com/users' -H 'test-header: value' -H 'authorization: bearer token'`;
      const result = await curlFilterPage.performCompleteFilterFlow(testCurl);
      
      expect(result.success).toBe(true);
      expect(result.output).not.toContain('test-header');
      expect(result.output).toContain('authorization');
      
      // 3. 检查历史记录
      await curlFilterPage.openHistory();
      await historyManagerPage.waitForLoad();
      
      const historyCount = await historyManagerPage.getHistoryCount();
      expect(historyCount).toBeGreaterThan(0);
      
      // 4. 编辑历史记录
      await historyManagerPage.editHistory(0);
      await historyManagerPage.editHistoryDetails('端到端测试记录', ['e2e', 'test']);
      
      // 5. 验证最终状态
      const updatedEntry = await historyManagerPage.getHistoryItemByIndex(0);
      expect(updatedEntry.title).toBe('端到端测试记录');
      expect(updatedEntry.tags).toContain('e2e');
    });
  });

  test.afterEach(async ({ page }) => {
    try {
      await curlFilterPage.closeCurrentDialog();
    } catch (e) {
      // 忽略关闭错误
    }
    
    if (test.info().status !== 'passed') {
      await takeScreenshot(page, `comprehensive-${test.info().title}`);
    }
  });
});
