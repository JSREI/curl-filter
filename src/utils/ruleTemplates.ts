// 预设规则模板

import type {
  RuleTemplate,
  FilterRule,
  CreateRuleInput
} from '../types/filterRules';
import {
  FilterAction,
  FilterTarget,
  MatchMode
} from '../types/filterRules';

/**
 * 创建规则模板的辅助函数
 */
function createTemplateRule(input: CreateRuleInput): Omit<FilterRule, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    name: input.name,
    action: input.action,
    target: input.target,
    matchMode: input.matchMode,
    matchValue: input.matchValue,
    priority: input.priority,
    enabled: input.enabled,
    description: input.description
  };
}

/**
 * 认证保留模板
 */
const AUTH_ONLY_TEMPLATE: RuleTemplate = {
  id: 'auth-only',
  name: '仅保留认证信息',
  description: '只保留认证相关的请求头，删除其他所有信息',
  category: 'security',
  isBuiltIn: true,
  rules: [
    createTemplateRule({
      name: '删除所有请求头',
      action: FilterAction.DELETE_ALL,
      target: FilterTarget.HEADERS,
      matchMode: MatchMode.EXACT,
      matchValue: '',
      priority: 10,
      enabled: true,
      description: '先删除所有请求头'
    }),
    createTemplateRule({
      name: '保留Authorization',
      action: FilterAction.KEEP,
      target: FilterTarget.HEADERS,
      matchMode: MatchMode.EXACT,
      matchValue: 'authorization',
      priority: 90,
      enabled: true,
      description: '保留Authorization请求头'
    }),
    createTemplateRule({
      name: '保留Cookie',
      action: FilterAction.KEEP,
      target: FilterTarget.HEADERS,
      matchMode: MatchMode.EXACT,
      matchValue: 'cookie',
      priority: 90,
      enabled: true,
      description: '保留Cookie请求头'
    }),
    createTemplateRule({
      name: '保留API Key相关',
      action: FilterAction.KEEP,
      target: FilterTarget.HEADERS,
      matchMode: MatchMode.CONTAINS,
      matchValue: 'api-key',
      priority: 90,
      enabled: true,
      description: '保留包含api-key的请求头'
    }),
    createTemplateRule({
      name: '保留Token相关',
      action: FilterAction.KEEP,
      target: FilterTarget.HEADERS,
      matchMode: MatchMode.CONTAINS,
      matchValue: 'token',
      priority: 90,
      enabled: true,
      description: '保留包含token的请求头'
    }),
    createTemplateRule({
      name: '保留Content-Type',
      action: FilterAction.KEEP,
      target: FilterTarget.HEADERS,
      matchMode: MatchMode.EXACT,
      matchValue: 'content-type',
      priority: 80,
      enabled: true,
      description: '保留Content-Type请求头'
    })
  ]
};

/**
 * 调试清理模板
 */
const DEBUG_CLEANUP_TEMPLATE: RuleTemplate = {
  id: 'debug-cleanup',
  name: '清理调试信息',
  description: '删除浏览器调试相关的请求头和参数，保留业务相关信息',
  category: 'development',
  isBuiltIn: true,
  rules: [
    createTemplateRule({
      name: '删除User-Agent',
      action: FilterAction.DELETE,
      target: FilterTarget.HEADERS,
      matchMode: MatchMode.EXACT,
      matchValue: 'user-agent',
      priority: 70,
      enabled: true,
      description: '删除浏览器User-Agent'
    }),
    createTemplateRule({
      name: '删除Referer',
      action: FilterAction.DELETE,
      target: FilterTarget.HEADERS,
      matchMode: MatchMode.EXACT,
      matchValue: 'referer',
      priority: 70,
      enabled: true,
      description: '删除Referer请求头'
    }),
    createTemplateRule({
      name: '删除Origin',
      action: FilterAction.DELETE,
      target: FilterTarget.HEADERS,
      matchMode: MatchMode.EXACT,
      matchValue: 'origin',
      priority: 70,
      enabled: true,
      description: '删除Origin请求头'
    }),
    createTemplateRule({
      name: '删除缓存相关',
      action: FilterAction.DELETE,
      target: FilterTarget.HEADERS,
      matchMode: MatchMode.CONTAINS,
      matchValue: 'cache',
      priority: 60,
      enabled: true,
      description: '删除缓存相关请求头'
    }),
    createTemplateRule({
      name: '删除If-None-Match',
      action: FilterAction.DELETE,
      target: FilterTarget.HEADERS,
      matchMode: MatchMode.EXACT,
      matchValue: 'if-none-match',
      priority: 60,
      enabled: true,
      description: '删除If-None-Match请求头'
    }),
    createTemplateRule({
      name: '删除If-Modified-Since',
      action: FilterAction.DELETE,
      target: FilterTarget.HEADERS,
      matchMode: MatchMode.EXACT,
      matchValue: 'if-modified-since',
      priority: 60,
      enabled: true,
      description: '删除If-Modified-Since请求头'
    }),
    createTemplateRule({
      name: '删除调试参数',
      action: FilterAction.DELETE,
      target: FilterTarget.QUERY_PARAMS,
      matchMode: MatchMode.REGEX,
      matchValue: '^(debug|trace|_|__)',
      priority: 50,
      enabled: true,
      description: '删除以debug、trace、_开头的查询参数'
    })
  ]
};

/**
 * API测试模板
 */
const API_TEST_TEMPLATE: RuleTemplate = {
  id: 'api-test',
  name: 'API测试模式',
  description: '保留API测试所需的基本信息，清理浏览器特定信息',
  category: 'testing',
  isBuiltIn: true,
  rules: [
    createTemplateRule({
      name: '保留Content-Type',
      action: FilterAction.KEEP,
      target: FilterTarget.HEADERS,
      matchMode: MatchMode.EXACT,
      matchValue: 'content-type',
      priority: 90,
      enabled: true,
      description: '保留Content-Type请求头'
    }),
    createTemplateRule({
      name: '保留Accept',
      action: FilterAction.KEEP,
      target: FilterTarget.HEADERS,
      matchMode: MatchMode.EXACT,
      matchValue: 'accept',
      priority: 90,
      enabled: true,
      description: '保留Accept请求头'
    }),
    createTemplateRule({
      name: '保留认证信息',
      action: FilterAction.KEEP,
      target: FilterTarget.HEADERS,
      matchMode: MatchMode.REGEX,
      matchValue: '(authorization|cookie|.*token.*|.*key.*)',
      priority: 95,
      enabled: true,
      description: '保留所有认证相关请求头'
    }),
    createTemplateRule({
      name: '删除浏览器标识',
      action: FilterAction.DELETE,
      target: FilterTarget.HEADERS,
      matchMode: MatchMode.REGEX,
      matchValue: '(user-agent|referer|origin|sec-.*)',
      priority: 70,
      enabled: true,
      description: '删除浏览器特定的请求头'
    }),
    createTemplateRule({
      name: '保留所有请求体',
      action: FilterAction.KEEP_ALL,
      target: FilterTarget.JSON_BODY,
      matchMode: MatchMode.EXACT,
      matchValue: '',
      priority: 80,
      enabled: true,
      description: '保留完整的JSON请求体'
    }),
    createTemplateRule({
      name: '保留所有表单数据',
      action: FilterAction.KEEP_ALL,
      target: FilterTarget.FORM_DATA,
      matchMode: MatchMode.EXACT,
      matchValue: '',
      priority: 80,
      enabled: true,
      description: '保留完整的表单数据'
    })
  ]
};

/**
 * 最小化模板
 */
const MINIMAL_TEMPLATE: RuleTemplate = {
  id: 'minimal',
  name: '最小化请求',
  description: '只保留最基本的请求信息，删除所有可选内容',
  category: 'optimization',
  isBuiltIn: true,
  rules: [
    createTemplateRule({
      name: '删除所有请求头',
      action: FilterAction.DELETE_ALL,
      target: FilterTarget.HEADERS,
      matchMode: MatchMode.EXACT,
      matchValue: '',
      priority: 10,
      enabled: true,
      description: '删除所有请求头'
    }),
    createTemplateRule({
      name: '保留Content-Type',
      action: FilterAction.KEEP,
      target: FilterTarget.HEADERS,
      matchMode: MatchMode.EXACT,
      matchValue: 'content-type',
      priority: 90,
      enabled: true,
      description: '只保留Content-Type'
    }),
    createTemplateRule({
      name: '删除所有查询参数',
      action: FilterAction.DELETE_ALL,
      target: FilterTarget.QUERY_PARAMS,
      matchMode: MatchMode.EXACT,
      matchValue: '',
      priority: 50,
      enabled: true,
      description: '删除所有查询参数'
    })
  ]
};

/**
 * 完整保留模板
 */
const KEEP_ALL_TEMPLATE: RuleTemplate = {
  id: 'keep-all',
  name: '完整保留',
  description: '保留所有信息，不做任何过滤（用于对比和调试）',
  category: 'utility',
  isBuiltIn: true,
  rules: [
    createTemplateRule({
      name: '保留所有请求头',
      action: FilterAction.KEEP_ALL,
      target: FilterTarget.HEADERS,
      matchMode: MatchMode.EXACT,
      matchValue: '',
      priority: 100,
      enabled: true,
      description: '保留所有请求头'
    }),
    createTemplateRule({
      name: '保留所有查询参数',
      action: FilterAction.KEEP_ALL,
      target: FilterTarget.QUERY_PARAMS,
      matchMode: MatchMode.EXACT,
      matchValue: '',
      priority: 100,
      enabled: true,
      description: '保留所有查询参数'
    }),
    createTemplateRule({
      name: '保留所有表单数据',
      action: FilterAction.KEEP_ALL,
      target: FilterTarget.FORM_DATA,
      matchMode: MatchMode.EXACT,
      matchValue: '',
      priority: 100,
      enabled: true,
      description: '保留所有表单数据'
    }),
    createTemplateRule({
      name: '保留所有JSON数据',
      action: FilterAction.KEEP_ALL,
      target: FilterTarget.JSON_BODY,
      matchMode: MatchMode.EXACT,
      matchValue: '',
      priority: 100,
      enabled: true,
      description: '保留所有JSON请求体'
    })
  ]
};

/**
 * 所有内置模板
 */
export const BUILT_IN_TEMPLATES: RuleTemplate[] = [
  AUTH_ONLY_TEMPLATE,
  DEBUG_CLEANUP_TEMPLATE,
  API_TEST_TEMPLATE,
  MINIMAL_TEMPLATE,
  KEEP_ALL_TEMPLATE
];

/**
 * 根据ID获取模板
 */
export function getTemplateById(id: string): RuleTemplate | undefined {
  return BUILT_IN_TEMPLATES.find(template => template.id === id);
}

/**
 * 根据分类获取模板
 */
export function getTemplatesByCategory(category: string): RuleTemplate[] {
  return BUILT_IN_TEMPLATES.filter(template => template.category === category);
}

/**
 * 获取所有模板分类
 */
export function getTemplateCategories(): string[] {
  const categories = new Set(BUILT_IN_TEMPLATES.map(template => template.category));
  return Array.from(categories);
}
