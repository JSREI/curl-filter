import { Page, Locator, expect } from '@playwright/test';
import { waitForElement, safeClick, safeType, waitForDialog, closeDialog } from '../utils/test-helpers';

/**
 * cURL Filter主页面对象模型
 * 封装页面元素和操作方法
 */
export class CurlFilterPage {
  readonly page: Page;
  
  // 主要元素选择器
  readonly selectors = {
    // 容器
    container: '[data-testid="curl-filter-container"]',
    
    // 标题和导航
    title: 'h1',
    subtitle: '.subtitle',
    githubLink: '[data-testid="github-link"]',
    languageSwitcher: '[data-testid="language-switcher"]',
    
    // 输入输出区域
    inputTextarea: '[data-testid="curl-input"]',
    outputTextarea: '[data-testid="curl-output"]',
    
    // 按钮
    filterButton: '[data-testid="filter-button"]',
    clearButton: '[data-testid="clear-button"]',
    copyButton: '[data-testid="copy-button"]',
    ruleManagementButton: '[data-testid="rule-management-button"]',
    previewButton: '[data-testid="preview-button"]',
    historyButton: '[data-testid="history-button"]',
    
    // 消息提示
    successMessage: '[data-testid="success-message"]',
    errorMessage: '[data-testid="error-message"]',
    warningMessage: '[data-testid="warning-message"]',
    
    // 对话框
    ruleManagerDialog: '[data-testid="rule-manager-dialog"]',
    previewDialog: '[data-testid="preview-dialog"]',
    historyDialog: '[data-testid="history-dialog"]',
    
    // 加载状态
    loadingSpinner: '[data-testid="loading-spinner"]',
    
    // 验证提示
    inputValidation: '[data-testid="input-validation"]'
  };

  constructor(page: Page) {
    this.page = page;
  }

  // 页面导航
  async goto(): Promise<void> {
    await this.page.goto('/');
    await this.waitForPageLoad();
  }

  async waitForPageLoad(): Promise<void> {
    await waitForElement(this.page, this.selectors.container);
    await this.page.waitForLoadState('networkidle');
  }

  // 输入操作
  async inputCurlCommand(command: string): Promise<void> {
    await safeType(this.page, this.selectors.inputTextarea, command);
  }

  async clearInput(): Promise<void> {
    await safeClick(this.page, this.selectors.clearButton);
  }

  async getInputValue(): Promise<string> {
    const input = await waitForElement(this.page, this.selectors.inputTextarea);
    return await input.inputValue();
  }

  // 输出操作
  async getOutputValue(): Promise<string> {
    const output = await waitForElement(this.page, this.selectors.outputTextarea);
    return await output.inputValue();
  }

  async copyOutput(): Promise<void> {
    await safeClick(this.page, this.selectors.copyButton);
  }

  // 过滤操作
  async applyFilter(): Promise<void> {
    await safeClick(this.page, this.selectors.filterButton);
  }

  async isFilterButtonEnabled(): Promise<boolean> {
    const button = await waitForElement(this.page, this.selectors.filterButton);
    return await button.isEnabled();
  }

  // 消息检查
  async getSuccessMessage(): Promise<string> {
    const element = this.page.locator(this.selectors.successMessage);
    if (await element.isVisible()) {
      return await element.textContent() || '';
    }
    return '';
  }

  async getErrorMessage(): Promise<string> {
    const element = this.page.locator(this.selectors.errorMessage);
    if (await element.isVisible()) {
      return await element.textContent() || '';
    }
    return '';
  }

  async waitForSuccessMessage(timeout = 5000): Promise<string> {
    const element = this.page.locator(this.selectors.successMessage);
    await expect(element).toBeVisible({ timeout });
    return await element.textContent() || '';
  }

  async waitForErrorMessage(timeout = 5000): Promise<string> {
    const element = this.page.locator(this.selectors.errorMessage);
    await expect(element).toBeVisible({ timeout });
    return await element.textContent() || '';
  }

  // 对话框操作
  async openRuleManager(): Promise<void> {
    await safeClick(this.page, this.selectors.ruleManagementButton);
    await waitForDialog(this.page);
  }

  async openPreview(): Promise<void> {
    await safeClick(this.page, this.selectors.previewButton);
    await waitForDialog(this.page);
  }

  async openHistory(): Promise<void> {
    await safeClick(this.page, this.selectors.historyButton);
    await waitForDialog(this.page);
  }

  async closeCurrentDialog(): Promise<void> {
    await closeDialog(this.page);
  }

  // 语言切换
  async switchLanguage(language: 'zh' | 'en'): Promise<void> {
    const switcher = await waitForElement(this.page, this.selectors.languageSwitcher);
    await switcher.click();
    
    const option = this.page.locator(`[data-value="${language}"]`);
    await option.click();
    
    // 等待语言切换完成
    await this.page.waitForTimeout(500);
  }

  async getCurrentLanguage(): Promise<string> {
    const switcher = await waitForElement(this.page, this.selectors.languageSwitcher);
    return await switcher.getAttribute('data-current-language') || 'zh';
  }

  // 页面文本检查
  async getTitle(): Promise<string> {
    const title = await waitForElement(this.page, this.selectors.title);
    return await title.textContent() || '';
  }

  async getSubtitle(): Promise<string> {
    const subtitle = await waitForElement(this.page, this.selectors.subtitle);
    return await subtitle.textContent() || '';
  }

  // 键盘快捷键
  async pressFilterShortcut(): Promise<void> {
    await this.page.keyboard.press('Control+Enter');
  }

  async pressClearShortcut(): Promise<void> {
    await this.page.keyboard.press('Control+KeyK');
  }

  async pressRuleManagerShortcut(): Promise<void> {
    await this.page.keyboard.press('Control+KeyM');
  }

  // 验证状态
  async getInputValidationMessage(): Promise<string> {
    const validation = this.page.locator(this.selectors.inputValidation);
    if (await validation.isVisible()) {
      return await validation.textContent() || '';
    }
    return '';
  }

  async isInputValid(): Promise<boolean> {
    const validation = this.page.locator(this.selectors.inputValidation);
    if (await validation.isVisible()) {
      const className = await validation.getAttribute('class') || '';
      return !className.includes('error');
    }
    return true;
  }

  // 等待加载完成
  async waitForLoading(): Promise<void> {
    const spinner = this.page.locator(this.selectors.loadingSpinner);
    if (await spinner.isVisible()) {
      await expect(spinner).toBeHidden({ timeout: 10000 });
    }
  }

  // GitHub链接
  async clickGitHubLink(): Promise<void> {
    await safeClick(this.page, this.selectors.githubLink);
  }

  // 响应式检查
  async isMobileView(): Promise<boolean> {
    const viewport = this.page.viewportSize();
    return viewport ? viewport.width < 768 : false;
  }

  async isTabletView(): Promise<boolean> {
    const viewport = this.page.viewportSize();
    return viewport ? viewport.width >= 768 && viewport.width < 1024 : false;
  }

  async isDesktopView(): Promise<boolean> {
    const viewport = this.page.viewportSize();
    return viewport ? viewport.width >= 1024 : false;
  }

  // 工具提示检查
  async hoverAndGetTooltip(selector: string): Promise<string> {
    const element = await waitForElement(this.page, selector);
    await element.hover();
    
    const tooltip = this.page.locator('[role="tooltip"]');
    if (await tooltip.isVisible()) {
      return await tooltip.textContent() || '';
    }
    return '';
  }

  // 完整工作流程
  async performCompleteFilterFlow(inputCurl: string): Promise<{
    success: boolean;
    output: string;
    message: string;
  }> {
    // 输入cURL命令
    await this.inputCurlCommand(inputCurl);
    
    // 应用过滤
    await this.applyFilter();
    
    // 等待处理完成
    await this.waitForLoading();
    
    // 检查结果
    const output = await this.getOutputValue();
    const successMessage = await this.getSuccessMessage();
    const errorMessage = await this.getErrorMessage();
    
    return {
      success: !!successMessage && !errorMessage,
      output,
      message: successMessage || errorMessage
    };
  }
}
