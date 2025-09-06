// 规则验证工具函数

import type {
  FilterRule,
  RuleValidationResult
} from '../types/filterRules';
import {
  FilterAction,
  FilterTarget,
  MatchMode,
  isValidFilterAction,
  isValidFilterTarget,
  isValidMatchMode,
  isValidPriority,
  PRIORITY_RANGE
} from '../types/filterRules';

/**
 * 验证单个规则
 */
export function validateRule(rule: Partial<FilterRule>): RuleValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 验证必填字段
  if (!rule.name || rule.name.trim() === '') {
    errors.push('规则名称不能为空');
  }

  if (!rule.action) {
    errors.push('必须选择过滤动作');
  } else if (!isValidFilterAction(rule.action)) {
    errors.push('无效的过滤动作');
  }

  if (!rule.target) {
    errors.push('必须选择过滤目标');
  } else if (!isValidFilterTarget(rule.target)) {
    errors.push('无效的过滤目标');
  }

  if (!rule.matchMode) {
    errors.push('必须选择匹配模式');
  } else if (!isValidMatchMode(rule.matchMode)) {
    errors.push('无效的匹配模式');
  }

  // 验证优先级
  if (rule.priority === undefined || rule.priority === null) {
    errors.push('必须设置优先级');
  } else if (!isValidPriority(rule.priority)) {
    errors.push(`优先级必须在 ${PRIORITY_RANGE.MIN} 到 ${PRIORITY_RANGE.MAX} 之间`);
  }

  // 验证匹配值
  if (rule.action && rule.matchValue !== undefined) {
    const needsMatchValue = rule.action === FilterAction.DELETE || rule.action === FilterAction.KEEP;
    const hasMatchValue = rule.matchValue && rule.matchValue.trim() !== '';

    if (needsMatchValue && !hasMatchValue) {
      errors.push('该动作类型需要指定匹配值');
    } else if (!needsMatchValue && hasMatchValue) {
      warnings.push('该动作类型不需要匹配值，将被忽略');
    }
  }

  // 验证正则表达式
  if (rule.matchMode === MatchMode.REGEX && rule.matchValue) {
    try {
      new RegExp(rule.matchValue);
    } catch (e) {
      errors.push('无效的正则表达式: ' + (e as Error).message);
    }
  }

  // 验证规则名称长度
  if (rule.name && rule.name.length > 50) {
    warnings.push('规则名称过长，建议不超过50个字符');
  }

  // 验证描述长度
  if (rule.description && rule.description.length > 200) {
    warnings.push('规则描述过长，建议不超过200个字符');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * 验证规则列表
 */
export function validateRules(rules: FilterRule[]): RuleValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 检查规则ID唯一性
  const ids = new Set<string>();
  const duplicateIds = new Set<string>();

  rules.forEach((rule, index) => {
    if (ids.has(rule.id)) {
      duplicateIds.add(rule.id);
    } else {
      ids.add(rule.id);
    }

    // 验证单个规则
    const ruleValidation = validateRule(rule);
    if (!ruleValidation.isValid) {
      errors.push(`规则 ${index + 1} (${rule.name || '未命名'}): ${ruleValidation.errors.join(', ')}`);
    }
    if (ruleValidation.warnings.length > 0) {
      warnings.push(`规则 ${index + 1} (${rule.name || '未命名'}): ${ruleValidation.warnings.join(', ')}`);
    }
  });

  // 报告重复ID
  if (duplicateIds.size > 0) {
    errors.push(`发现重复的规则ID: ${Array.from(duplicateIds).join(', ')}`);
  }

  // 检查规则冲突
  const conflicts = detectRuleConflicts(rules);
  if (conflicts.length > 0) {
    warnings.push(...conflicts);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * 检测规则冲突
 */
export function detectRuleConflicts(rules: FilterRule[]): string[] {
  const warnings: string[] = [];
  const enabledRules = rules.filter(rule => rule.enabled);

  // 按目标类型分组
  const rulesByTarget = new Map<FilterTarget, FilterRule[]>();
  enabledRules.forEach(rule => {
    if (!rulesByTarget.has(rule.target)) {
      rulesByTarget.set(rule.target, []);
    }
    rulesByTarget.get(rule.target)!.push(rule);
  });

  // 检查每个目标类型的规则冲突
  rulesByTarget.forEach((targetRules, target) => {
    const sortedRules = targetRules.sort((a, b) => b.priority - a.priority);

    // 检查DELETE_ALL和KEEP_ALL的冲突
    const deleteAllRules = sortedRules.filter(r => r.action === FilterAction.DELETE_ALL);
    const keepAllRules = sortedRules.filter(r => r.action === FilterAction.KEEP_ALL);

    if (deleteAllRules.length > 1) {
      warnings.push(`${getTargetDisplayName(target)}存在多个"删除全部"规则，只有优先级最高的会生效`);
    }

    if (keepAllRules.length > 1) {
      warnings.push(`${getTargetDisplayName(target)}存在多个"保留全部"规则，只有优先级最高的会生效`);
    }

    if (deleteAllRules.length > 0 && keepAllRules.length > 0) {
      const highestDeleteAll = deleteAllRules[0];
      const highestKeepAll = keepAllRules[0];
      
      if (highestDeleteAll.priority > highestKeepAll.priority) {
        warnings.push(`${getTargetDisplayName(target)}的"删除全部"规则优先级高于"保留全部"规则，所有项目都会被删除`);
      } else if (highestKeepAll.priority > highestDeleteAll.priority) {
        warnings.push(`${getTargetDisplayName(target)}的"保留全部"规则优先级高于"删除全部"规则，所有项目都会被保留`);
      } else {
        warnings.push(`${getTargetDisplayName(target)}的"删除全部"和"保留全部"规则优先级相同，可能产生不可预期的结果`);
      }
    }

    // 检查具体规则是否会被全局规则覆盖
    const globalRules = sortedRules.filter(r => 
      r.action === FilterAction.DELETE_ALL || r.action === FilterAction.KEEP_ALL
    );
    const specificRules = sortedRules.filter(r => 
      r.action === FilterAction.DELETE || r.action === FilterAction.KEEP
    );

    if (globalRules.length > 0 && specificRules.length > 0) {
      const highestGlobal = globalRules[0];
      const affectedSpecific = specificRules.filter(r => r.priority <= highestGlobal.priority);
      
      if (affectedSpecific.length > 0) {
        warnings.push(`${getTargetDisplayName(target)}的${affectedSpecific.length}个具体规则会被全局规则"${highestGlobal.name}"覆盖`);
      }
    }
  });

  return warnings;
}

/**
 * 获取目标类型的显示名称
 */
function getTargetDisplayName(target: FilterTarget): string {
  const displayNames = {
    [FilterTarget.HEADERS]: '请求头',
    [FilterTarget.QUERY_PARAMS]: '查询参数',
    [FilterTarget.FORM_DATA]: '表单数据',
    [FilterTarget.JSON_BODY]: 'JSON请求体'
  };
  return displayNames[target];
}

/**
 * 生成规则ID
 */
export function generateRuleId(): string {
  return 'rule_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

/**
 * 创建默认规则
 */
export function createDefaultRule(overrides: Partial<FilterRule> = {}): FilterRule {
  const now = new Date().toISOString();
  
  return {
    id: generateRuleId(),
    name: '新规则',
    action: FilterAction.DELETE,
    target: FilterTarget.HEADERS,
    matchMode: MatchMode.EXACT,
    matchValue: '',
    priority: PRIORITY_RANGE.DEFAULT,
    enabled: true,
    description: '',
    createdAt: now,
    updatedAt: now,
    ...overrides
  };
}

/**
 * 克隆规则
 */
export function cloneRule(rule: FilterRule, namePrefix: string = '副本 - '): FilterRule {
  const now = new Date().toISOString();
  
  return {
    ...rule,
    id: generateRuleId(),
    name: namePrefix + rule.name,
    createdAt: now,
    updatedAt: now
  };
}

/**
 * 更新规则时间戳
 */
export function updateRuleTimestamp(rule: FilterRule): FilterRule {
  return {
    ...rule,
    updatedAt: new Date().toISOString()
  };
}
