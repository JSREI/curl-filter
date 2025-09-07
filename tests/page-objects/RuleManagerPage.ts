import { Page, Locator, expect } from '@playwright/test';
import { waitForElement, safeClick, safeType, waitForDialog } from '../utils/test-helpers';

/**
 * 规则管理页面对象模型
 */
export class RuleManagerPage {
  readonly page: Page;
  
  readonly selectors = {
    // 主容器
    container: '[data-testid="rule-manager-container"]',
    
    // 标签页
    rulesTab: '[data-testid="rules-tab"]',
    templatesTab: '[data-testid="templates-tab"]',
    
    // 规则列表
    rulesList: '[data-testid="rules-list"]',
    ruleItem: '[data-testid="rule-item"]',
    ruleItemName: '[data-testid="rule-item-name"]',
    ruleItemDescription: '[data-testid="rule-item-description"]',
    ruleItemEnabled: '[data-testid="rule-item-enabled"]',
    ruleItemPriority: '[data-testid="rule-item-priority"]',
    
    // 规则操作按钮
    addRuleButton: '[data-testid="add-rule-button"]',
    editRuleButton: '[data-testid="edit-rule-button"]',
    deleteRuleButton: '[data-testid="delete-rule-button"]',
    enableRuleButton: '[data-testid="enable-rule-button"]',
    disableRuleButton: '[data-testid="disable-rule-button"]',
    
    // 规则编辑器
    ruleEditor: '[data-testid="rule-editor"]',
    ruleNameInput: '[data-testid="rule-name-input"]',
    ruleDescriptionInput: '[data-testid="rule-description-input"]',
    ruleActionSelect: '[data-testid="rule-action-select"]',
    ruleTargetSelect: '[data-testid="rule-target-select"]',
    ruleMatchModeSelect: '[data-testid="rule-match-mode-select"]',
    ruleMatchValueInput: '[data-testid="rule-match-value-input"]',
    rulePriorityInput: '[data-testid="rule-priority-input"]',
    ruleEnabledCheckbox: '[data-testid="rule-enabled-checkbox"]',
    
    // 编辑器按钮
    saveRuleButton: '[data-testid="save-rule-button"]',
    cancelRuleButton: '[data-testid="cancel-rule-button"]',
    
    // 模板相关
    templatesList: '[data-testid="templates-list"]',
    templateItem: '[data-testid="template-item"]',
    applyTemplateButton: '[data-testid="apply-template-button"]',
    
    // 批量操作
    selectAllCheckbox: '[data-testid="select-all-checkbox"]',
    batchDeleteButton: '[data-testid="batch-delete-button"]',
    batchEnableButton: '[data-testid="batch-enable-button"]',
    batchDisableButton: '[data-testid="batch-disable-button"]',
    
    // 导入导出
    importButton: '[data-testid="import-button"]',
    exportButton: '[data-testid="export-button"]',
    importFileInput: '[data-testid="import-file-input"]',
    
    // 搜索和过滤
    searchInput: '[data-testid="search-input"]',
    filterEnabledOnly: '[data-testid="filter-enabled-only"]',
    sortBySelect: '[data-testid="sort-by-select"]',
    
    // 消息提示
    successMessage: '[data-testid="success-message"]',
    errorMessage: '[data-testid="error-message"]',
    
    // 确认对话框
    confirmDialog: '[data-testid="confirm-dialog"]',
    confirmButton: '[data-testid="confirm-button"]',
    cancelButton: '[data-testid="cancel-button"]'
  };

  constructor(page: Page) {
    this.page = page;
  }

  // 基础操作
  async waitForLoad(): Promise<void> {
    await waitForElement(this.page, this.selectors.container);
  }

  // 标签页操作
  async switchToRulesTab(): Promise<void> {
    await safeClick(this.page, this.selectors.rulesTab);
  }

  async switchToTemplatesTab(): Promise<void> {
    await safeClick(this.page, this.selectors.templatesTab);
  }

  // 规则列表操作
  async getRulesCount(): Promise<number> {
    const rules = this.page.locator(this.selectors.ruleItem);
    return await rules.count();
  }

  async getRuleByIndex(index: number): Promise<{
    name: string;
    description: string;
    enabled: boolean;
    priority: number;
  }> {
    const ruleItem = this.page.locator(this.selectors.ruleItem).nth(index);
    
    const name = await ruleItem.locator(this.selectors.ruleItemName).textContent() || '';
    const description = await ruleItem.locator(this.selectors.ruleItemDescription).textContent() || '';
    const enabledElement = ruleItem.locator(this.selectors.ruleItemEnabled);
    const enabled = await enabledElement.isChecked();
    const priorityText = await ruleItem.locator(this.selectors.ruleItemPriority).textContent() || '0';
    const priority = parseInt(priorityText);
    
    return { name, description, enabled, priority };
  }

  async findRuleByName(name: string): Promise<number> {
    const rules = this.page.locator(this.selectors.ruleItem);
    const count = await rules.count();
    
    for (let i = 0; i < count; i++) {
      const ruleItem = rules.nth(i);
      const ruleName = await ruleItem.locator(this.selectors.ruleItemName).textContent();
      if (ruleName === name) {
        return i;
      }
    }
    
    return -1;
  }

  // 规则CRUD操作
  async addNewRule(): Promise<void> {
    await safeClick(this.page, this.selectors.addRuleButton);
    await waitForElement(this.page, this.selectors.ruleEditor);
  }

  async editRule(index: number): Promise<void> {
    const ruleItem = this.page.locator(this.selectors.ruleItem).nth(index);
    await ruleItem.locator(this.selectors.editRuleButton).click();
    await waitForElement(this.page, this.selectors.ruleEditor);
  }

  async deleteRule(index: number): Promise<void> {
    const ruleItem = this.page.locator(this.selectors.ruleItem).nth(index);
    await ruleItem.locator(this.selectors.deleteRuleButton).click();
    
    // 等待确认对话框
    await waitForElement(this.page, this.selectors.confirmDialog);
    await safeClick(this.page, this.selectors.confirmButton);
  }

  async toggleRuleEnabled(index: number): Promise<void> {
    const ruleItem = this.page.locator(this.selectors.ruleItem).nth(index);
    const enabledCheckbox = ruleItem.locator(this.selectors.ruleItemEnabled);
    await enabledCheckbox.click();
  }

  // 规则编辑器操作
  async fillRuleForm(rule: {
    name: string;
    description?: string;
    action: string;
    target: string;
    matchMode: string;
    matchValue: string;
    priority: number;
    enabled: boolean;
  }): Promise<void> {
    await safeType(this.page, this.selectors.ruleNameInput, rule.name);
    
    if (rule.description) {
      await safeType(this.page, this.selectors.ruleDescriptionInput, rule.description);
    }
    
    // 选择动作
    await safeClick(this.page, this.selectors.ruleActionSelect);
    await safeClick(this.page, `[data-value="${rule.action}"]`);
    
    // 选择目标
    await safeClick(this.page, this.selectors.ruleTargetSelect);
    await safeClick(this.page, `[data-value="${rule.target}"]`);
    
    // 选择匹配模式
    await safeClick(this.page, this.selectors.ruleMatchModeSelect);
    await safeClick(this.page, `[data-value="${rule.matchMode}"]`);
    
    // 输入匹配值
    await safeType(this.page, this.selectors.ruleMatchValueInput, rule.matchValue);
    
    // 设置优先级
    await safeType(this.page, this.selectors.rulePriorityInput, rule.priority.toString());
    
    // 设置启用状态
    const enabledCheckbox = this.page.locator(this.selectors.ruleEnabledCheckbox);
    const isChecked = await enabledCheckbox.isChecked();
    if (isChecked !== rule.enabled) {
      await enabledCheckbox.click();
    }
  }

  async saveRule(): Promise<void> {
    await safeClick(this.page, this.selectors.saveRuleButton);
  }

  async cancelRuleEdit(): Promise<void> {
    await safeClick(this.page, this.selectors.cancelRuleButton);
  }

  // 模板操作
  async getTemplatesCount(): Promise<number> {
    const templates = this.page.locator(this.selectors.templateItem);
    return await templates.count();
  }

  async applyTemplate(index: number): Promise<void> {
    const templateItem = this.page.locator(this.selectors.templateItem).nth(index);
    await templateItem.locator(this.selectors.applyTemplateButton).click();
    
    // 等待确认对话框
    await waitForElement(this.page, this.selectors.confirmDialog);
    await safeClick(this.page, this.selectors.confirmButton);
  }

  // 批量操作
  async selectAllRules(): Promise<void> {
    await safeClick(this.page, this.selectors.selectAllCheckbox);
  }

  async selectRule(index: number): Promise<void> {
    const ruleItem = this.page.locator(this.selectors.ruleItem).nth(index);
    const checkbox = ruleItem.locator('input[type="checkbox"]');
    await checkbox.click();
  }

  async batchDeleteRules(): Promise<void> {
    await safeClick(this.page, this.selectors.batchDeleteButton);
    await waitForElement(this.page, this.selectors.confirmDialog);
    await safeClick(this.page, this.selectors.confirmButton);
  }

  async batchEnableRules(): Promise<void> {
    await safeClick(this.page, this.selectors.batchEnableButton);
  }

  async batchDisableRules(): Promise<void> {
    await safeClick(this.page, this.selectors.batchDisableButton);
  }

  // 搜索和过滤
  async searchRules(query: string): Promise<void> {
    await safeType(this.page, this.selectors.searchInput, query);
  }

  async filterEnabledOnly(enabled: boolean): Promise<void> {
    const checkbox = this.page.locator(this.selectors.filterEnabledOnly);
    const isChecked = await checkbox.isChecked();
    if (isChecked !== enabled) {
      await checkbox.click();
    }
  }

  async sortBy(field: string): Promise<void> {
    await safeClick(this.page, this.selectors.sortBySelect);
    await safeClick(this.page, `[data-value="${field}"]`);
  }

  // 导入导出
  async exportRules(): Promise<void> {
    await safeClick(this.page, this.selectors.exportButton);
  }

  async importRules(filePath: string): Promise<void> {
    const fileInput = this.page.locator(this.selectors.importFileInput);
    await fileInput.setInputFiles(filePath);
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
}
