// 存储迁移工具
import type { FilterRule, StoredConfig } from '../types/filterRules';
import { STORAGE_KEYS, CONFIG_VERSION, DEFAULT_SETTINGS } from '../types/filterRules';
import { indexedDBStorageManager } from './indexedDBStorage';
import { validateRules } from './ruleValidation';

/**
 * 迁移状态
 */
export interface MigrationStatus {
  isRequired: boolean;        // 是否需要迁移
  hasLocalStorageData: boolean; // 是否有localStorage数据
  hasIndexedDBData: boolean;  // 是否有IndexedDB数据
  migrationCompleted: boolean; // 迁移是否完成
  error?: string;             // 错误信息
}

/**
 * 迁移结果
 */
export interface MigrationResult {
  success: boolean;           // 是否成功
  migratedRules: number;      // 迁移的规则数量
  migratedBackups: number;    // 迁移的备份数量
  error?: string;             // 错误信息
  warnings: string[];         // 警告信息
}

/**
 * 存储迁移管理器
 */
export class StorageMigrationManager {
  private static instance: StorageMigrationManager;

  private constructor() {}

  /**
   * 获取单例实例
   */
  static getInstance(): StorageMigrationManager {
    if (!StorageMigrationManager.instance) {
      StorageMigrationManager.instance = new StorageMigrationManager();
    }
    return StorageMigrationManager.instance;
  }

  /**
   * 检查迁移状态
   */
  async checkMigrationStatus(): Promise<MigrationStatus> {
    try {
      // 检查localStorage数据
      const localStorageConfig = localStorage.getItem(STORAGE_KEYS.CONFIG);
      const localStorageBackup = localStorage.getItem(STORAGE_KEYS.BACKUP);
      const hasLocalStorageData = !!(localStorageConfig || localStorageBackup);

      // 检查IndexedDB数据
      const indexedDBConfig = await indexedDBStorageManager.loadConfig();
      const indexedDBRules = await indexedDBStorageManager.loadRules();
      const hasIndexedDBData = !!(indexedDBConfig || indexedDBRules.length > 0);

      // 检查是否已完成迁移标记
      const migrationFlag = localStorage.getItem('curl-filter-migration-completed');
      const migrationCompleted = migrationFlag === 'true';

      // 判断是否需要迁移
      const isRequired = hasLocalStorageData && !migrationCompleted;

      return {
        isRequired,
        hasLocalStorageData,
        hasIndexedDBData,
        migrationCompleted
      };
    } catch (error) {
      return {
        isRequired: false,
        hasLocalStorageData: false,
        hasIndexedDBData: false,
        migrationCompleted: false,
        error: `检查迁移状态失败: ${(error as Error).message}`
      };
    }
  }

  /**
   * 执行迁移
   */
  async performMigration(): Promise<MigrationResult> {
    const result: MigrationResult = {
      success: false,
      migratedRules: 0,
      migratedBackups: 0,
      warnings: []
    };

    try {
      // 检查迁移状态
      const status = await this.checkMigrationStatus();
      if (!status.isRequired) {
        result.success = true;
        result.warnings.push('无需迁移或迁移已完成');
        return result;
      }

      console.log('开始从localStorage迁移数据到IndexedDB...');

      // 迁移主配置
      await this.migrateMainConfig(result);

      // 迁移备份数据
      await this.migrateBackups(result);

      // 验证迁移结果
      await this.validateMigration(result);

      // 标记迁移完成
      if (result.success) {
        localStorage.setItem('curl-filter-migration-completed', 'true');
        console.log('数据迁移完成');
      }

      return result;
    } catch (error) {
      result.error = `迁移失败: ${(error as Error).message}`;
      console.error('迁移失败:', error);
      return result;
    }
  }

  /**
   * 迁移主配置
   */
  private async migrateMainConfig(result: MigrationResult): Promise<void> {
    try {
      const configData = localStorage.getItem(STORAGE_KEYS.CONFIG);
      if (!configData) {
        result.warnings.push('未找到localStorage配置数据');
        return;
      }

      const config = JSON.parse(configData) as StoredConfig;
      
      // 验证配置版本
      if (config.version !== CONFIG_VERSION) {
        result.warnings.push(`配置版本不匹配: ${config.version} -> ${CONFIG_VERSION}`);
        // 更新版本
        config.version = CONFIG_VERSION;
      }

      // 验证规则
      if (config.rules && config.rules.length > 0) {
        const validation = validateRules(config.rules);
        if (!validation.isValid) {
          result.warnings.push(`发现无效规则: ${validation.errors.join(', ')}`);
          // 过滤掉无效规则
          config.rules = config.rules.filter((rule, index) => {
            try {
              return validateRules([rule]).isValid;
            } catch {
              result.warnings.push(`移除无效规则: ${rule.name || `规则${index + 1}`}`);
              return false;
            }
          });
        }
      }

      // 确保设置完整
      config.settings = {
        ...DEFAULT_SETTINGS,
        ...config.settings
      };

      // 保存到IndexedDB
      const saveSuccess = await indexedDBStorageManager.saveConfig(config);
      if (!saveSuccess) {
        throw new Error('保存配置到IndexedDB失败');
      }

      // 保存规则
      if (config.rules && config.rules.length > 0) {
        const rulesSuccess = await indexedDBStorageManager.saveRules(config.rules);
        if (!rulesSuccess) {
          throw new Error('保存规则到IndexedDB失败');
        }
        result.migratedRules = config.rules.length;
      }

      console.log(`成功迁移 ${result.migratedRules} 个规则`);
    } catch (error) {
      throw new Error(`迁移主配置失败: ${(error as Error).message}`);
    }
  }

  /**
   * 迁移备份数据
   */
  private async migrateBackups(result: MigrationResult): Promise<void> {
    try {
      const backupData = localStorage.getItem(STORAGE_KEYS.BACKUP);
      if (!backupData) {
        result.warnings.push('未找到localStorage备份数据');
        return;
      }

      const backups = JSON.parse(backupData) as Array<{ timestamp: string; config: StoredConfig }>;
      if (!Array.isArray(backups) || backups.length === 0) {
        result.warnings.push('备份数据格式无效或为空');
        return;
      }

      // 迁移每个备份
      for (const backup of backups) {
        try {
          // 验证备份数据
          if (!backup.timestamp || !backup.config) {
            result.warnings.push('跳过无效备份数据');
            continue;
          }

          // 验证备份中的规则
          if (backup.config.rules) {
            const validation = validateRules(backup.config.rules);
            if (!validation.isValid) {
              result.warnings.push(`备份中发现无效规则: ${validation.errors.join(', ')}`);
              // 过滤无效规则
              backup.config.rules = backup.config.rules.filter(rule => {
                try {
                  return validateRules([rule]).isValid;
                } catch {
                  return false;
                }
              });
            }
          }

          // 这里我们不直接迁移备份到IndexedDB的备份存储
          // 而是让IndexedDB的备份系统自然创建新的备份
          result.migratedBackups++;
        } catch (error) {
          result.warnings.push(`跳过损坏的备份: ${(error as Error).message}`);
        }
      }

      console.log(`处理了 ${result.migratedBackups} 个备份`);
    } catch (error) {
      result.warnings.push(`迁移备份失败: ${(error as Error).message}`);
    }
  }

  /**
   * 验证迁移结果
   */
  private async validateMigration(result: MigrationResult): Promise<void> {
    try {
      // 验证IndexedDB中的数据
      const config = await indexedDBStorageManager.loadConfig();
      const rules = await indexedDBStorageManager.loadRules();

      if (!config) {
        throw new Error('迁移后未找到配置数据');
      }

      if (rules.length !== result.migratedRules) {
        result.warnings.push(`规则数量不匹配: 预期 ${result.migratedRules}, 实际 ${rules.length}`);
      }

      // 验证规则有效性
      const validation = validateRules(rules);
      if (!validation.isValid) {
        throw new Error(`迁移后的规则验证失败: ${validation.errors.join(', ')}`);
      }

      result.success = true;
      console.log('迁移验证通过');
    } catch (error) {
      throw new Error(`迁移验证失败: ${(error as Error).message}`);
    }
  }

  /**
   * 清理localStorage数据（迁移完成后）
   */
  async cleanupLocalStorage(): Promise<boolean> {
    try {
      const status = await this.checkMigrationStatus();
      if (!status.migrationCompleted) {
        console.warn('迁移未完成，不执行清理');
        return false;
      }

      // 备份localStorage数据到临时位置（以防需要回滚）
      const configData = localStorage.getItem(STORAGE_KEYS.CONFIG);
      const backupData = localStorage.getItem(STORAGE_KEYS.BACKUP);
      
      if (configData) {
        localStorage.setItem(`${STORAGE_KEYS.CONFIG}-backup`, configData);
      }
      if (backupData) {
        localStorage.setItem(`${STORAGE_KEYS.BACKUP}-backup`, backupData);
      }

      // 清理原始数据
      localStorage.removeItem(STORAGE_KEYS.CONFIG);
      localStorage.removeItem(STORAGE_KEYS.BACKUP);

      console.log('localStorage数据清理完成');
      return true;
    } catch (error) {
      console.error('清理localStorage失败:', error);
      return false;
    }
  }

  /**
   * 回滚迁移（紧急情况下使用）
   */
  async rollbackMigration(): Promise<boolean> {
    try {
      // 恢复localStorage数据
      const configBackup = localStorage.getItem(`${STORAGE_KEYS.CONFIG}-backup`);
      const backupBackup = localStorage.getItem(`${STORAGE_KEYS.BACKUP}-backup`);

      if (configBackup) {
        localStorage.setItem(STORAGE_KEYS.CONFIG, configBackup);
      }
      if (backupBackup) {
        localStorage.setItem(STORAGE_KEYS.BACKUP, backupBackup);
      }

      // 清除迁移标记
      localStorage.removeItem('curl-filter-migration-completed');

      // 清空IndexedDB数据
      await indexedDBStorageManager.clearStorage();

      console.log('迁移回滚完成');
      return true;
    } catch (error) {
      console.error('迁移回滚失败:', error);
      return false;
    }
  }
}

/**
 * 获取迁移管理器实例
 */
export const migrationManager = StorageMigrationManager.getInstance();

/**
 * 自动迁移函数（应用启动时调用）
 */
export async function autoMigrate(): Promise<MigrationResult> {
  const manager = StorageMigrationManager.getInstance();
  const status = await manager.checkMigrationStatus();
  
  if (status.isRequired) {
    console.log('检测到需要迁移localStorage数据到IndexedDB');
    return await manager.performMigration();
  }

  return {
    success: true,
    migratedRules: 0,
    migratedBackups: 0,
    warnings: ['无需迁移']
  };
}
