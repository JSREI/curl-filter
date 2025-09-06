// IndexedDB 存储管理器
import type {
  FilterRule,
  StoredConfig,
  HistoryEntry,
  HistoryQueryOptions,
  HistoryStats,
  ImportedConfig
} from '../types/filterRules';
import {
  DEFAULT_SETTINGS,
  CONFIG_VERSION
} from '../types/filterRules';
import { validateRules } from './ruleValidation';

/**
 * IndexedDB 数据库配置
 */
const DB_NAME = 'CurlFilterDB';
const DB_VERSION = 1;

/**
 * 对象存储名称
 */
const STORES = {
  CONFIG: 'config',
  RULES: 'rules',
  HISTORY: 'history',
  BACKUP: 'backup'
} as const;

/**
 * IndexedDB 存储管理器
 */
export class IndexedDBStorageManager {
  private static instance: IndexedDBStorageManager;
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  private constructor() {}

  /**
   * 获取单例实例
   */
  static getInstance(): IndexedDBStorageManager {
    if (!IndexedDBStorageManager.instance) {
      IndexedDBStorageManager.instance = new IndexedDBStorageManager();
    }
    return IndexedDBStorageManager.instance;
  }

  /**
   * 初始化数据库
   */
  private async initDB(): Promise<void> {
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        reject(new Error('无法打开IndexedDB数据库'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // 创建配置存储
        if (!db.objectStoreNames.contains(STORES.CONFIG)) {
          db.createObjectStore(STORES.CONFIG, { keyPath: 'key' });
        }

        // 创建规则存储
        if (!db.objectStoreNames.contains(STORES.RULES)) {
          const rulesStore = db.createObjectStore(STORES.RULES, { keyPath: 'id' });
          rulesStore.createIndex('enabled', 'enabled', { unique: false });
          rulesStore.createIndex('priority', 'priority', { unique: false });
          rulesStore.createIndex('target', 'target', { unique: false });
        }

        // 创建历史记录存储
        if (!db.objectStoreNames.contains(STORES.HISTORY)) {
          const historyStore = db.createObjectStore(STORES.HISTORY, { keyPath: 'id' });
          historyStore.createIndex('timestamp', 'timestamp', { unique: false });
          historyStore.createIndex('favorite', 'favorite', { unique: false });
          historyStore.createIndex('tags', 'tags', { unique: false, multiEntry: true });
        }

        // 创建备份存储
        if (!db.objectStoreNames.contains(STORES.BACKUP)) {
          const backupStore = db.createObjectStore(STORES.BACKUP, { keyPath: 'timestamp' });
        }
      };
    });

    return this.initPromise;
  }

  /**
   * 确保数据库已初始化
   */
  private async ensureDB(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.initDB();
    }
    if (!this.db) {
      throw new Error('数据库初始化失败');
    }
    return this.db;
  }

  /**
   * 执行事务
   */
  private async executeTransaction<T>(
    storeNames: string | string[],
    mode: IDBTransactionMode,
    operation: (stores: IDBObjectStore | IDBObjectStore[]) => Promise<T> | T
  ): Promise<T> {
    const db = await this.ensureDB();
    const transaction = db.transaction(storeNames, mode);
    
    return new Promise((resolve, reject) => {
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(new Error('事务被中止'));
      
      try {
        const stores = Array.isArray(storeNames) 
          ? storeNames.map(name => transaction.objectStore(name))
          : transaction.objectStore(storeNames);
        
        const result = operation(stores);
        
        if (result instanceof Promise) {
          result.then(resolve).catch(reject);
        } else {
          resolve(result);
        }
      } catch (error) {
        reject(error);
      }
    });
  }

  // ==================== 配置管理 ====================

  /**
   * 保存配置
   */
  async saveConfig(config: StoredConfig): Promise<boolean> {
    try {
      const configToSave = {
        ...config,
        lastModified: new Date().toISOString()
      };

      await this.executeTransaction(STORES.CONFIG, 'readwrite', (store) => {
        const configStore = store as IDBObjectStore;
        return new Promise<void>((resolve, reject) => {
          const request = configStore.put({ key: 'main', ...configToSave });
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      });

      // 创建备份
      await this.createBackup(configToSave);
      
      return true;
    } catch (error) {
      console.error('保存配置失败:', error);
      return false;
    }
  }

  /**
   * 加载配置
   */
  async loadConfig(): Promise<StoredConfig | null> {
    try {
      const config = await this.executeTransaction(STORES.CONFIG, 'readonly', (store) => {
        const configStore = store as IDBObjectStore;
        return new Promise<StoredConfig | null>((resolve, reject) => {
          const request = configStore.get('main');
          request.onsuccess = () => {
            const result = request.result;
            if (result) {
              const { key, ...config } = result;
              resolve(config as StoredConfig);
            } else {
              resolve(null);
            }
          };
          request.onerror = () => reject(request.error);
        });
      });

      if (!config) {
        return this.createDefaultConfig();
      }

      // 验证配置版本
      if (config.version !== CONFIG_VERSION) {
        return this.migrateConfig(config);
      }

      // 验证规则
      const validation = validateRules(config.rules);
      if (!validation.isValid) {
        console.warn('配置中存在无效规则:', validation.errors);
        // 尝试从备份恢复
        return await this.loadFromBackup() || this.createDefaultConfig();
      }

      return config;
    } catch (error) {
      console.error('加载配置失败:', error);
      // 尝试从备份恢复
      return await this.loadFromBackup() || this.createDefaultConfig();
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
  private async createBackup(config: StoredConfig): Promise<void> {
    try {
      const backups = await this.getBackups();
      const newBackup = {
        timestamp: new Date().toISOString(),
        config
      };

      await this.executeTransaction(STORES.BACKUP, 'readwrite', (store) => {
        const backupStore = store as IDBObjectStore;
        return new Promise<void>((resolve, reject) => {
          const request = backupStore.put(newBackup);
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      });

      // 清理旧备份，只保留最近10个
      if (backups.length >= 10) {
        const oldBackups = backups.slice(10);
        await this.executeTransaction(STORES.BACKUP, 'readwrite', (store) => {
          const backupStore = store as IDBObjectStore;
          return Promise.all(oldBackups.map(backup => 
            new Promise<void>((resolve, reject) => {
              const request = backupStore.delete(backup.timestamp);
              request.onsuccess = () => resolve();
              request.onerror = () => reject(request.error);
            })
          ));
        });
      }
    } catch (error) {
      console.error('创建备份失败:', error);
    }
  }

  /**
   * 获取备份列表
   */
  async getBackups(): Promise<Array<{ timestamp: string; config: StoredConfig }>> {
    try {
      return await this.executeTransaction(STORES.BACKUP, 'readonly', (store) => {
        const backupStore = store as IDBObjectStore;
        return new Promise<Array<{ timestamp: string; config: StoredConfig }>>((resolve, reject) => {
          const request = backupStore.getAll();
          request.onsuccess = () => {
            const backups = request.result || [];
            // 按时间戳降序排序
            backups.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            resolve(backups);
          };
          request.onerror = () => reject(request.error);
        });
      });
    } catch {
      return [];
    }
  }

  /**
   * 从备份恢复
   */
  async loadFromBackup(): Promise<StoredConfig | null> {
    try {
      const backups = await this.getBackups();
      if (backups.length === 0) {
        return null;
      }

      // 尝试最新的备份
      for (const backup of backups) {
        const validation = validateRules(backup.config.rules);
        if (validation.isValid) {
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

  // ==================== 规则管理 ====================

  /**
   * 保存规则
   */
  async saveRule(rule: FilterRule): Promise<boolean> {
    try {
      await this.executeTransaction(STORES.RULES, 'readwrite', (store) => {
        const rulesStore = store as IDBObjectStore;
        return new Promise<void>((resolve, reject) => {
          const request = rulesStore.put(rule);
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      });
      return true;
    } catch (error) {
      console.error('保存规则失败:', error);
      return false;
    }
  }

  /**
   * 批量保存规则
   */
  async saveRules(rules: FilterRule[]): Promise<boolean> {
    try {
      await this.executeTransaction(STORES.RULES, 'readwrite', (store) => {
        const rulesStore = store as IDBObjectStore;
        return Promise.all(rules.map(rule =>
          new Promise<void>((resolve, reject) => {
            const request = rulesStore.put(rule);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
          })
        ));
      });
      return true;
    } catch (error) {
      console.error('批量保存规则失败:', error);
      return false;
    }
  }

  /**
   * 加载所有规则
   */
  async loadRules(): Promise<FilterRule[]> {
    try {
      return await this.executeTransaction(STORES.RULES, 'readonly', (store) => {
        const rulesStore = store as IDBObjectStore;
        return new Promise<FilterRule[]>((resolve, reject) => {
          const request = rulesStore.getAll();
          request.onsuccess = () => resolve(request.result || []);
          request.onerror = () => reject(request.error);
        });
      });
    } catch (error) {
      console.error('加载规则失败:', error);
      return [];
    }
  }

  /**
   * 根据ID获取规则
   */
  async getRuleById(id: string): Promise<FilterRule | null> {
    try {
      return await this.executeTransaction(STORES.RULES, 'readonly', (store) => {
        const rulesStore = store as IDBObjectStore;
        return new Promise<FilterRule | null>((resolve, reject) => {
          const request = rulesStore.get(id);
          request.onsuccess = () => resolve(request.result || null);
          request.onerror = () => reject(request.error);
        });
      });
    } catch (error) {
      console.error('获取规则失败:', error);
      return null;
    }
  }

  /**
   * 删除规则
   */
  async deleteRule(id: string): Promise<boolean> {
    try {
      await this.executeTransaction(STORES.RULES, 'readwrite', (store) => {
        const rulesStore = store as IDBObjectStore;
        return new Promise<void>((resolve, reject) => {
          const request = rulesStore.delete(id);
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      });
      return true;
    } catch (error) {
      console.error('删除规则失败:', error);
      return false;
    }
  }

  /**
   * 清空所有规则
   */
  async clearRules(): Promise<boolean> {
    try {
      await this.executeTransaction(STORES.RULES, 'readwrite', (store) => {
        const rulesStore = store as IDBObjectStore;
        return new Promise<void>((resolve, reject) => {
          const request = rulesStore.clear();
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      });
      return true;
    } catch (error) {
      console.error('清空规则失败:', error);
      return false;
    }
  }

  // ==================== 历史记录管理 ====================

  /**
   * 保存历史记录
   */
  async saveHistoryEntry(entry: HistoryEntry): Promise<boolean> {
    try {
      await this.executeTransaction(STORES.HISTORY, 'readwrite', (store) => {
        const historyStore = store as IDBObjectStore;
        return new Promise<void>((resolve, reject) => {
          const request = historyStore.put(entry);
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      });
      return true;
    } catch (error) {
      console.error('保存历史记录失败:', error);
      return false;
    }
  }

  /**
   * 查询历史记录
   */
  async queryHistory(options: HistoryQueryOptions = {}): Promise<HistoryEntry[]> {
    try {
      const {
        limit = 50,
        offset = 0,
        sortBy = 'timestamp',
        sortOrder = 'desc',
        searchText,
        tags,
        favoriteOnly,
        dateRange
      } = options;

      return await this.executeTransaction(STORES.HISTORY, 'readonly', (store) => {
        const historyStore = store as IDBObjectStore;
        return new Promise<HistoryEntry[]>((resolve, reject) => {
          let request: IDBRequest;

          if (favoriteOnly) {
            const index = historyStore.index('favorite');
            request = index.getAll(true);
          } else {
            request = historyStore.getAll();
          }

          request.onsuccess = () => {
            let results = request.result || [];

            // 应用过滤条件
            if (searchText) {
              const searchLower = searchText.toLowerCase();
              results = results.filter(entry =>
                entry.inputCurl.toLowerCase().includes(searchLower) ||
                entry.outputCurl.toLowerCase().includes(searchLower) ||
                (entry.title && entry.title.toLowerCase().includes(searchLower))
              );
            }

            if (tags && tags.length > 0) {
              results = results.filter(entry =>
                entry.tags && entry.tags.some(tag => tags.includes(tag))
              );
            }

            if (dateRange) {
              const startTime = new Date(dateRange.start).getTime();
              const endTime = new Date(dateRange.end).getTime();
              results = results.filter(entry => {
                const entryTime = new Date(entry.timestamp).getTime();
                return entryTime >= startTime && entryTime <= endTime;
              });
            }

            // 排序
            results.sort((a, b) => {
              let aValue: any, bValue: any;
              if (sortBy === 'timestamp') {
                aValue = new Date(a.timestamp).getTime();
                bValue = new Date(b.timestamp).getTime();
              } else if (sortBy === 'title') {
                aValue = a.title || '';
                bValue = b.title || '';
              }

              if (sortOrder === 'desc') {
                return bValue > aValue ? 1 : bValue < aValue ? -1 : 0;
              } else {
                return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
              }
            });

            // 分页
            const paginatedResults = results.slice(offset, offset + limit);
            resolve(paginatedResults);
          };
          request.onerror = () => reject(request.error);
        });
      });
    } catch (error) {
      console.error('查询历史记录失败:', error);
      return [];
    }
  }

  /**
   * 根据ID获取历史记录
   */
  async getHistoryById(id: string): Promise<HistoryEntry | null> {
    try {
      return await this.executeTransaction(STORES.HISTORY, 'readonly', (store) => {
        const historyStore = store as IDBObjectStore;
        return new Promise<HistoryEntry | null>((resolve, reject) => {
          const request = historyStore.get(id);
          request.onsuccess = () => resolve(request.result || null);
          request.onerror = () => reject(request.error);
        });
      });
    } catch (error) {
      console.error('获取历史记录失败:', error);
      return null;
    }
  }

  /**
   * 更新历史记录
   */
  async updateHistoryEntry(id: string, updates: Partial<HistoryEntry>): Promise<boolean> {
    try {
      const existing = await this.getHistoryById(id);
      if (!existing) {
        return false;
      }

      const updated = { ...existing, ...updates };
      return await this.saveHistoryEntry(updated);
    } catch (error) {
      console.error('更新历史记录失败:', error);
      return false;
    }
  }

  /**
   * 删除历史记录
   */
  async deleteHistoryEntry(id: string): Promise<boolean> {
    try {
      await this.executeTransaction(STORES.HISTORY, 'readwrite', (store) => {
        const historyStore = store as IDBObjectStore;
        return new Promise<void>((resolve, reject) => {
          const request = historyStore.delete(id);
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      });
      return true;
    } catch (error) {
      console.error('删除历史记录失败:', error);
      return false;
    }
  }

  /**
   * 批量删除历史记录
   */
  async deleteHistoryEntries(ids: string[]): Promise<boolean> {
    try {
      await this.executeTransaction(STORES.HISTORY, 'readwrite', (store) => {
        const historyStore = store as IDBObjectStore;
        return Promise.all(ids.map(id =>
          new Promise<void>((resolve, reject) => {
            const request = historyStore.delete(id);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
          })
        ));
      });
      return true;
    } catch (error) {
      console.error('批量删除历史记录失败:', error);
      return false;
    }
  }

  /**
   * 清空历史记录
   */
  async clearHistory(): Promise<boolean> {
    try {
      await this.executeTransaction(STORES.HISTORY, 'readwrite', (store) => {
        const historyStore = store as IDBObjectStore;
        return new Promise<void>((resolve, reject) => {
          const request = historyStore.clear();
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      });
      return true;
    } catch (error) {
      console.error('清空历史记录失败:', error);
      return false;
    }
  }

  /**
   * 获取历史记录统计信息
   */
  async getHistoryStats(): Promise<HistoryStats> {
    try {
      const entries = await this.queryHistory({ limit: 10000 }); // 获取所有记录进行统计

      const stats: HistoryStats = {
        totalEntries: entries.length,
        favoriteEntries: entries.filter(e => e.favorite).length,
        tagsCount: {},
        dateRange: {
          earliest: '',
          latest: ''
        }
      };

      // 统计标签
      entries.forEach(entry => {
        if (entry.tags) {
          entry.tags.forEach(tag => {
            stats.tagsCount[tag] = (stats.tagsCount[tag] || 0) + 1;
          });
        }
      });

      // 计算日期范围
      if (entries.length > 0) {
        const timestamps = entries.map(e => new Date(e.timestamp).getTime());
        stats.dateRange.earliest = new Date(Math.min(...timestamps)).toISOString();
        stats.dateRange.latest = new Date(Math.max(...timestamps)).toISOString();
      }

      return stats;
    } catch (error) {
      console.error('获取历史记录统计失败:', error);
      return {
        totalEntries: 0,
        favoriteEntries: 0,
        tagsCount: {},
        dateRange: { earliest: '', latest: '' }
      };
    }
  }

  // ==================== 导入导出功能 ====================

  /**
   * 导出配置
   */
  async exportConfig(): Promise<string> {
    try {
      const config = await this.loadConfig();
      if (!config) {
        throw new Error('无法加载配置');
      }

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
    } catch (error) {
      console.error('导出配置失败:', error);
      throw error;
    }
  }

  /**
   * 导入配置
   */
  async importConfig(jsonData: string): Promise<{ success: boolean; config?: StoredConfig; error?: string }> {
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

      // 保存规则到IndexedDB
      await this.clearRules();
      await this.saveRules(rules);
      await this.saveConfig(config);

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
  async clearStorage(): Promise<void> {
    try {
      const db = await this.ensureDB();
      const storeNames = [STORES.CONFIG, STORES.RULES, STORES.HISTORY, STORES.BACKUP];

      await this.executeTransaction(storeNames, 'readwrite', (stores) => {
        const storeArray = stores as IDBObjectStore[];
        return Promise.all(storeArray.map(store =>
          new Promise<void>((resolve, reject) => {
            const request = store.clear();
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
          })
        ));
      });
    } catch (error) {
      console.error('清除存储失败:', error);
    }
  }

  /**
   * 获取存储使用情况
   */
  async getStorageInfo(): Promise<{ used: number; available: number; percentage: number }> {
    try {
      // IndexedDB没有直接的存储限制查询方法
      // 这里提供一个估算
      const config = await this.loadConfig();
      const rules = await this.loadRules();
      const history = await this.queryHistory({ limit: 1000 });

      const configSize = JSON.stringify(config).length;
      const rulesSize = JSON.stringify(rules).length;
      const historySize = JSON.stringify(history).length;

      const used = configSize + rulesSize + historySize;

      // IndexedDB通常有更大的存储限制，这里使用50MB作为估算
      const available = 50 * 1024 * 1024;
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
export const indexedDBStorageManager = IndexedDBStorageManager.getInstance();

// ==================== 便捷函数 ====================

/**
 * 便捷函数：保存规则
 */
export async function saveRules(rules: FilterRule[], settings?: Partial<StoredConfig['settings']>): Promise<boolean> {
  const manager = IndexedDBStorageManager.getInstance();

  // 保存规则
  const rulesSuccess = await manager.saveRules(rules);
  if (!rulesSuccess) {
    return false;
  }

  // 更新配置
  const currentConfig = await manager.loadConfig() || manager.createDefaultConfig();
  const newConfig: StoredConfig = {
    ...currentConfig,
    rules,
    settings: settings ? { ...currentConfig.settings, ...settings } : currentConfig.settings
  };

  return await manager.saveConfig(newConfig);
}

/**
 * 便捷函数：加载规则
 */
export async function loadRules(): Promise<FilterRule[]> {
  const manager = IndexedDBStorageManager.getInstance();
  return await manager.loadRules();
}

/**
 * 便捷函数：保存设置
 */
export async function saveSettings(settings: Partial<StoredConfig['settings']>): Promise<boolean> {
  const manager = IndexedDBStorageManager.getInstance();
  const currentConfig = await manager.loadConfig() || manager.createDefaultConfig();
  const newConfig: StoredConfig = {
    ...currentConfig,
    settings: { ...currentConfig.settings, ...settings }
  };
  return await manager.saveConfig(newConfig);
}

/**
 * 便捷函数：加载设置
 */
export async function loadSettings(): Promise<StoredConfig['settings']> {
  const manager = IndexedDBStorageManager.getInstance();
  const config = await manager.loadConfig();
  return config ? config.settings : DEFAULT_SETTINGS;
}

/**
 * 便捷函数：保存历史记录
 */
export async function saveHistoryEntry(
  inputCurl: string,
  outputCurl: string,
  appliedRules: string[],
  filterResult: any,
  title?: string,
  tags?: string[]
): Promise<boolean> {
  const manager = IndexedDBStorageManager.getInstance();
  const entry: HistoryEntry = {
    id: `history_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    inputCurl,
    outputCurl,
    appliedRules,
    filterResult,
    timestamp: new Date().toISOString(),
    title,
    tags,
    favorite: false
  };

  return await manager.saveHistoryEntry(entry);
}

/**
 * 便捷函数：获取最近的历史记录
 */
export async function getRecentHistory(limit: number = 10): Promise<HistoryEntry[]> {
  const manager = IndexedDBStorageManager.getInstance();
  return await manager.queryHistory({
    limit,
    sortBy: 'timestamp',
    sortOrder: 'desc'
  });
}

/**
 * 便捷函数：搜索历史记录
 */
export async function searchHistory(searchText: string, limit: number = 20): Promise<HistoryEntry[]> {
  const manager = IndexedDBStorageManager.getInstance();
  return await manager.queryHistory({
    limit,
    searchText,
    sortBy: 'timestamp',
    sortOrder: 'desc'
  });
}
