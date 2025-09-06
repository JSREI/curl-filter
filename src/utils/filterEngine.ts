// 过滤规则引擎核心逻辑

import type {
  FilterRule,
  FilterContext,
  FilterResult
} from '../types/filterRules';
import {
  FilterAction,
  FilterTarget,
  MatchMode
} from '../types/filterRules';

/**
 * 过滤规则引擎
 */
export class FilterEngine {
  private rules: FilterRule[];

  constructor(rules: FilterRule[] = []) {
    this.rules = rules;
  }

  /**
   * 设置规则
   */
  setRules(rules: FilterRule[]): void {
    this.rules = rules;
  }

  /**
   * 应用过滤规则
   */
  applyFilters(context: FilterContext): FilterResult {
    const result: FilterResult = {
      headers: { ...context.headers },
      queryParams: { ...context.queryParams },
      formData: { ...context.formData },
      jsonBody: context.jsonBody ? JSON.parse(JSON.stringify(context.jsonBody)) : null,
      appliedRules: [],
      warnings: []
    };

    // 获取启用的规则并按优先级排序（优先级高的先执行）
    const enabledRules = this.rules
      .filter(rule => rule.enabled)
      .sort((a, b) => b.priority - a.priority);

    // 按目标类型分组处理
    const rulesByTarget = this.groupRulesByTarget(enabledRules);

    // 处理每种目标类型
    Object.entries(rulesByTarget).forEach(([target, targetRules]) => {
      switch (target as FilterTarget) {
        case FilterTarget.HEADERS:
          this.applyHeaderRules(result, targetRules);
          break;
        case FilterTarget.QUERY_PARAMS:
          this.applyQueryParamRules(result, targetRules);
          break;
        case FilterTarget.FORM_DATA:
          this.applyFormDataRules(result, targetRules);
          break;
        case FilterTarget.JSON_BODY:
          this.applyJsonBodyRules(result, targetRules);
          break;
      }
    });

    return result;
  }

  /**
   * 按目标类型分组规则
   */
  private groupRulesByTarget(rules: FilterRule[]): Record<FilterTarget, FilterRule[]> {
    const grouped: Record<FilterTarget, FilterRule[]> = {
      [FilterTarget.HEADERS]: [],
      [FilterTarget.QUERY_PARAMS]: [],
      [FilterTarget.FORM_DATA]: [],
      [FilterTarget.JSON_BODY]: []
    };

    rules.forEach(rule => {
      grouped[rule.target].push(rule);
    });

    return grouped;
  }

  /**
   * 应用请求头规则
   */
  private applyHeaderRules(result: FilterResult, rules: FilterRule[]): void {
    const originalHeaders = { ...result.headers };
    
    // 先处理全局规则（DELETE_ALL, KEEP_ALL）
    const globalRules = rules.filter(r => 
      r.action === FilterAction.DELETE_ALL || r.action === FilterAction.KEEP_ALL
    );
    
    if (globalRules.length > 0) {
      const highestGlobalRule = globalRules[0]; // 已按优先级排序
      
      if (highestGlobalRule.action === FilterAction.DELETE_ALL) {
        result.headers = {};
        result.appliedRules.push(highestGlobalRule.id);
      } else if (highestGlobalRule.action === FilterAction.KEEP_ALL) {
        // 保留所有，不做任何操作
        result.appliedRules.push(highestGlobalRule.id);
      }
    }

    // 再处理具体规则（DELETE, KEEP）
    const specificRules = rules.filter(r => 
      r.action === FilterAction.DELETE || r.action === FilterAction.KEEP
    );

    specificRules.forEach(rule => {
      const matchingKeys = this.findMatchingKeys(Object.keys(originalHeaders), rule);
      
      if (matchingKeys.length > 0) {
        matchingKeys.forEach(key => {
          if (rule.action === FilterAction.DELETE) {
            delete result.headers[key];
          } else if (rule.action === FilterAction.KEEP) {
            result.headers[key] = originalHeaders[key];
          }
        });
        result.appliedRules.push(rule.id);
      }
    });
  }

  /**
   * 应用查询参数规则
   */
  private applyQueryParamRules(result: FilterResult, rules: FilterRule[]): void {
    const originalParams = { ...result.queryParams };
    
    // 处理全局规则
    const globalRules = rules.filter(r => 
      r.action === FilterAction.DELETE_ALL || r.action === FilterAction.KEEP_ALL
    );
    
    if (globalRules.length > 0) {
      const highestGlobalRule = globalRules[0];
      
      if (highestGlobalRule.action === FilterAction.DELETE_ALL) {
        result.queryParams = {};
        result.appliedRules.push(highestGlobalRule.id);
      } else if (highestGlobalRule.action === FilterAction.KEEP_ALL) {
        result.appliedRules.push(highestGlobalRule.id);
      }
    }

    // 处理具体规则
    const specificRules = rules.filter(r => 
      r.action === FilterAction.DELETE || r.action === FilterAction.KEEP
    );

    specificRules.forEach(rule => {
      const matchingKeys = this.findMatchingKeys(Object.keys(originalParams), rule);
      
      if (matchingKeys.length > 0) {
        matchingKeys.forEach(key => {
          if (rule.action === FilterAction.DELETE) {
            delete result.queryParams[key];
          } else if (rule.action === FilterAction.KEEP) {
            result.queryParams[key] = originalParams[key];
          }
        });
        result.appliedRules.push(rule.id);
      }
    });
  }

  /**
   * 应用表单数据规则
   */
  private applyFormDataRules(result: FilterResult, rules: FilterRule[]): void {
    const originalFormData = { ...result.formData };
    
    // 处理全局规则
    const globalRules = rules.filter(r => 
      r.action === FilterAction.DELETE_ALL || r.action === FilterAction.KEEP_ALL
    );
    
    if (globalRules.length > 0) {
      const highestGlobalRule = globalRules[0];
      
      if (highestGlobalRule.action === FilterAction.DELETE_ALL) {
        result.formData = {};
        result.appliedRules.push(highestGlobalRule.id);
      } else if (highestGlobalRule.action === FilterAction.KEEP_ALL) {
        result.appliedRules.push(highestGlobalRule.id);
      }
    }

    // 处理具体规则
    const specificRules = rules.filter(r => 
      r.action === FilterAction.DELETE || r.action === FilterAction.KEEP
    );

    specificRules.forEach(rule => {
      const matchingKeys = this.findMatchingKeys(Object.keys(originalFormData), rule);
      
      if (matchingKeys.length > 0) {
        matchingKeys.forEach(key => {
          if (rule.action === FilterAction.DELETE) {
            delete result.formData[key];
          } else if (rule.action === FilterAction.KEEP) {
            result.formData[key] = originalFormData[key];
          }
        });
        result.appliedRules.push(rule.id);
      }
    });
  }

  /**
   * 应用JSON请求体规则
   */
  private applyJsonBodyRules(result: FilterResult, rules: FilterRule[]): void {
    if (!result.jsonBody || typeof result.jsonBody !== 'object') {
      return;
    }

    const originalJsonBody = JSON.parse(JSON.stringify(result.jsonBody));
    
    // 处理全局规则
    const globalRules = rules.filter(r => 
      r.action === FilterAction.DELETE_ALL || r.action === FilterAction.KEEP_ALL
    );
    
    if (globalRules.length > 0) {
      const highestGlobalRule = globalRules[0];
      
      if (highestGlobalRule.action === FilterAction.DELETE_ALL) {
        result.jsonBody = {};
        result.appliedRules.push(highestGlobalRule.id);
      } else if (highestGlobalRule.action === FilterAction.KEEP_ALL) {
        result.appliedRules.push(highestGlobalRule.id);
      }
    }

    // 处理具体规则
    const specificRules = rules.filter(r => 
      r.action === FilterAction.DELETE || r.action === FilterAction.KEEP
    );

    specificRules.forEach(rule => {
      const matchingKeys = this.findMatchingKeys(Object.keys(originalJsonBody), rule);
      
      if (matchingKeys.length > 0) {
        matchingKeys.forEach(key => {
          if (rule.action === FilterAction.DELETE) {
            delete result.jsonBody[key];
          } else if (rule.action === FilterAction.KEEP) {
            result.jsonBody[key] = originalJsonBody[key];
          }
        });
        result.appliedRules.push(rule.id);
      }
    });
  }

  /**
   * 根据规则查找匹配的键
   */
  private findMatchingKeys(keys: string[], rule: FilterRule): string[] {
    if (!rule.matchValue && (rule.action === FilterAction.DELETE || rule.action === FilterAction.KEEP)) {
      return [];
    }

    return keys.filter(key => this.isMatch(key, rule.matchValue, rule.matchMode));
  }

  /**
   * 检查是否匹配
   */
  private isMatch(value: string, pattern: string, mode: MatchMode): boolean {
    if (!pattern) return false;

    switch (mode) {
      case MatchMode.EXACT:
        return value === pattern;
      
      case MatchMode.CONTAINS:
        return value.toLowerCase().includes(pattern.toLowerCase());
      
      case MatchMode.STARTS_WITH:
        return value.toLowerCase().startsWith(pattern.toLowerCase());
      
      case MatchMode.ENDS_WITH:
        return value.toLowerCase().endsWith(pattern.toLowerCase());
      
      case MatchMode.REGEX:
        try {
          const regex = new RegExp(pattern, 'i');
          return regex.test(value);
        } catch {
          return false;
        }
      
      default:
        return false;
    }
  }
}

/**
 * 创建过滤引擎实例
 */
export function createFilterEngine(rules: FilterRule[] = []): FilterEngine {
  return new FilterEngine(rules);
}
