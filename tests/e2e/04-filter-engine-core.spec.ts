import { test, expect } from '@playwright/test';
import { CurlFilterPage } from '../page-objects/CurlFilterPage';
import { RuleManagerPage } from '../page-objects/RuleManagerPage';
import { STANDARD_CURL_COMMANDS } from '../utils/test-data';
import { takeScreenshot, clearBrowserStorage } from '../utils/test-helpers';

test.describe('过滤引擎核心功能测试', () => {
  let curlFilterPage: CurlFilterPage;
  let ruleManagerPage: RuleManagerPage;

  test.beforeEach(async ({ page }) => {
    curlFilterPage = new CurlFilterPage(page);
    ruleManagerPage = new RuleManagerPage(page);
    await clearBrowserStorage(page);
    await curlFilterPage.goto();
  });

  test.describe('过滤动作测试', () => {
    test('DELETE动作应该删除匹配的请求头', async ({ page }) => {
      // 创建删除User-Agent的规则
      await curlFilterPage.openRuleManager();
      await ruleManagerPage.waitForLoad();
      await ruleManagerPage.addNewRule();
      
      const deleteRule = {
        name: '删除User-Agent',
        action: 'delete',
        target: 'headers',
        matchMode: 'exact',
        matchValue: 'user-agent',
        priority: 50,
        enabled: true
      };
      
      await ruleManagerPage.fillRuleForm(deleteRule);
      await ruleManagerPage.saveRule();
      await curlFilterPage.closeCurrentDialog();
      
      // 测试过滤效果
      const result = await curlFilterPage.performCompleteFilterFlow(STANDARD_CURL_COMMANDS.getWithHeaders);
      
      expect(result.success).toBe(true);
      expect(result.output).not.toContain('user-agent');
      expect(result.output).toContain('authorization');
    });

    test('KEEP动作应该保留匹配的请求头', async ({ page }) => {
      // 创建保留认证头的规则
      await curlFilterPage.openRuleManager();
      await ruleManagerPage.waitForLoad();
      await ruleManagerPage.addNewRule();
      
      const keepRule = {
        name: '保留认证头',
        action: 'keep',
        target: 'headers',
        matchMode: 'exact',
        matchValue: 'authorization',
        priority: 90,
        enabled: true
      };
      
      await ruleManagerPage.fillRuleForm(keepRule);
      await ruleManagerPage.saveRule();
      await curlFilterPage.closeCurrentDialog();
      
      // 测试过滤效果
      const result = await curlFilterPage.performCompleteFilterFlow(STANDARD_CURL_COMMANDS.getWithHeaders);
      
      expect(result.success).toBe(true);
      expect(result.output).toContain('authorization');
    });

    test('DELETE_ALL动作应该删除所有目标项', async ({ page }) => {
      // 创建删除所有查询参数的规则
      await curlFilterPage.openRuleManager();
      await ruleManagerPage.waitForLoad();
      await ruleManagerPage.addNewRule();
      
      const deleteAllRule = {
        name: '删除所有查询参数',
        action: 'delete_all',
        target: 'query_params',
        matchMode: 'exact',
        matchValue: '',
        priority: 50,
        enabled: true
      };
      
      await ruleManagerPage.fillRuleForm(deleteAllRule);
      await ruleManagerPage.saveRule();
      await curlFilterPage.closeCurrentDialog();
      
      // 测试包含查询参数的URL
      const curlWithParams = `curl 'https://api.example.com/users?page=1&limit=10&sort=name'`;
      const result = await curlFilterPage.performCompleteFilterFlow(curlWithParams);
      
      expect(result.success).toBe(true);
      expect(result.output).not.toContain('page=1');
      expect(result.output).not.toContain('limit=10');
      expect(result.output).not.toContain('sort=name');
    });
  });

  test.describe('匹配模式测试', () => {
    test('EXACT模式应该精确匹配', async ({ page }) => {
      await curlFilterPage.openRuleManager();
      await ruleManagerPage.waitForLoad();
      await ruleManagerPage.addNewRule();
      
      const exactRule = {
        name: '精确匹配测试',
        action: 'delete',
        target: 'headers',
        matchMode: 'exact',
        matchValue: 'user-agent',
        priority: 50,
        enabled: true
      };
      
      await ruleManagerPage.fillRuleForm(exactRule);
      await ruleManagerPage.saveRule();
      await curlFilterPage.closeCurrentDialog();
      
      const testCurl = `curl 'https://api.example.com/test' -H 'user-agent: test' -H 'x-user-agent: test'`;
      const result = await curlFilterPage.performCompleteFilterFlow(testCurl);
      
      expect(result.success).toBe(true);
      expect(result.output).not.toContain('user-agent: test');
      expect(result.output).toContain('x-user-agent: test'); // 不应该被删除
    });

    test('CONTAINS模式应该包含匹配', async ({ page }) => {
      await curlFilterPage.openRuleManager();
      await ruleManagerPage.waitForLoad();
      await ruleManagerPage.addNewRule();
      
      const containsRule = {
        name: '包含匹配测试',
        action: 'delete',
        target: 'headers',
        matchMode: 'contains',
        matchValue: 'user',
        priority: 50,
        enabled: true
      };
      
      await ruleManagerPage.fillRuleForm(containsRule);
      await ruleManagerPage.saveRule();
      await curlFilterPage.closeCurrentDialog();
      
      const testCurl = `curl 'https://api.example.com/test' -H 'user-agent: test' -H 'x-user-data: test' -H 'content-type: json'`;
      const result = await curlFilterPage.performCompleteFilterFlow(testCurl);
      
      expect(result.success).toBe(true);
      expect(result.output).not.toContain('user-agent');
      expect(result.output).not.toContain('x-user-data');
      expect(result.output).toContain('content-type'); // 不包含'user'，应该保留
    });

    test('STARTS_WITH模式应该前缀匹配', async ({ page }) => {
      await curlFilterPage.openRuleManager();
      await ruleManagerPage.waitForLoad();
      await ruleManagerPage.addNewRule();
      
      const startsWithRule = {
        name: '前缀匹配测试',
        action: 'delete',
        target: 'headers',
        matchMode: 'starts_with',
        matchValue: 'sec-',
        priority: 50,
        enabled: true
      };
      
      await ruleManagerPage.fillRuleForm(startsWithRule);
      await ruleManagerPage.saveRule();
      await curlFilterPage.closeCurrentDialog();
      
      const testCurl = `curl 'https://api.example.com/test' -H 'sec-fetch-mode: cors' -H 'sec-ch-ua: test' -H 'accept: json'`;
      const result = await curlFilterPage.performCompleteFilterFlow(testCurl);
      
      expect(result.success).toBe(true);
      expect(result.output).not.toContain('sec-fetch-mode');
      expect(result.output).not.toContain('sec-ch-ua');
      expect(result.output).toContain('accept'); // 不以'sec-'开头，应该保留
    });

    test('REGEX模式应该正则匹配', async ({ page }) => {
      await curlFilterPage.openRuleManager();
      await ruleManagerPage.waitForLoad();
      await ruleManagerPage.addNewRule();
      
      const regexRule = {
        name: '正则匹配测试',
        action: 'delete',
        target: 'headers',
        matchMode: 'regex',
        matchValue: '^(accept|user-agent)$',
        priority: 50,
        enabled: true
      };
      
      await ruleManagerPage.fillRuleForm(regexRule);
      await ruleManagerPage.saveRule();
      await curlFilterPage.closeCurrentDialog();
      
      const testCurl = `curl 'https://api.example.com/test' -H 'accept: json' -H 'user-agent: test' -H 'authorization: bearer'`;
      const result = await curlFilterPage.performCompleteFilterFlow(testCurl);
      
      expect(result.success).toBe(true);
      expect(result.output).not.toContain('accept: json');
      expect(result.output).not.toContain('user-agent: test');
      expect(result.output).toContain('authorization'); // 不匹配正则，应该保留
    });
  });

  test.describe('目标类型测试', () => {
    test('应该正确处理HEADERS目标', async ({ page }) => {
      await curlFilterPage.openRuleManager();
      await ruleManagerPage.waitForLoad();
      await ruleManagerPage.addNewRule();
      
      const headerRule = {
        name: '请求头测试',
        action: 'delete',
        target: 'headers',
        matchMode: 'exact',
        matchValue: 'user-agent',
        priority: 50,
        enabled: true
      };
      
      await ruleManagerPage.fillRuleForm(headerRule);
      await ruleManagerPage.saveRule();
      await curlFilterPage.closeCurrentDialog();
      
      const result = await curlFilterPage.performCompleteFilterFlow(STANDARD_CURL_COMMANDS.getWithHeaders);
      
      expect(result.success).toBe(true);
      expect(result.output).not.toContain('user-agent');
    });

    test('应该正确处理QUERY_PARAMS目标', async ({ page }) => {
      await curlFilterPage.openRuleManager();
      await ruleManagerPage.waitForLoad();
      await ruleManagerPage.addNewRule();
      
      const queryRule = {
        name: '查询参数测试',
        action: 'delete',
        target: 'query_params',
        matchMode: 'exact',
        matchValue: 'page',
        priority: 50,
        enabled: true
      };
      
      await ruleManagerPage.fillRuleForm(queryRule);
      await ruleManagerPage.saveRule();
      await curlFilterPage.closeCurrentDialog();
      
      const curlWithQuery = `curl 'https://api.example.com/users?page=1&limit=10'`;
      const result = await curlFilterPage.performCompleteFilterFlow(curlWithQuery);
      
      expect(result.success).toBe(true);
      expect(result.output).not.toContain('page=1');
      expect(result.output).toContain('limit=10'); // 应该保留
    });

    test('应该正确处理FORM_DATA目标', async ({ page }) => {
      await curlFilterPage.openRuleManager();
      await ruleManagerPage.waitForLoad();
      await ruleManagerPage.addNewRule();
      
      const formRule = {
        name: '表单数据测试',
        action: 'delete',
        target: 'form_data',
        matchMode: 'exact',
        matchValue: 'password',
        priority: 50,
        enabled: true
      };
      
      await ruleManagerPage.fillRuleForm(formRule);
      await ruleManagerPage.saveRule();
      await curlFilterPage.closeCurrentDialog();
      
      const result = await curlFilterPage.performCompleteFilterFlow(STANDARD_CURL_COMMANDS.postWithForm);
      
      expect(result.success).toBe(true);
      expect(result.output).not.toContain('password=secret123');
      expect(result.output).toContain('username=admin'); // 应该保留
    });
  });

  test.describe('优先级处理测试', () => {
    test('应该按优先级顺序执行规则', async ({ page }) => {
      await curlFilterPage.openRuleManager();
      await ruleManagerPage.waitForLoad();
      
      // 创建低优先级的删除所有规则
      await ruleManagerPage.addNewRule();
      const deleteAllRule = {
        name: '删除所有请求头',
        action: 'delete_all',
        target: 'headers',
        matchMode: 'exact',
        matchValue: '',
        priority: 10, // 低优先级
        enabled: true
      };
      await ruleManagerPage.fillRuleForm(deleteAllRule);
      await ruleManagerPage.saveRule();
      
      // 创建高优先级的保留规则
      await ruleManagerPage.addNewRule();
      const keepRule = {
        name: '保留认证头',
        action: 'keep',
        target: 'headers',
        matchMode: 'exact',
        matchValue: 'authorization',
        priority: 90, // 高优先级
        enabled: true
      };
      await ruleManagerPage.fillRuleForm(keepRule);
      await ruleManagerPage.saveRule();
      await curlFilterPage.closeCurrentDialog();
      
      const result = await curlFilterPage.performCompleteFilterFlow(STANDARD_CURL_COMMANDS.getWithHeaders);
      
      expect(result.success).toBe(true);
      // 高优先级的保留规则应该生效
      expect(result.output).toContain('authorization');
      // 其他请求头应该被删除
      expect(result.output).not.toContain('user-agent');
    });
  });

  test.describe('复杂规则组合测试', () => {
    test('应该正确处理多个规则的组合', async ({ page }) => {
      await curlFilterPage.openRuleManager();
      await ruleManagerPage.waitForLoad();
      
      // 创建多个规则
      const rules = [
        {
          name: '删除用户代理',
          action: 'delete',
          target: 'headers',
          matchMode: 'exact',
          matchValue: 'user-agent',
          priority: 50,
          enabled: true
        },
        {
          name: '删除安全头',
          action: 'delete',
          target: 'headers',
          matchMode: 'starts_with',
          matchValue: 'sec-',
          priority: 60,
          enabled: true
        },
        {
          name: '保留认证',
          action: 'keep',
          target: 'headers',
          matchMode: 'contains',
          matchValue: 'auth',
          priority: 90,
          enabled: true
        }
      ];
      
      for (const rule of rules) {
        await ruleManagerPage.addNewRule();
        await ruleManagerPage.fillRuleForm(rule);
        await ruleManagerPage.saveRule();
      }
      
      await curlFilterPage.closeCurrentDialog();
      
      const complexCurl = `curl 'https://api.example.com/test' \\
        -H 'user-agent: Mozilla/5.0' \\
        -H 'authorization: Bearer token' \\
        -H 'sec-fetch-mode: cors' \\
        -H 'sec-ch-ua: Chrome' \\
        -H 'accept: application/json'`;
      
      const result = await curlFilterPage.performCompleteFilterFlow(complexCurl);
      
      expect(result.success).toBe(true);
      expect(result.output).not.toContain('user-agent');
      expect(result.output).not.toContain('sec-fetch-mode');
      expect(result.output).not.toContain('sec-ch-ua');
      expect(result.output).toContain('authorization'); // 应该保留
      expect(result.output).toContain('accept'); // 不匹配任何删除规则，应该保留
    });
  });

  test.describe('性能测试', () => {
    test('应该在合理时间内处理大量规则', async ({ page }) => {
      await curlFilterPage.openRuleManager();
      await ruleManagerPage.waitForLoad();
      
      // 创建20个规则
      for (let i = 0; i < 20; i++) {
        await ruleManagerPage.addNewRule();
        
        const rule = {
          name: `性能测试规则${i}`,
          action: 'delete',
          target: 'headers',
          matchMode: 'exact',
          matchValue: `test-header-${i}`,
          priority: 50,
          enabled: true
        };
        
        await ruleManagerPage.fillRuleForm(rule);
        await ruleManagerPage.saveRule();
      }
      
      await curlFilterPage.closeCurrentDialog();
      
      // 测试处理时间
      const startTime = Date.now();
      const result = await curlFilterPage.performCompleteFilterFlow(STANDARD_CURL_COMMANDS.chromeComplex);
      const endTime = Date.now();
      
      const processingTime = endTime - startTime;
      
      expect(result.success).toBe(true);
      expect(processingTime).toBeLessThan(3000); // 应该在3秒内完成
    });
  });

  test.afterEach(async ({ page }) => {
    try {
      await curlFilterPage.closeCurrentDialog();
    } catch (e) {
      // 忽略关闭错误
    }
    
    if (test.info().status !== 'passed') {
      await takeScreenshot(page, `filter-engine-${test.info().title}`);
    }
  });
});
