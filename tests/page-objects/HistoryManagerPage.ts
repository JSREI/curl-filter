import { Page, Locator, expect } from '@playwright/test';
import { waitForElement, safeClick, safeType } from '../utils/test-helpers';

/**
 * 历史记录管理页面对象模型
 */
export class HistoryManagerPage {
  readonly page: Page;
  
  readonly selectors = {
    // 主容器
    container: '[data-testid="history-manager-container"]',
    
    // 标签页
    historyTab: '[data-testid="history-tab"]',
    statisticsTab: '[data-testid="statistics-tab"]',
    
    // 搜索和过滤
    searchInput: '[data-testid="history-search-input"]',
    clearSearchButton: '[data-testid="clear-search-button"]',
    tagsFilter: '[data-testid="tags-filter"]',
    favoriteOnlyFilter: '[data-testid="favorite-only-filter"]',
    dateRangeFilter: '[data-testid="date-range-filter"]',
    
    // 排序
    sortBySelect: '[data-testid="sort-by-select"]',
    sortOrderButton: '[data-testid="sort-order-button"]',
    
    // 历史记录列表
    historyList: '[data-testid="history-list"]',
    historyItem: '[data-testid="history-item"]',
    historyItemTitle: '[data-testid="history-item-title"]',
    historyItemTimestamp: '[data-testid="history-item-timestamp"]',
    historyItemTags: '[data-testid="history-item-tags"]',
    historyItemFavorite: '[data-testid="history-item-favorite"]',
    
    // 历史记录操作
    viewHistoryButton: '[data-testid="view-history-button"]',
    editHistoryButton: '[data-testid="edit-history-button"]',
    deleteHistoryButton: '[data-testid="delete-history-button"]',
    favoriteHistoryButton: '[data-testid="favorite-history-button"]',
    copyInputButton: '[data-testid="copy-input-button"]',
    copyOutputButton: '[data-testid="copy-output-button"]',
    reapplyButton: '[data-testid="reapply-button"]',
    
    // 详情对话框
    detailDialog: '[data-testid="history-detail-dialog"]',
    detailInputCurl: '[data-testid="detail-input-curl"]',
    detailOutputCurl: '[data-testid="detail-output-curl"]',
    detailAppliedRules: '[data-testid="detail-applied-rules"]',
    detailTimestamp: '[data-testid="detail-timestamp"]',
    
    // 编辑对话框
    editDialog: '[data-testid="history-edit-dialog"]',
    editTitleInput: '[data-testid="edit-title-input"]',
    editTagsInput: '[data-testid="edit-tags-input"]',
    saveEditButton: '[data-testid="save-edit-button"]',
    cancelEditButton: '[data-testid="cancel-edit-button"]',
    
    // 批量操作
    selectAllCheckbox: '[data-testid="select-all-checkbox"]',
    batchDeleteButton: '[data-testid="batch-delete-button"]',
    batchFavoriteButton: '[data-testid="batch-favorite-button"]',
    batchExportButton: '[data-testid="batch-export-button"]',
    
    // 统计信息
    totalCountStat: '[data-testid="total-count-stat"]',
    favoriteCountStat: '[data-testid="favorite-count-stat"]',
    tagsCountStat: '[data-testid="tags-count-stat"]',
    recentActivityChart: '[data-testid="recent-activity-chart"]',
    
    // 分页
    pagination: '[data-testid="pagination"]',
    prevPageButton: '[data-testid="prev-page-button"]',
    nextPageButton: '[data-testid="next-page-button"]',
    pageInfo: '[data-testid="page-info"]',
    
    // 消息提示
    successMessage: '[data-testid="success-message"]',
    errorMessage: '[data-testid="error-message"]',
    emptyMessage: '[data-testid="empty-message"]',
    
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
  async switchToHistoryTab(): Promise<void> {
    await safeClick(this.page, this.selectors.historyTab);
  }

  async switchToStatisticsTab(): Promise<void> {
    await safeClick(this.page, this.selectors.statisticsTab);
  }

  // 搜索和过滤操作
  async searchHistory(query: string): Promise<void> {
    await safeType(this.page, this.selectors.searchInput, query);
    // 等待搜索结果更新
    await this.page.waitForTimeout(500);
  }

  async clearSearch(): Promise<void> {
    await safeClick(this.page, this.selectors.clearSearchButton);
  }

  async filterByTags(tags: string[]): Promise<void> {
    const tagsFilter = this.page.locator(this.selectors.tagsFilter);
    await tagsFilter.click();
    
    for (const tag of tags) {
      const tagOption = this.page.locator(`[data-value="${tag}"]`);
      await tagOption.click();
    }
    
    // 点击外部关闭下拉框
    await this.page.click('body');
  }

  async filterFavoriteOnly(favoriteOnly: boolean): Promise<void> {
    const checkbox = this.page.locator(this.selectors.favoriteOnlyFilter);
    const isChecked = await checkbox.isChecked();
    if (isChecked !== favoriteOnly) {
      await checkbox.click();
    }
  }

  async setDateRange(startDate: string, endDate: string): Promise<void> {
    const dateFilter = this.page.locator(this.selectors.dateRangeFilter);
    await dateFilter.click();
    
    // 设置开始日期
    const startInput = this.page.locator('[data-testid="start-date-input"]');
    await startInput.fill(startDate);
    
    // 设置结束日期
    const endInput = this.page.locator('[data-testid="end-date-input"]');
    await endInput.fill(endDate);
    
    // 应用日期范围
    const applyButton = this.page.locator('[data-testid="apply-date-range"]');
    await applyButton.click();
  }

  // 排序操作
  async sortBy(field: string): Promise<void> {
    await safeClick(this.page, this.selectors.sortBySelect);
    await safeClick(this.page, `[data-value="${field}"]`);
  }

  async toggleSortOrder(): Promise<void> {
    await safeClick(this.page, this.selectors.sortOrderButton);
  }

  // 历史记录列表操作
  async getHistoryCount(): Promise<number> {
    const items = this.page.locator(this.selectors.historyItem);
    return await items.count();
  }

  async getHistoryItemByIndex(index: number): Promise<{
    title: string;
    timestamp: string;
    tags: string[];
    favorite: boolean;
  }> {
    const item = this.page.locator(this.selectors.historyItem).nth(index);
    
    const title = await item.locator(this.selectors.historyItemTitle).textContent() || '';
    const timestamp = await item.locator(this.selectors.historyItemTimestamp).textContent() || '';
    
    const tagsElement = item.locator(this.selectors.historyItemTags);
    const tagsText = await tagsElement.textContent() || '';
    const tags = tagsText ? tagsText.split(',').map(tag => tag.trim()) : [];
    
    const favoriteElement = item.locator(this.selectors.historyItemFavorite);
    const favorite = await favoriteElement.isVisible();
    
    return { title, timestamp, tags, favorite };
  }

  async findHistoryByTitle(title: string): Promise<number> {
    const items = this.page.locator(this.selectors.historyItem);
    const count = await items.count();
    
    for (let i = 0; i < count; i++) {
      const item = items.nth(i);
      const itemTitle = await item.locator(this.selectors.historyItemTitle).textContent();
      if (itemTitle === title) {
        return i;
      }
    }
    
    return -1;
  }

  // 历史记录操作
  async viewHistory(index: number): Promise<void> {
    const item = this.page.locator(this.selectors.historyItem).nth(index);
    await item.locator(this.selectors.viewHistoryButton).click();
    await waitForElement(this.page, this.selectors.detailDialog);
  }

  async editHistory(index: number): Promise<void> {
    const item = this.page.locator(this.selectors.historyItem).nth(index);
    await item.locator(this.selectors.editHistoryButton).click();
    await waitForElement(this.page, this.selectors.editDialog);
  }

  async deleteHistory(index: number): Promise<void> {
    const item = this.page.locator(this.selectors.historyItem).nth(index);
    await item.locator(this.selectors.deleteHistoryButton).click();
    
    // 等待确认对话框
    await waitForElement(this.page, this.selectors.confirmDialog);
    await safeClick(this.page, this.selectors.confirmButton);
  }

  async toggleFavorite(index: number): Promise<void> {
    const item = this.page.locator(this.selectors.historyItem).nth(index);
    await item.locator(this.selectors.favoriteHistoryButton).click();
  }

  async copyInput(index: number): Promise<void> {
    const item = this.page.locator(this.selectors.historyItem).nth(index);
    await item.locator(this.selectors.copyInputButton).click();
  }

  async copyOutput(index: number): Promise<void> {
    const item = this.page.locator(this.selectors.historyItem).nth(index);
    await item.locator(this.selectors.copyOutputButton).click();
  }

  async reapplyHistory(index: number): Promise<void> {
    const item = this.page.locator(this.selectors.historyItem).nth(index);
    await item.locator(this.selectors.reapplyButton).click();
  }

  // 详情对话框操作
  async getDetailInputCurl(): Promise<string> {
    const element = this.page.locator(this.selectors.detailInputCurl);
    return await element.textContent() || '';
  }

  async getDetailOutputCurl(): Promise<string> {
    const element = this.page.locator(this.selectors.detailOutputCurl);
    return await element.textContent() || '';
  }

  async getDetailAppliedRules(): Promise<string[]> {
    const element = this.page.locator(this.selectors.detailAppliedRules);
    const rulesText = await element.textContent() || '';
    return rulesText ? rulesText.split(',').map(rule => rule.trim()) : [];
  }

  // 编辑对话框操作
  async editHistoryDetails(title: string, tags: string[]): Promise<void> {
    await safeType(this.page, this.selectors.editTitleInput, title);
    await safeType(this.page, this.selectors.editTagsInput, tags.join(', '));
    await safeClick(this.page, this.selectors.saveEditButton);
  }

  async cancelEdit(): Promise<void> {
    await safeClick(this.page, this.selectors.cancelEditButton);
  }

  // 批量操作
  async selectAllHistory(): Promise<void> {
    await safeClick(this.page, this.selectors.selectAllCheckbox);
  }

  async selectHistory(index: number): Promise<void> {
    const item = this.page.locator(this.selectors.historyItem).nth(index);
    const checkbox = item.locator('input[type="checkbox"]');
    await checkbox.click();
  }

  async batchDeleteHistory(): Promise<void> {
    await safeClick(this.page, this.selectors.batchDeleteButton);
    await waitForElement(this.page, this.selectors.confirmDialog);
    await safeClick(this.page, this.selectors.confirmButton);
  }

  async batchFavoriteHistory(): Promise<void> {
    await safeClick(this.page, this.selectors.batchFavoriteButton);
  }

  async batchExportHistory(): Promise<void> {
    await safeClick(this.page, this.selectors.batchExportButton);
  }

  // 统计信息
  async getTotalCount(): Promise<number> {
    const element = this.page.locator(this.selectors.totalCountStat);
    const text = await element.textContent() || '0';
    return parseInt(text);
  }

  async getFavoriteCount(): Promise<number> {
    const element = this.page.locator(this.selectors.favoriteCountStat);
    const text = await element.textContent() || '0';
    return parseInt(text);
  }

  async getTagsCount(): Promise<number> {
    const element = this.page.locator(this.selectors.tagsCountStat);
    const text = await element.textContent() || '0';
    return parseInt(text);
  }

  // 分页操作
  async goToNextPage(): Promise<void> {
    await safeClick(this.page, this.selectors.nextPageButton);
  }

  async goToPrevPage(): Promise<void> {
    await safeClick(this.page, this.selectors.prevPageButton);
  }

  async getCurrentPageInfo(): Promise<string> {
    const element = this.page.locator(this.selectors.pageInfo);
    return await element.textContent() || '';
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

  async isEmptyState(): Promise<boolean> {
    const element = this.page.locator(this.selectors.emptyMessage);
    return await element.isVisible();
  }
}
