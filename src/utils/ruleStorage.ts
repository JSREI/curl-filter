// 规则持久化存储

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

/**
 * 存储管理器
 */
export class RuleStorageManager {
  private static instance: RuleStorageManager;

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
   * 保存配置到本地存储
   */
  saveConfig(config: StoredConfig): boolean {
    try {
      const configToSave = {
        ...config,
        lastModified: new Date().toISOString()
      };

      localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(configToSave));
      
      // 创建备份
      this.createBackup(configToSave);
      
      return true;
    } catch (error) {
      console.error('保存配置失败:', error);
      return false;
    }
  }

  /**
   * 从本地存储加载配置
   */
  loadConfig(): StoredConfig | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CONFIG);
      if (!stored) {
        return this.createDefaultConfig();
      }

      const config = JSON.parse(stored) as StoredConfig;
      
      // 验证配置版本
      if (config.version !== CONFIG_VERSION) {
        return this.migrateConfig(config);
      }

      // 验证规则
      const validation = validateRules(config.rules);
      if (!validation.isValid) {
        console.warn('配置中存在无效规则:', validation.errors);
        // 尝试从备份恢复
        return this.loadFromBackup() || this.createDefaultConfig();
      }

      return config;
    } catch (error) {
      console.error('加载配置失败:', error);
      // 尝试从备份恢复
      return this.loadFromBackup() || this.createDefaultConfig();
    }
  }

  /**
   * 创建默认配置
   */
  createDefaultConfig(): StoredConfig {
    return {
      version: CONFIG_VERSION,
      rules: [],
      settings: { ...DEFAULT_SETTINGS },
      lastModified: new Date().toISOString()
    };
  }

  /**
   * 创建备份
   */
  private createBackup(config: StoredConfig): void {
    try {
      const backups = this.getBackups();
      backups.unshift({
        timestamp: new Date().toISOString(),
        config
      });

      // 只保留最近10个备份
      const limitedBackups = backups.slice(0, 10);
      localStorage.setItem(STORAGE_KEYS.BACKUP, JSON.stringify(limitedBackups));
    } catch (error) {
      console.error('创建备份失败:', error);
    }
  }

  /**
   * 获取备份列表
   */
  getBackups(): Array<{ timestamp: string; config: StoredConfig }> {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.BACKUP);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  /**
   * 从备份恢复
   */
  loadFromBackup(): StoredConfig | null {
    try {
      const backups = this.getBackups();
      if (backups.length === 0) {
        return null;
      }

      // 尝试最新的备份
      const latestBackup = backups[0];
      const validation = validateRules(latestBackup.config.rules);
      
      if (validation.isValid) {
        return latestBackup.config;
      }

      // 如果最新备份也有问题，尝试其他备份
      for (let i = 1; i < backups.length; i++) {
        const backup = backups[i];
        const backupValidation = validateRules(backup.config.rules);
        if (backupValidation.isValid) {
          return backup.config;
        }
      }

      return null;
    } catch {
      return null;
    }
  }

  /**
   * 配置迁移
   */
  private migrateConfig(_oldConfig: any): StoredConfig {
    // 这里可以实现版本迁移逻辑
    // 目前只是创建新的默认配置
    console.warn('配置版本不匹配，创建新的默认配置');
    return this.createDefaultConfig();
  }

  /**
   * 导出配置
   */
  exportConfig(config: StoredConfig): string {
    const exportData: ImportedConfig = {
      version: config.version,
      rules: config.rules.map(rule => ({
        name: rule.name,
        action: rule.action,
        target: rule.target,
        matchMode: rule.matchMode,
        matchValue: rule.matchValue,
        priority: rule.priority,
        enabled: rule.enabled,
        description: rule.description
      })),
      settings: config.settings
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * 导入配置
   */
  importConfig(jsonData: string): { success: boolean; config?: StoredConfig; error?: string } {
    try {
      const importData = JSON.parse(jsonData) as ImportedConfig;
      
      // 验证导入数据
      if (!importData.rules || !Array.isArray(importData.rules)) {
        return { success: false, error: '无效的配置格式：缺少规则数组' };
      }

      // 转换导入的规则
      const now = new Date().toISOString();
      const rules: FilterRule[] = importData.rules.map((rule, index) => ({
        id: `imported_${Date.now()}_${index}`,
        name: rule.name || `导入规则 ${index + 1}`,
        action: rule.action,
        target: rule.target,
        matchMode: rule.matchMode,
        matchValue: rule.matchValue || '',
        priority: rule.priority ?? 50,
        enabled: rule.enabled ?? true,
        description: rule.description || '',
        createdAt: now,
        updatedAt: now
      }));

      // 验证规则
      const validation = validateRules(rules);
      if (!validation.isValid) {
        return { 
          success: false, 
          error: `导入的规则存在错误: ${validation.errors.join(', ')}` 
        };
      }

      // 创建新配置
      const config: StoredConfig = {
        version: CONFIG_VERSION,
        rules,
        settings: {
          ...DEFAULT_SETTINGS,
          ...importData.settings
        },
        lastModified: now
      };

      return { success: true, config };
    } catch (error) {
      return { 
        success: false, 
        error: `解析配置文件失败: ${(error as Error).message}` 
      };
    }
  }

  /**
   * 清除所有存储数据
   */
  clearStorage(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.CONFIG);
      localStorage.removeItem(STORAGE_KEYS.BACKUP);
    } catch (error) {
      console.error('清除存储失败:', error);
    }
  }

  /**
   * 获取存储使用情况
   */
  getStorageInfo(): { used: number; available: number; percentage: number } {
    try {
      const config = localStorage.getItem(STORAGE_KEYS.CONFIG) || '';
      const backup = localStorage.getItem(STORAGE_KEYS.BACKUP) || '';
      const used = new Blob([config + backup]).size;
      
      // localStorage通常限制为5MB
      const available = 5 * 1024 * 1024;
      const percentage = (used / available) * 100;

      return { used, available, percentage };
    } catch {
      return { used: 0, available: 0, percentage: 0 };
    }
  }
}

/**
 * 获取存储管理器实例
 */
export const storageManager = RuleStorageManager.getInstance();

/**
 * 便捷函数：保存规则
 */
export function saveRules(rules: FilterRule[], settings?: Partial<StoredConfig['settings']>): boolean {
  const currentConfig = storageManager.loadConfig() || storageManager.createDefaultConfig();
  const newConfig: StoredConfig = {
    ...currentConfig,
    rules,
    settings: settings ? { ...currentConfig.settings, ...settings } : currentConfig.settings
  };
  return storageManager.saveConfig(newConfig);
}

/**
 * 便捷函数：加载规则
 */
export function loadRules(): FilterRule[] {
  const config = storageManager.loadConfig();
  return config ? config.rules : [];
}

/**
 * 便捷函数：保存设置
 */
export function saveSettings(settings: Partial<StoredConfig['settings']>): boolean {
  const currentConfig = storageManager.loadConfig() || storageManager.createDefaultConfig();
  const newConfig: StoredConfig = {
    ...currentConfig,
    settings: { ...currentConfig.settings, ...settings }
  };
  return storageManager.saveConfig(newConfig);
}

/**
 * 便捷函数：加载设置
 */
export function loadSettings(): StoredConfig['settings'] {
  const config = storageManager.loadConfig();
  return config ? config.settings : DEFAULT_SETTINGS;
}
