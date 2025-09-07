import { test, expect } from '@playwright/test';
import { CurlFilterPage } from '../page-objects/CurlFilterPage';
import { I18N_TEST_DATA } from '../utils/test-data';
import { takeScreenshot, clearBrowserStorage } from '../utils/test-helpers';

test.describe('主界面UI交互测试', () => {
  let curlFilterPage: CurlFilterPage;

  test.beforeEach(async ({ page }) => {
    curlFilterPage = new CurlFilterPage(page);
    await clearBrowserStorage(page);
    await curlFilterPage.goto();
  });

  test.describe('页面加载和初始化', () => {
    test('应该正确加载页面并显示主要元素', async ({ page }) => {
      // 检查页面标题
      await expect(page).toHaveTitle(/cURL Filter|cURL 过滤器/);
      
      // 检查主要容器存在
      await expect(page.locator(curlFilterPage.selectors.container)).toBeVisible();
      
      // 检查标题和副标题
      await expect(page.locator(curlFilterPage.selectors.title)).toBeVisible();
      await expect(page.locator(curlFilterPage.selectors.subtitle)).toBeVisible();
      
      // 检查输入输出区域
      await expect(page.locator(curlFilterPage.selectors.inputTextarea)).toBeVisible();
      await expect(page.locator(curlFilterPage.selectors.outputTextarea)).toBeVisible();
      
      // 检查主要按钮
      await expect(page.locator(curlFilterPage.selectors.filterButton)).toBeVisible();
      await expect(page.locator(curlFilterPage.selectors.clearButton)).toBeVisible();
      
      // 检查导航元素
      await expect(page.locator(curlFilterPage.selectors.languageSwitcher)).toBeVisible();
      await expect(page.locator(curlFilterPage.selectors.githubLink)).toBeVisible();
    });

    test('应该正确设置初始状态', async ({ page }) => {
      // 输入框应该为空
      const inputValue = await curlFilterPage.getInputValue();
      expect(inputValue).toBe('');
      
      // 输出框应该为空
      const outputValue = await curlFilterPage.getOutputValue();
      expect(outputValue).toBe('');
      
      // 过滤按钮应该被禁用
      const isFilterEnabled = await curlFilterPage.isFilterButtonEnabled();
      expect(isFilterEnabled).toBe(false);
      
      // 默认语言应该是中文
      const currentLanguage = await curlFilterPage.getCurrentLanguage();
      expect(currentLanguage).toBe('zh');
    });

    test('应该在不同视口尺寸下正确显示', async ({ page }) => {
      // 测试桌面视图
      await page.setViewportSize({ width: 1920, height: 1080 });
      await expect(page.locator(curlFilterPage.selectors.container)).toBeVisible();
      
      // 测试平板视图
      await page.setViewportSize({ width: 768, height: 1024 });
      await expect(page.locator(curlFilterPage.selectors.container)).toBeVisible();
      
      // 测试移动视图
      await page.setViewportSize({ width: 375, height: 667 });
      await expect(page.locator(curlFilterPage.selectors.container)).toBeVisible();
      
      // 恢复桌面视图
      await page.setViewportSize({ width: 1920, height: 1080 });
    });
  });

  test.describe('语言切换功能', () => {
    test('应该能够切换到英文', async ({ page }) => {
      // 切换到英文
      await curlFilterPage.switchLanguage('en');
      
      // 检查标题文本
      const title = await curlFilterPage.getTitle();
      expect(title).toContain(I18N_TEST_DATA.expectedTexts.en.title);
      
      // 检查副标题文本
      const subtitle = await curlFilterPage.getSubtitle();
      expect(subtitle).toContain(I18N_TEST_DATA.expectedTexts.en.subtitle);
      
      // 检查按钮文本
      const filterButtonText = await page.locator(curlFilterPage.selectors.filterButton).textContent();
      expect(filterButtonText).toContain(I18N_TEST_DATA.expectedTexts.en.applyFilter);
      
      const clearButtonText = await page.locator(curlFilterPage.selectors.clearButton).textContent();
      expect(clearButtonText).toContain(I18N_TEST_DATA.expectedTexts.en.clear);
    });

    test('应该能够从英文切换回中文', async ({ page }) => {
      // 先切换到英文
      await curlFilterPage.switchLanguage('en');
      
      // 再切换回中文
      await curlFilterPage.switchLanguage('zh');
      
      // 检查标题文本
      const title = await curlFilterPage.getTitle();
      expect(title).toContain(I18N_TEST_DATA.expectedTexts.zh.title);
      
      // 检查副标题文本
      const subtitle = await curlFilterPage.getSubtitle();
      expect(subtitle).toContain(I18N_TEST_DATA.expectedTexts.zh.subtitle);
    });

    test('应该保持语言选择状态', async ({ page }) => {
      // 切换到英文
      await curlFilterPage.switchLanguage('en');
      
      // 刷新页面
      await page.reload();
      await curlFilterPage.waitForPageLoad();
      
      // 检查语言是否保持
      const currentLanguage = await curlFilterPage.getCurrentLanguage();
      expect(currentLanguage).toBe('en');
      
      // 检查文本是否仍为英文
      const title = await curlFilterPage.getTitle();
      expect(title).toContain(I18N_TEST_DATA.expectedTexts.en.title);
    });
  });

  test.describe('GitHub链接功能', () => {
    test('应该能够点击GitHub链接', async ({ page }) => {
      // 监听新页面打开事件
      const pagePromise = page.context().waitForEvent('page');
      
      // 点击GitHub链接
      await curlFilterPage.clickGitHubLink();
      
      // 等待新页面打开
      const newPage = await pagePromise;
      
      // 检查新页面URL
      expect(newPage.url()).toContain('github.com');
      
      // 关闭新页面
      await newPage.close();
    });

    test('应该显示GitHub链接的工具提示', async ({ page }) => {
      // 悬停在GitHub链接上
      const tooltip = await curlFilterPage.hoverAndGetTooltip(curlFilterPage.selectors.githubLink);
      
      // 检查工具提示内容
      expect(tooltip).toBeTruthy();
      expect(tooltip.length).toBeGreaterThan(0);
    });
  });

  test.describe('输入框交互', () => {
    test('应该能够在输入框中输入文本', async ({ page }) => {
      const testInput = 'curl https://api.example.com/test';
      
      // 输入文本
      await curlFilterPage.inputCurlCommand(testInput);
      
      // 检查输入值
      const inputValue = await curlFilterPage.getInputValue();
      expect(inputValue).toBe(testInput);
    });

    test('应该在输入有效cURL命令时启用过滤按钮', async ({ page }) => {
      const validCurl = 'curl https://api.example.com/test -H "accept: application/json"';
      
      // 输入有效的cURL命令
      await curlFilterPage.inputCurlCommand(validCurl);
      
      // 等待一下让验证完成
      await page.waitForTimeout(500);
      
      // 检查过滤按钮是否启用
      const isEnabled = await curlFilterPage.isFilterButtonEnabled();
      expect(isEnabled).toBe(true);
    });

    test('应该在输入无效内容时显示验证消息', async ({ page }) => {
      const invalidInput = 'not a curl command';
      
      // 输入无效内容
      await curlFilterPage.inputCurlCommand(invalidInput);
      
      // 等待验证完成
      await page.waitForTimeout(500);
      
      // 检查验证消息
      const validationMessage = await curlFilterPage.getInputValidationMessage();
      expect(validationMessage).toBeTruthy();
      
      // 检查输入是否被标记为无效
      const isValid = await curlFilterPage.isInputValid();
      expect(isValid).toBe(false);
    });

    test('应该能够清空输入内容', async ({ page }) => {
      const testInput = 'curl https://api.example.com/test';
      
      // 输入文本
      await curlFilterPage.inputCurlCommand(testInput);
      
      // 清空输入
      await curlFilterPage.clearInput();
      
      // 检查输入是否被清空
      const inputValue = await curlFilterPage.getInputValue();
      expect(inputValue).toBe('');
    });
  });

  test.describe('键盘快捷键', () => {
    test('应该支持Ctrl+K清空输入', async ({ page }) => {
      const testInput = 'curl https://api.example.com/test';
      
      // 输入文本
      await curlFilterPage.inputCurlCommand(testInput);
      
      // 使用快捷键清空
      await curlFilterPage.pressClearShortcut();
      
      // 检查输入是否被清空
      const inputValue = await curlFilterPage.getInputValue();
      expect(inputValue).toBe('');
    });

    test('应该支持Ctrl+M打开规则管理', async ({ page }) => {
      // 使用快捷键打开规则管理
      await curlFilterPage.pressRuleManagerShortcut();
      
      // 检查规则管理对话框是否打开
      await expect(page.locator(curlFilterPage.selectors.ruleManagerDialog)).toBeVisible();
      
      // 关闭对话框
      await curlFilterPage.closeCurrentDialog();
    });

    test('应该支持Ctrl+Enter应用过滤（当输入有效时）', async ({ page }) => {
      const validCurl = 'curl https://api.example.com/test -H "accept: application/json"';
      
      // 输入有效的cURL命令
      await curlFilterPage.inputCurlCommand(validCurl);
      
      // 等待验证完成
      await page.waitForTimeout(500);
      
      // 使用快捷键应用过滤
      await curlFilterPage.pressFilterShortcut();
      
      // 等待处理完成
      await curlFilterPage.waitForLoading();
      
      // 检查是否有输出
      const outputValue = await curlFilterPage.getOutputValue();
      expect(outputValue).toBeTruthy();
    });
  });

  test.describe('工具提示显示', () => {
    test('应该在按钮上显示工具提示', async ({ page }) => {
      // 测试过滤按钮工具提示
      const filterTooltip = await curlFilterPage.hoverAndGetTooltip(curlFilterPage.selectors.filterButton);
      expect(filterTooltip).toBeTruthy();
      
      // 测试清空按钮工具提示
      const clearTooltip = await curlFilterPage.hoverAndGetTooltip(curlFilterPage.selectors.clearButton);
      expect(clearTooltip).toBeTruthy();
      
      // 测试规则管理按钮工具提示
      const ruleTooltip = await curlFilterPage.hoverAndGetTooltip(curlFilterPage.selectors.ruleManagementButton);
      expect(ruleTooltip).toBeTruthy();
    });
  });

  test.describe('响应式布局', () => {
    test('应该在移动设备上正确显示', async ({ page }) => {
      // 设置移动设备视口
      await page.setViewportSize({ width: 375, height: 667 });
      
      // 检查主要元素是否可见
      await expect(page.locator(curlFilterPage.selectors.container)).toBeVisible();
      await expect(page.locator(curlFilterPage.selectors.inputTextarea)).toBeVisible();
      await expect(page.locator(curlFilterPage.selectors.filterButton)).toBeVisible();
      
      // 检查是否为移动视图
      const isMobile = await curlFilterPage.isMobileView();
      expect(isMobile).toBe(true);
    });

    test('应该在平板设备上正确显示', async ({ page }) => {
      // 设置平板设备视口
      await page.setViewportSize({ width: 768, height: 1024 });
      
      // 检查主要元素是否可见
      await expect(page.locator(curlFilterPage.selectors.container)).toBeVisible();
      await expect(page.locator(curlFilterPage.selectors.inputTextarea)).toBeVisible();
      await expect(page.locator(curlFilterPage.selectors.filterButton)).toBeVisible();
      
      // 检查是否为平板视图
      const isTablet = await curlFilterPage.isTabletView();
      expect(isTablet).toBe(true);
    });
  });

  test.describe('错误处理', () => {
    test('应该处理网络错误', async ({ page }) => {
      // 模拟网络离线
      await page.context().setOffline(true);
      
      const validCurl = 'curl https://api.example.com/test';
      await curlFilterPage.inputCurlCommand(validCurl);
      
      // 尝试应用过滤
      await curlFilterPage.applyFilter();
      
      // 检查是否显示错误消息
      const errorMessage = await curlFilterPage.getErrorMessage();
      expect(errorMessage).toBeTruthy();
      
      // 恢复网络连接
      await page.context().setOffline(false);
    });
  });

  test.afterEach(async ({ page }) => {
    // 截图保存（如果测试失败）
    if (test.info().status !== 'passed') {
      await takeScreenshot(page, `main-ui-${test.info().title}`);
    }
  });
});
