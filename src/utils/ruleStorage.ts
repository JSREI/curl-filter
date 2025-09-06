// 规则持久化存储 - 现在使用IndexedDB

import type {
  FilterRule,
  StoredConfig,
  ImportedConfig
} from '../types/filterRules';
import {
  DEFAULT_SETTINGS,
  CONFIG_VERSION,
  STORAGE_KEYS
} from '../types/filterRules';
import { validateRules } from './ruleValidation';
import {
  indexedDBStorageManager,
  saveRules as saveRulesToIndexedDB,
  loadRules as loadRulesFromIndexedDB,
  saveSettings as saveSettingsToIndexedDB,
  loadSettings as loadSettingsFromIndexedDB
} from './indexedDBStorage';
import { autoMigrate } from './storageMigration';

/**
 * 存储管理器 - 现在作为IndexedDB的包装器
 */
export class RuleStorageManager {
  private static instance: RuleStorageManager;
  private migrationPromise: Promise<void> | null = null;

  private constructor() {}

  /**
   * 获取单例实例
   */
  static getInstance(): RuleStorageManager {
    if (!RuleStorageManager.instance) {
      RuleStorageManager.instance = new RuleStorageManager();
    }
    return RuleStorageManager.instance;
  }

  /**
   * 确保迁移完成
   */
  private async ensureMigration(): Promise<void> {
    if (!this.migrationPromise) {
      this.migrationPromise = this.performMigration();
    }
    return this.migrationPromise;
  }

  /**
   * 执行迁移
   */
  private async performMigration(): Promise<void> {
    try {
      const result = await autoMigrate();
      if (!result.success && result.error) {
        console.error('自动迁移失败:', result.error);
      } else if (result.migratedRules > 0) {
        console.log(`成功迁移 ${result.migratedRules} 个规则到IndexedDB`);
      }
    } catch (error) {
      console.error('迁移过程中发生错误:', error);
    }
  }

  /**
   * 保存配置到IndexedDB
   */
  async saveConfig(config: StoredConfig): Promise<boolean> {
    await this.ensureMigration();
    return await indexedDBStorageManager.saveConfig(config);
  }

  /**
   * 从IndexedDB加载配置
   */
  async loadConfig(): Promise<StoredConfig | null> {
    await this.ensureMigration();
    return await indexedDBStorageManager.loadConfig();
  }

  /**
   * 创建默认配置
   */
  createDefaultConfig(): StoredConfig {
    return indexedDBStorageManager.createDefaultConfig();
  }

  /**
   * 获取备份列表
   */
  async getBackups(): Promise<Array<{ timestamp: string; config: StoredConfig }>> {
    await this.ensureMigration();
    return await indexedDBStorageManager.getBackups();
  }

  /**
   * 从备份恢复
   */
  async loadFromBackup(): Promise<StoredConfig | null> {
    await this.ensureMigration();
    return await indexedDBStorageManager.loadFromBackup();
  }

  /**
   * 导出配置
   */
  async exportConfig(): Promise<string> {
    await this.ensureMigration();
    return await indexedDBStorageManager.exportConfig();
  }

  /**
   * 导入配置
   */
  async importConfig(jsonData: string): Promise<{ success: boolean; config?: StoredConfig; error?: string }> {
    await this.ensureMigration();
    return await indexedDBStorageManager.importConfig(jsonData);
  }

  /**
   * 清除所有存储数据
   */
  async clearStorage(): Promise<void> {
    await this.ensureMigration();
    return await indexedDBStorageManager.clearStorage();
  }

  /**
   * 获取存储使用情况
   */
  async getStorageInfo(): Promise<{ used: number; available: number; percentage: number }> {
    await this.ensureMigration();
    return await indexedDBStorageManager.getStorageInfo();
  }
}

/**
 * 获取存储管理器实例
 */
export const storageManager = RuleStorageManager.getInstance();

/**
 * 便捷函数：保存规则
 */
export async function saveRules(rules: FilterRule[], settings?: Partial<StoredConfig['settings']>): Promise<boolean> {
  return await saveRulesToIndexedDB(rules, settings);
}

/**
 * 便捷函数：加载规则
 */
export async function loadRules(): Promise<FilterRule[]> {
  return await loadRulesFromIndexedDB();
}

/**
 * 便捷函数：保存设置
 */
export async function saveSettings(settings: Partial<StoredConfig['settings']>): Promise<boolean> {
  return await saveSettingsToIndexedDB(settings);
}

/**
 * 便捷函数：加载设置
 */
export async function loadSettings(): Promise<StoredConfig['settings']> {
  return await loadSettingsFromIndexedDB();
}
