// 过滤规则系统的类型定义

/**
 * 过滤动作类型
 */
export const FilterAction = {
  DELETE: 'delete',           // 删除匹配的项
  DELETE_ALL: 'delete_all',   // 删除所有项（忽略匹配值）
  KEEP: 'keep',               // 保留匹配的项
  KEEP_ALL: 'keep_all'        // 保留所有项（忽略匹配值）
} as const;

export type FilterAction = typeof FilterAction[keyof typeof FilterAction];

/**
 * 过滤目标类型
 */
export const FilterTarget = {
  HEADERS: 'headers',         // 请求头
  QUERY_PARAMS: 'query_params', // URL查询参数
  FORM_DATA: 'form_data',     // 表单数据
  JSON_BODY: 'json_body'      // JSON请求体
} as const;

export type FilterTarget = typeof FilterTarget[keyof typeof FilterTarget];

/**
 * 匹配模式
 */
export const MatchMode = {
  EXACT: 'exact',             // 精确匹配
  CONTAINS: 'contains',       // 包含匹配
  REGEX: 'regex',             // 正则表达式
  STARTS_WITH: 'starts_with', // 开头匹配
  ENDS_WITH: 'ends_with'      // 结尾匹配
} as const;

export type MatchMode = typeof MatchMode[keyof typeof MatchMode];

/**
 * 过滤规则
 */
export interface FilterRule {
  id: string;                  // 唯一标识
  name: string;                // 规则名称
  action: FilterAction;        // 过滤动作
  target: FilterTarget;        // 目标类型
  matchMode: MatchMode;        // 匹配模式
  matchValue: string;          // 匹配值（对于DELETE_ALL和KEEP_ALL可为空）
  priority: number;            // 优先级 [0-100]，数字越大优先级越高
  enabled: boolean;            // 是否启用
  description?: string;        // 规则描述
  createdAt: string;           // 创建时间
  updatedAt: string;           // 更新时间
}

/**
 * 规则模板
 */
export interface RuleTemplate {
  id: string;                  // 模板唯一标识
  name: string;                // 模板名称
  description: string;         // 模板描述
  category: string;            // 模板分类
  rules: Omit<FilterRule, 'id' | 'createdAt' | 'updatedAt'>[]; // 模板包含的规则（不包含运行时字段）
  isBuiltIn: boolean;          // 是否为内置模板
}

/**
 * 过滤上下文
 */
export interface FilterContext {
  headers: Record<string, string>;      // 请求头
  queryParams: Record<string, string>;  // 查询参数
  formData: Record<string, string>;     // 表单数据
  jsonBody: any;                        // JSON请求体
  url: string;                          // 原始URL
  method: string;                       // HTTP方法
}

/**
 * 过滤结果
 */
export interface FilterResult {
  headers: Record<string, string>;      // 过滤后的请求头
  queryParams: Record<string, string>;  // 过滤后的查询参数
  formData: Record<string, string>;     // 过滤后的表单数据
  jsonBody: any;                        // 过滤后的JSON请求体
  appliedRules: string[];               // 应用的规则ID列表
  warnings: string[];                   // 警告信息
}

/**
 * 规则验证结果
 */
export interface RuleValidationResult {
  isValid: boolean;            // 是否有效
  errors: string[];            // 错误信息
  warnings: string[];          // 警告信息
}

/**
 * 存储配置
 */
export interface StoredConfig {
  version: string;             // 配置版本，用于迁移
  rules: FilterRule[];         // 用户定义的规则
  activeTemplate?: string;     // 当前激活的模板ID
  settings: {
    autoSave: boolean;         // 自动保存
    showPreview: boolean;      // 显示预览
    enableValidation: boolean; // 启用验证
    defaultPriority: number;   // 默认优先级
  };
  lastModified: string;        // 最后修改时间
}

/**
 * 规则统计信息
 */
export interface RuleStats {
  totalRules: number;          // 总规则数
  enabledRules: number;        // 启用的规则数
  rulesByTarget: Record<FilterTarget, number>; // 按目标类型统计
  rulesByAction: Record<FilterAction, number>; // 按动作类型统计
  averagePriority: number;     // 平均优先级
}

// 常量定义

/**
 * 默认设置
 */
export const DEFAULT_SETTINGS = {
  autoSave: true,
  showPreview: true,
  enableValidation: true,
  defaultPriority: 50
} as const;

/**
 * 优先级范围
 */
export const PRIORITY_RANGE = {
  MIN: 0,
  MAX: 100,
  DEFAULT: 50
} as const;

/**
 * 配置版本
 */
export const CONFIG_VERSION = '1.0.0';

/**
 * 本地存储键名
 */
export const STORAGE_KEYS = {
  CONFIG: 'curl-filter-config',
  BACKUP: 'curl-filter-backup'
} as const;

// 类型守卫函数

/**
 * 检查是否为有效的过滤动作
 */
export function isValidFilterAction(action: string): action is FilterAction {
  return Object.values(FilterAction).includes(action as FilterAction);
}

/**
 * 检查是否为有效的过滤目标
 */
export function isValidFilterTarget(target: string): target is FilterTarget {
  return Object.values(FilterTarget).includes(target as FilterTarget);
}

/**
 * 检查是否为有效的匹配模式
 */
export function isValidMatchMode(mode: string): mode is MatchMode {
  return Object.values(MatchMode).includes(mode as MatchMode);
}

/**
 * 检查是否为有效的优先级
 */
export function isValidPriority(priority: number): boolean {
  return Number.isInteger(priority) && priority >= PRIORITY_RANGE.MIN && priority <= PRIORITY_RANGE.MAX;
}

// 工具类型

/**
 * 创建规则时的输入类型（不包含运行时生成的字段）
 */
export type CreateRuleInput = Omit<FilterRule, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * 更新规则时的输入类型（所有字段都是可选的，除了id）
 */
export type UpdateRuleInput = Partial<Omit<FilterRule, 'id' | 'createdAt'>> & {
  id: string;
  updatedAt?: string;
};

/**
 * 规则导出格式
 */
export type ExportedRule = Omit<FilterRule, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * 规则导入格式
 */
export interface ImportedConfig {
  version?: string;
  rules: ExportedRule[];
  settings?: Partial<StoredConfig['settings']>;
}
