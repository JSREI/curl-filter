import { test, expect } from '@playwright/test';
import { CurlFilterPage } from '../page-objects/CurlFilterPage';
import { RuleManagerPage } from '../page-objects/RuleManagerPage';
import { FILTER_RULES_TEST_DATA } from '../utils/test-data';
import { takeScreenshot, clearBrowserStorage } from '../utils/test-helpers';

test.describe('过滤规则管理测试', () => {
  let curlFilterPage: CurlFilterPage;
  let ruleManagerPage: RuleManagerPage;

  test.beforeEach(async ({ page }) => {
    curlFilterPage = new CurlFilterPage(page);
    ruleManagerPage = new RuleManagerPage(page);
    await clearBrowserStorage(page);
    await curlFilterPage.goto();
  });

  test.describe('规则管理界面', () => {
    test('应该能够打开规则管理对话框', async ({ page }) => {
      // 打开规则管理
      await curlFilterPage.openRuleManager();
      
      // 检查对话框是否打开
      await ruleManagerPage.waitForLoad();
      
      // 检查标签页是否存在
      await expect(page.locator(ruleManagerPage.selectors.rulesTab)).toBeVisible();
      await expect(page.locator(ruleManagerPage.selectors.templatesTab)).toBeVisible();
    });

    test('应该显示规则列表', async ({ page }) => {
      // 打开规则管理
      await curlFilterPage.openRuleManager();
      await ruleManagerPage.waitForLoad();
      
      // 切换到规则标签页
      await ruleManagerPage.switchToRulesTab();
      
      // 检查规则列表是否存在
      await expect(page.locator(ruleManagerPage.selectors.rulesList)).toBeVisible();
      
      // 检查添加规则按钮是否存在
      await expect(page.locator(ruleManagerPage.selectors.addRuleButton)).toBeVisible();
    });

    test('应该显示模板列表', async ({ page }) => {
      // 打开规则管理
      await curlFilterPage.openRuleManager();
      await ruleManagerPage.waitForLoad();
      
      // 切换到模板标签页
      await ruleManagerPage.switchToTemplatesTab();
      
      // 检查模板列表是否存在
      await expect(page.locator(ruleManagerPage.selectors.templatesList)).toBeVisible();
      
      // 检查是否有内置模板
      const templatesCount = await ruleManagerPage.getTemplatesCount();
      expect(templatesCount).toBeGreaterThan(0);
    });
  });

  test.describe('规则CRUD操作', () => {
    test('应该能够创建新规则', async ({ page }) => {
      // 打开规则管理
      await curlFilterPage.openRuleManager();
      await ruleManagerPage.waitForLoad();
      
      // 添加新规则
      await ruleManagerPage.addNewRule();
      
      // 填写规则表单
      const newRule = {
        name: '测试规则',
        description: '这是一个测试规则',
        action: 'delete',
        target: 'headers',
        matchMode: 'exact',
        matchValue: 'user-agent',
        priority: 50,
        enabled: true
      };
      
      await ruleManagerPage.fillRuleForm(newRule);
      
      // 保存规则
      await ruleManagerPage.saveRule();
      
      // 检查成功消息
      const successMessage = await ruleManagerPage.getSuccessMessage();
      expect(successMessage).toBeTruthy();
      
      // 检查规则是否出现在列表中
      const ruleIndex = await ruleManagerPage.findRuleByName(newRule.name);
      expect(ruleIndex).toBeGreaterThanOrEqual(0);
    });

    test('应该能够编辑现有规则', async ({ page }) => {
      // 先创建一个规则
      await curlFilterPage.openRuleManager();
      await ruleManagerPage.waitForLoad();
      await ruleManagerPage.addNewRule();
      
      const originalRule = {
        name: '原始规则',
        description: '原始描述',
        action: 'delete',
        target: 'headers',
        matchMode: 'exact',
        matchValue: 'user-agent',
        priority: 50,
        enabled: true
      };
      
      await ruleManagerPage.fillRuleForm(originalRule);
      await ruleManagerPage.saveRule();
      
      // 编辑规则
      const ruleIndex = await ruleManagerPage.findRuleByName(originalRule.name);
      await ruleManagerPage.editRule(ruleIndex);
      
      // 修改规则内容
      const updatedRule = {
        name: '更新后的规则',
        description: '更新后的描述',
        action: 'keep',
        target: 'headers',
        matchMode: 'contains',
        matchValue: 'auth',
        priority: 80,
        enabled: false
      };
      
      await ruleManagerPage.fillRuleForm(updatedRule);
      await ruleManagerPage.saveRule();
      
      // 检查规则是否更新
      const updatedIndex = await ruleManagerPage.findRuleByName(updatedRule.name);
      expect(updatedIndex).toBeGreaterThanOrEqual(0);
      
      const ruleData = await ruleManagerPage.getRuleByIndex(updatedIndex);
      expect(ruleData.name).toBe(updatedRule.name);
      expect(ruleData.enabled).toBe(updatedRule.enabled);
    });

    test('应该能够删除规则', async ({ page }) => {
      // 先创建一个规则
      await curlFilterPage.openRuleManager();
      await ruleManagerPage.waitForLoad();
      await ruleManagerPage.addNewRule();
      
      const testRule = {
        name: '待删除规则',
        description: '这个规则将被删除',
        action: 'delete',
        target: 'headers',
        matchMode: 'exact',
        matchValue: 'test-header',
        priority: 50,
        enabled: true
      };
      
      await ruleManagerPage.fillRuleForm(testRule);
      await ruleManagerPage.saveRule();
      
      // 删除规则
      const ruleIndex = await ruleManagerPage.findRuleByName(testRule.name);
      await ruleManagerPage.deleteRule(ruleIndex);
      
      // 检查规则是否被删除
      const deletedIndex = await ruleManagerPage.findRuleByName(testRule.name);
      expect(deletedIndex).toBe(-1);
    });

    test('应该能够启用/禁用规则', async ({ page }) => {
      // 先创建一个启用的规则
      await curlFilterPage.openRuleManager();
      await ruleManagerPage.waitForLoad();
      await ruleManagerPage.addNewRule();
      
      const testRule = {
        name: '切换状态规则',
        description: '用于测试启用/禁用',
        action: 'delete',
        target: 'headers',
        matchMode: 'exact',
        matchValue: 'test-header',
        priority: 50,
        enabled: true
      };
      
      await ruleManagerPage.fillRuleForm(testRule);
      await ruleManagerPage.saveRule();
      
      // 获取规则索引
      const ruleIndex = await ruleManagerPage.findRuleByName(testRule.name);
      
      // 检查初始状态
      let ruleData = await ruleManagerPage.getRuleByIndex(ruleIndex);
      expect(ruleData.enabled).toBe(true);
      
      // 禁用规则
      await ruleManagerPage.toggleRuleEnabled(ruleIndex);
      
      // 检查状态是否改变
      ruleData = await ruleManagerPage.getRuleByIndex(ruleIndex);
      expect(ruleData.enabled).toBe(false);
      
      // 重新启用规则
      await ruleManagerPage.toggleRuleEnabled(ruleIndex);
      
      // 检查状态是否恢复
      ruleData = await ruleManagerPage.getRuleByIndex(ruleIndex);
      expect(ruleData.enabled).toBe(true);
    });
  });

  test.describe('规则验证', () => {
    test('应该验证规则名称不能为空', async ({ page }) => {
      // 打开规则管理
      await curlFilterPage.openRuleManager();
      await ruleManagerPage.waitForLoad();
      await ruleManagerPage.addNewRule();
      
      // 填写空名称的规则
      const invalidRule = {
        name: '', // 空名称
        description: '测试描述',
        action: 'delete',
        target: 'headers',
        matchMode: 'exact',
        matchValue: 'test-header',
        priority: 50,
        enabled: true
      };
      
      await ruleManagerPage.fillRuleForm(invalidRule);
      await ruleManagerPage.saveRule();
      
      // 检查错误消息
      const errorMessage = await ruleManagerPage.getErrorMessage();
      expect(errorMessage).toBeTruthy();
      expect(errorMessage).toContain('名称');
    });

    test('应该验证匹配值格式', async ({ page }) => {
      // 打开规则管理
      await curlFilterPage.openRuleManager();
      await ruleManagerPage.waitForLoad();
      await ruleManagerPage.addNewRule();
      
      // 填写无效正则表达式的规则
      const invalidRule = {
        name: '无效正则规则',
        description: '测试无效正则',
        action: 'delete',
        target: 'headers',
        matchMode: 'regex',
        matchValue: '[invalid regex', // 无效正则
        priority: 50,
        enabled: true
      };
      
      await ruleManagerPage.fillRuleForm(invalidRule);
      await ruleManagerPage.saveRule();
      
      // 检查错误消息
      const errorMessage = await ruleManagerPage.getErrorMessage();
      expect(errorMessage).toBeTruthy();
    });

    test('应该验证优先级范围', async ({ page }) => {
      // 打开规则管理
      await curlFilterPage.openRuleManager();
      await ruleManagerPage.waitForLoad();
      await ruleManagerPage.addNewRule();
      
      // 填写超出范围的优先级
      const invalidRule = {
        name: '无效优先级规则',
        description: '测试无效优先级',
        action: 'delete',
        target: 'headers',
        matchMode: 'exact',
        matchValue: 'test-header',
        priority: 150, // 超出范围
        enabled: true
      };
      
      await ruleManagerPage.fillRuleForm(invalidRule);
      await ruleManagerPage.saveRule();
      
      // 检查错误消息或警告
      const errorMessage = await ruleManagerPage.getErrorMessage();
      expect(errorMessage).toBeTruthy();
    });
  });

  test.describe('模板应用', () => {
    test('应该能够应用内置模板', async ({ page }) => {
      // 打开规则管理
      await curlFilterPage.openRuleManager();
      await ruleManagerPage.waitForLoad();
      
      // 切换到模板标签页
      await ruleManagerPage.switchToTemplatesTab();
      
      // 获取初始规则数量
      await ruleManagerPage.switchToRulesTab();
      const initialCount = await ruleManagerPage.getRulesCount();
      
      // 应用第一个模板
      await ruleManagerPage.switchToTemplatesTab();
      await ruleManagerPage.applyTemplate(0);
      
      // 检查规则数量是否增加
      await ruleManagerPage.switchToRulesTab();
      const newCount = await ruleManagerPage.getRulesCount();
      expect(newCount).toBeGreaterThan(initialCount);
      
      // 检查成功消息
      const successMessage = await ruleManagerPage.getSuccessMessage();
      expect(successMessage).toBeTruthy();
    });
  });

  test.describe('批量操作', () => {
    test('应该能够批量选择规则', async ({ page }) => {
      // 先创建几个规则
      await curlFilterPage.openRuleManager();
      await ruleManagerPage.waitForLoad();
      
      // 创建3个测试规则
      for (let i = 0; i < 3; i++) {
        await ruleManagerPage.addNewRule();
        
        const testRule = {
          name: `批量测试规则${i + 1}`,
          description: `批量测试规则${i + 1}的描述`,
          action: 'delete',
          target: 'headers',
          matchMode: 'exact',
          matchValue: `test-header-${i + 1}`,
          priority: 50,
          enabled: true
        };
        
        await ruleManagerPage.fillRuleForm(testRule);
        await ruleManagerPage.saveRule();
      }
      
      // 全选规则
      await ruleManagerPage.selectAllRules();
      
      // 检查全选按钮状态
      const selectAllCheckbox = page.locator(ruleManagerPage.selectors.selectAllCheckbox);
      expect(await selectAllCheckbox.isChecked()).toBe(true);
    });

    test('应该能够批量删除规则', async ({ page }) => {
      // 先创建几个规则
      await curlFilterPage.openRuleManager();
      await ruleManagerPage.waitForLoad();
      
      // 创建2个测试规则
      for (let i = 0; i < 2; i++) {
        await ruleManagerPage.addNewRule();
        
        const testRule = {
          name: `批量删除规则${i + 1}`,
          description: `将被批量删除的规则${i + 1}`,
          action: 'delete',
          target: 'headers',
          matchMode: 'exact',
          matchValue: `delete-header-${i + 1}`,
          priority: 50,
          enabled: true
        };
        
        await ruleManagerPage.fillRuleForm(testRule);
        await ruleManagerPage.saveRule();
      }
      
      // 获取初始规则数量
      const initialCount = await ruleManagerPage.getRulesCount();
      
      // 选择前两个规则
      await ruleManagerPage.selectRule(0);
      await ruleManagerPage.selectRule(1);
      
      // 批量删除
      await ruleManagerPage.batchDeleteRules();
      
      // 检查规则数量是否减少
      const newCount = await ruleManagerPage.getRulesCount();
      expect(newCount).toBeLessThan(initialCount);
    });

    test('应该能够批量启用/禁用规则', async ({ page }) => {
      // 先创建几个禁用的规则
      await curlFilterPage.openRuleManager();
      await ruleManagerPage.waitForLoad();
      
      // 创建2个禁用的测试规则
      for (let i = 0; i < 2; i++) {
        await ruleManagerPage.addNewRule();
        
        const testRule = {
          name: `批量启用规则${i + 1}`,
          description: `将被批量启用的规则${i + 1}`,
          action: 'delete',
          target: 'headers',
          matchMode: 'exact',
          matchValue: `enable-header-${i + 1}`,
          priority: 50,
          enabled: false // 初始禁用
        };
        
        await ruleManagerPage.fillRuleForm(testRule);
        await ruleManagerPage.saveRule();
      }
      
      // 选择所有规则
      await ruleManagerPage.selectAllRules();
      
      // 批量启用
      await ruleManagerPage.batchEnableRules();
      
      // 检查规则是否被启用
      const rule1Data = await ruleManagerPage.getRuleByIndex(0);
      const rule2Data = await ruleManagerPage.getRuleByIndex(1);
      expect(rule1Data.enabled).toBe(true);
      expect(rule2Data.enabled).toBe(true);
    });
  });

  test.describe('搜索和过滤', () => {
    test('应该能够搜索规则', async ({ page }) => {
      // 先创建几个规则
      await curlFilterPage.openRuleManager();
      await ruleManagerPage.waitForLoad();
      
      // 创建具有不同名称的规则
      const rules = [
        { name: '用户代理规则', matchValue: 'user-agent' },
        { name: '认证规则', matchValue: 'authorization' },
        { name: '内容类型规则', matchValue: 'content-type' }
      ];
      
      for (const ruleData of rules) {
        await ruleManagerPage.addNewRule();
        
        const testRule = {
          name: ruleData.name,
          description: `${ruleData.name}的描述`,
          action: 'delete',
          target: 'headers',
          matchMode: 'exact',
          matchValue: ruleData.matchValue,
          priority: 50,
          enabled: true
        };
        
        await ruleManagerPage.fillRuleForm(testRule);
        await ruleManagerPage.saveRule();
      }
      
      // 搜索特定规则
      await ruleManagerPage.searchRules('用户代理');
      
      // 检查搜索结果
      const rulesCount = await ruleManagerPage.getRulesCount();
      expect(rulesCount).toBe(1);
      
      const foundRule = await ruleManagerPage.getRuleByIndex(0);
      expect(foundRule.name).toContain('用户代理');
    });

    test('应该能够按启用状态过滤', async ({ page }) => {
      // 先创建启用和禁用的规则
      await curlFilterPage.openRuleManager();
      await ruleManagerPage.waitForLoad();
      
      // 创建一个启用的规则
      await ruleManagerPage.addNewRule();
      const enabledRule = {
        name: '启用的规则',
        description: '这是启用的规则',
        action: 'delete',
        target: 'headers',
        matchMode: 'exact',
        matchValue: 'enabled-header',
        priority: 50,
        enabled: true
      };
      await ruleManagerPage.fillRuleForm(enabledRule);
      await ruleManagerPage.saveRule();
      
      // 创建一个禁用的规则
      await ruleManagerPage.addNewRule();
      const disabledRule = {
        name: '禁用的规则',
        description: '这是禁用的规则',
        action: 'delete',
        target: 'headers',
        matchMode: 'exact',
        matchValue: 'disabled-header',
        priority: 50,
        enabled: false
      };
      await ruleManagerPage.fillRuleForm(disabledRule);
      await ruleManagerPage.saveRule();
      
      // 过滤只显示启用的规则
      await ruleManagerPage.filterEnabledOnly(true);
      
      // 检查过滤结果
      const rulesCount = await ruleManagerPage.getRulesCount();
      expect(rulesCount).toBe(1);
      
      const visibleRule = await ruleManagerPage.getRuleByIndex(0);
      expect(visibleRule.enabled).toBe(true);
    });
  });

  test.afterEach(async ({ page }) => {
    // 关闭规则管理对话框
    try {
      await curlFilterPage.closeCurrentDialog();
    } catch (e) {
      // 忽略关闭错误
    }
    
    // 截图保存（如果测试失败）
    if (test.info().status !== 'passed') {
      await takeScreenshot(page, `rule-management-${test.info().title}`);
    }
  });
});
