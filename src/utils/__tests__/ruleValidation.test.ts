import { describe, it, expect } from 'vitest'
import { validateRule, validateRuleField } from '../ruleValidation'
import type { FilterRule } from '../../types/filterRules'

describe('ruleValidation', () => {
  const createValidRule = (overrides: Partial<FilterRule> = {}): FilterRule => ({
    id: 'test-rule',
    name: 'Test Rule',
    action: 'delete',
    target: 'headers',
    matchMode: 'exact',
    matchValue: 'user-agent',
    priority: 50,
    enabled: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    ...overrides
  })

  describe('validateRule', () => {
    it('should validate a correct rule', () => {
      const rule = createValidRule()
      const result = validateRule(rule)
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toEqual([])
    })

    it('should require rule name', () => {
      const rule = createValidRule({ name: '' })
      const result = validateRule(rule)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('规则名称不能为空')
    })

    it('should require match value for delete action', () => {
      const rule = createValidRule({ 
        action: 'delete',
        matchValue: '' 
      })
      const result = validateRule(rule)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('该动作类型需要指定匹配值')
    })

    it('should require match value for keep action', () => {
      const rule = createValidRule({ 
        action: 'keep',
        matchValue: '' 
      })
      const result = validateRule(rule)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('该动作类型需要指定匹配值')
    })

    it('should not require match value for delete_all action', () => {
      const rule = createValidRule({ 
        action: 'delete_all',
        matchValue: '' 
      })
      const result = validateRule(rule)
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toEqual([])
    })

    it('should not require match value for keep_all action', () => {
      const rule = createValidRule({ 
        action: 'keep_all',
        matchValue: '' 
      })
      const result = validateRule(rule)
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toEqual([])
    })

    it('should validate regex match mode', () => {
      const rule = createValidRule({
        matchMode: 'regex',
        matchValue: '[invalid regex'
      })
      const result = validateRule(rule)

      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.errors.some(error => error.includes('正则表达式'))).toBe(true)
    })

    it('should accept valid regex', () => {
      const rule = createValidRule({ 
        matchMode: 'regex',
        matchValue: '^user-.*'
      })
      const result = validateRule(rule)
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toEqual([])
    })

    it('should validate priority range', () => {
      const lowPriorityRule = createValidRule({ priority: -1 })
      const highPriorityRule = createValidRule({ priority: 101 })
      
      expect(validateRule(lowPriorityRule).isValid).toBe(false)
      expect(validateRule(highPriorityRule).isValid).toBe(false)
      
      const validRule = createValidRule({ priority: 50 })
      expect(validateRule(validRule).isValid).toBe(true)
    })

    it('should validate multiple errors', () => {
      const rule = createValidRule({
        name: '',
        matchValue: '',
        priority: -1
      })
      const result = validateRule(rule)

      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(3)
      expect(result.errors).toContain('规则名称不能为空')
      expect(result.errors).toContain('该动作类型需要指定匹配值')
      expect(result.errors.some(error => error.includes('优先级'))).toBe(true)
    })
  })

  describe('validateRuleField', () => {
    it('should validate name field', () => {
      expect(validateRuleField('name', '')).toContain('规则名称不能为空')
      expect(validateRuleField('name', 'Valid Name')).toEqual([])
    })

    it('should validate matchValue field for delete action', () => {
      const rule = createValidRule({ action: 'delete' })
      
      expect(validateRuleField('matchValue', '', rule)).toContain('该动作类型需要指定匹配值')
      expect(validateRuleField('matchValue', 'value', rule)).toEqual([])
    })

    it('should not validate matchValue for delete_all action', () => {
      const rule = createValidRule({ action: 'delete_all' })
      
      expect(validateRuleField('matchValue', '', rule)).toEqual([])
    })

    it('should validate regex matchValue', () => {
      const rule = createValidRule({ matchMode: 'regex' })
      
      expect(validateRuleField('matchValue', '[invalid', rule)).toContain('正则表达式格式无效')
      expect(validateRuleField('matchValue', '^valid.*', rule)).toEqual([])
    })

    it('should validate priority field', () => {
      expect(validateRuleField('priority', -1)).toContain('优先级必须在0-100之间')
      expect(validateRuleField('priority', 101)).toContain('优先级必须在0-100之间')
      expect(validateRuleField('priority', 50)).toEqual([])
    })

    it('should return empty array for unknown fields', () => {
      expect(validateRuleField('unknownField' as any, 'value')).toEqual([])
    })

    it('should handle edge cases', () => {
      // Test with null/undefined values
      expect(validateRuleField('name', null as any)).toContain('规则名称不能为空')
      expect(validateRuleField('name', undefined as any)).toContain('规则名称不能为空')
      
      // Test with whitespace-only name
      expect(validateRuleField('name', '   ')).toContain('规则名称不能为空')
    })
  })

  describe('complex validation scenarios', () => {
    it('should validate rule with all fields', () => {
      const rule = createValidRule({
        name: 'Complex Rule',
        description: 'A complex validation test',
        action: 'delete',
        target: 'headers',
        matchMode: 'regex',
        matchValue: '^x-custom-.*',
        priority: 75,
        enabled: true
      })
      
      const result = validateRule(rule)
      expect(result.isValid).toBe(true)
      expect(result.errors).toEqual([])
    })

    it('should validate rule for each target type', () => {
      const targets = ['headers', 'query_params', 'form_data', 'json_body'] as const
      
      targets.forEach(target => {
        const rule = createValidRule({ target })
        const result = validateRule(rule)
        expect(result.isValid).toBe(true)
      })
    })

    it('should validate rule for each match mode', () => {
      const matchModes = ['exact', 'contains', 'starts_with', 'ends_with', 'regex'] as const
      
      matchModes.forEach(matchMode => {
        const matchValue = matchMode === 'regex' ? '^test.*' : 'test'
        const rule = createValidRule({ matchMode, matchValue })
        const result = validateRule(rule)
        expect(result.isValid).toBe(true)
      })
    })

    it('should validate rule for each action type', () => {
      const actions = ['delete', 'delete_all', 'keep', 'keep_all'] as const
      
      actions.forEach(action => {
        const matchValue = action.includes('_all') ? '' : 'test'
        const rule = createValidRule({ action, matchValue })
        const result = validateRule(rule)
        expect(result.isValid).toBe(true)
      })
    })
  })
})
