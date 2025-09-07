import { test, expect } from '@playwright/test';
import { CurlFilterPage } from '../page-objects/CurlFilterPage';
import { STANDARD_CURL_COMMANDS, BOUNDARY_TEST_DATA, TestDataGenerator } from '../utils/test-data';
import { takeScreenshot, clearBrowserStorage } from '../utils/test-helpers';

test.describe('cURL输入和解析测试', () => {
  let curlFilterPage: CurlFilterPage;

  test.beforeEach(async ({ page }) => {
    curlFilterPage = new CurlFilterPage(page);
    await clearBrowserStorage(page);
    await curlFilterPage.goto();
  });

  test.describe('标准cURL命令解析', () => {
    test('应该正确解析简单GET请求', async ({ page }) => {
      const curlCommand = STANDARD_CURL_COMMANDS.simpleGet;
      
      // 输入cURL命令
      await curlFilterPage.inputCurlCommand(curlCommand);
      
      // 应用过滤
      const result = await curlFilterPage.performCompleteFilterFlow(curlCommand);
      
      // 检查解析成功
      expect(result.success).toBe(true);
      expect(result.output).toContain('https://api.example.com/users');
      expect(result.output).toContain('curl');
    });

    test('应该正确解析带请求头的GET请求', async ({ page }) => {
      const curlCommand = STANDARD_CURL_COMMANDS.getWithHeaders;
      
      // 输入cURL命令
      await curlFilterPage.inputCurlCommand(curlCommand);
      
      // 应用过滤
      const result = await curlFilterPage.performCompleteFilterFlow(curlCommand);
      
      // 检查解析成功
      expect(result.success).toBe(true);
      expect(result.output).toContain('https://api.example.com/users');
      
      // 检查请求头是否被正确处理
      expect(result.output).toContain('accept: application/json');
      expect(result.output).toContain('authorization: Bearer token123');
    });

    test('应该正确解析POST请求with JSON', async ({ page }) => {
      const curlCommand = STANDARD_CURL_COMMANDS.postWithJson;
      
      // 输入cURL命令
      await curlFilterPage.inputCurlCommand(curlCommand);
      
      // 应用过滤
      const result = await curlFilterPage.performCompleteFilterFlow(curlCommand);
      
      // 检查解析成功
      expect(result.success).toBe(true);
      expect(result.output).toContain('-X POST');
      expect(result.output).toContain('content-type: application/json');
      expect(result.output).toContain('John Doe');
      expect(result.output).toContain('john@example.com');
    });

    test('应该正确解析POST请求with表单数据', async ({ page }) => {
      const curlCommand = STANDARD_CURL_COMMANDS.postWithForm;
      
      // 输入cURL命令
      await curlFilterPage.inputCurlCommand(curlCommand);
      
      // 应用过滤
      const result = await curlFilterPage.performCompleteFilterFlow(curlCommand);
      
      // 检查解析成功
      expect(result.success).toBe(true);
      expect(result.output).toContain('-X POST');
      expect(result.output).toContain('content-type: application/x-www-form-urlencoded');
      expect(result.output).toContain('username=admin');
      expect(result.output).toContain('password=secret123');
    });

    test('应该正确解析复杂的Chrome复制的请求', async ({ page }) => {
      const curlCommand = STANDARD_CURL_COMMANDS.chromeComplex;
      
      // 输入cURL命令
      await curlFilterPage.inputCurlCommand(curlCommand);
      
      // 应用过滤
      const result = await curlFilterPage.performCompleteFilterFlow(curlCommand);
      
      // 检查解析成功
      expect(result.success).toBe(true);
      expect(result.output).toContain('https://api.example.com/users');
      
      // 检查查询参数是否保留
      expect(result.output).toContain('page=1');
      expect(result.output).toContain('limit=10');
      
      // 检查认证头是否保留
      expect(result.output).toContain('authorization: Bearer');
    });
  });

  test.describe('边界条件处理', () => {
    test('应该处理空输入', async ({ page }) => {
      const curlCommand = BOUNDARY_TEST_DATA.empty;
      
      // 输入空内容
      await curlFilterPage.inputCurlCommand(curlCommand);
      
      // 尝试应用过滤
      await curlFilterPage.applyFilter();
      
      // 检查错误消息
      const errorMessage = await curlFilterPage.waitForErrorMessage();
      expect(errorMessage).toBeTruthy();
      expect(errorMessage).toContain('输入');
    });

    test('应该处理只有空格的输入', async ({ page }) => {
      const curlCommand = BOUNDARY_TEST_DATA.whitespace;
      
      // 输入只有空格的内容
      await curlFilterPage.inputCurlCommand(curlCommand);
      
      // 尝试应用过滤
      await curlFilterPage.applyFilter();
      
      // 检查错误消息
      const errorMessage = await curlFilterPage.waitForErrorMessage();
      expect(errorMessage).toBeTruthy();
    });

    test('应该处理无效的cURL命令', async ({ page }) => {
      const curlCommand = BOUNDARY_TEST_DATA.invalidCurl;
      
      // 输入无效的cURL命令
      await curlFilterPage.inputCurlCommand(curlCommand);
      
      // 等待验证完成
      await page.waitForTimeout(500);
      
      // 检查验证消息
      const validationMessage = await curlFilterPage.getInputValidationMessage();
      expect(validationMessage).toBeTruthy();
      
      // 检查输入是否被标记为无效
      const isValid = await curlFilterPage.isInputValid();
      expect(isValid).toBe(false);
    });

    test('应该处理没有URL的cURL命令', async ({ page }) => {
      const curlCommand = BOUNDARY_TEST_DATA.noUrl;
      
      // 输入没有URL的cURL命令
      await curlFilterPage.inputCurlCommand(curlCommand);
      
      // 尝试应用过滤
      await curlFilterPage.applyFilter();
      
      // 检查错误消息
      const errorMessage = await curlFilterPage.waitForErrorMessage();
      expect(errorMessage).toBeTruthy();
      expect(errorMessage).toContain('URL');
    });

    test('应该处理超长URL', async ({ page }) => {
      const curlCommand = BOUNDARY_TEST_DATA.longUrl;
      
      // 输入超长URL的cURL命令
      await curlFilterPage.inputCurlCommand(curlCommand);
      
      // 应用过滤
      const result = await curlFilterPage.performCompleteFilterFlow(curlCommand);
      
      // 应该能够处理（虽然可能很慢）
      expect(result.success).toBe(true);
      expect(result.output).toContain('curl');
    });

    test('应该处理包含特殊字符的命令', async ({ page }) => {
      const curlCommand = BOUNDARY_TEST_DATA.specialChars;
      
      // 输入包含特殊字符的cURL命令
      await curlFilterPage.inputCurlCommand(curlCommand);
      
      // 应用过滤
      const result = await curlFilterPage.performCompleteFilterFlow(curlCommand);
      
      // 检查解析成功
      expect(result.success).toBe(true);
      expect(result.output).toContain('特殊字符');
      expect(result.output).toContain('symbols');
    });

    test('应该处理多行格式的cURL命令', async ({ page }) => {
      const curlCommand = BOUNDARY_TEST_DATA.multiline;
      
      // 输入多行格式的cURL命令
      await curlFilterPage.inputCurlCommand(curlCommand);
      
      // 应用过滤
      const result = await curlFilterPage.performCompleteFilterFlow(curlCommand);
      
      // 检查解析成功
      expect(result.success).toBe(true);
      expect(result.output).toContain('https://api.example.com/users');
      expect(result.output).toContain('John Doe');
    });

    test('应该处理包含转义字符的命令', async ({ page }) => {
      const curlCommand = BOUNDARY_TEST_DATA.withEscapes;
      
      // 输入包含转义字符的cURL命令
      await curlFilterPage.inputCurlCommand(curlCommand);
      
      // 应用过滤
      const result = await curlFilterPage.performCompleteFilterFlow(curlCommand);
      
      // 检查解析成功
      expect(result.success).toBe(true);
      expect(result.output).toContain('Hello');
      expect(result.output).toContain('World');
    });
  });

  test.describe('输入验证', () => {
    test('应该实时验证cURL命令格式', async ({ page }) => {
      // 输入无效开头
      await curlFilterPage.inputCurlCommand('wget https://example.com');
      await page.waitForTimeout(500);
      
      let validationMessage = await curlFilterPage.getInputValidationMessage();
      expect(validationMessage).toContain('curl');
      
      // 修正为有效的cURL命令
      await curlFilterPage.inputCurlCommand('curl https://example.com');
      await page.waitForTimeout(500);
      
      const isValid = await curlFilterPage.isInputValid();
      expect(isValid).toBe(true);
    });

    test('应该检测缺少URL的情况', async ({ page }) => {
      // 输入没有URL的命令
      await curlFilterPage.inputCurlCommand('curl -H "accept: json"');
      await page.waitForTimeout(500);
      
      const validationMessage = await curlFilterPage.getInputValidationMessage();
      expect(validationMessage).toContain('URL');
      
      const isValid = await curlFilterPage.isInputValid();
      expect(isValid).toBe(false);
    });

    test('应该识别简单的cURL命令', async ({ page }) => {
      // 输入简单的cURL命令
      await curlFilterPage.inputCurlCommand('curl https://example.com');
      await page.waitForTimeout(500);
      
      const validationMessage = await curlFilterPage.getInputValidationMessage();
      expect(validationMessage).toContain('简单');
      
      const isValid = await curlFilterPage.isInputValid();
      expect(isValid).toBe(true);
    });
  });

  test.describe('大文本处理', () => {
    test('应该处理包含大量请求头的命令', async ({ page }) => {
      // 生成包含大量请求头的cURL命令
      let curlCommand = 'curl https://api.example.com/test';
      for (let i = 0; i < 50; i++) {
        curlCommand += ` -H "custom-header-${i}: value-${i}"`;
      }
      
      // 输入大文本
      await curlFilterPage.inputCurlCommand(curlCommand);
      
      // 应用过滤
      const result = await curlFilterPage.performCompleteFilterFlow(curlCommand);
      
      // 检查处理成功
      expect(result.success).toBe(true);
      expect(result.output).toContain('https://api.example.com/test');
    });

    test('应该处理包含大JSON数据的命令', async ({ page }) => {
      // 生成包含大JSON数据的cURL命令
      const largeData = JSON.stringify({
        items: Array.from({ length: 100 }, (_, i) => ({
          id: i,
          name: `Item ${i}`,
          description: `Description for item ${i}`.repeat(5)
        }))
      });
      
      const curlCommand = `curl https://api.example.com/test -X POST -H "content-type: application/json" -d '${largeData}'`;
      
      // 输入大文本
      await curlFilterPage.inputCurlCommand(curlCommand);
      
      // 应用过滤
      const result = await curlFilterPage.performCompleteFilterFlow(curlCommand);
      
      // 检查处理成功
      expect(result.success).toBe(true);
      expect(result.output).toContain('-X POST');
    });
  });

  test.describe('随机测试', () => {
    test('应该处理随机生成的cURL命令', async ({ page }) => {
      // 生成5个随机cURL命令进行测试
      for (let i = 0; i < 5; i++) {
        const randomCurl = TestDataGenerator.randomCurlCommand();
        
        // 输入随机命令
        await curlFilterPage.inputCurlCommand(randomCurl);
        
        // 应用过滤
        const result = await curlFilterPage.performCompleteFilterFlow(randomCurl);
        
        // 检查基本处理成功
        expect(result.success).toBe(true);
        expect(result.output).toContain('curl');
        
        // 清空输入准备下一次测试
        await curlFilterPage.clearInput();
      }
    });
  });

  test.describe('性能测试', () => {
    test('应该在合理时间内处理复杂命令', async ({ page }) => {
      const complexCurl = STANDARD_CURL_COMMANDS.chromeComplex;
      
      // 记录开始时间
      const startTime = Date.now();
      
      // 执行完整流程
      const result = await curlFilterPage.performCompleteFilterFlow(complexCurl);
      
      // 记录结束时间
      const endTime = Date.now();
      const processingTime = endTime - startTime;
      
      // 检查处理成功
      expect(result.success).toBe(true);
      
      // 检查处理时间（应该在5秒内完成）
      expect(processingTime).toBeLessThan(5000);
    });
  });

  test.describe('错误恢复', () => {
    test('应该能从解析错误中恢复', async ({ page }) => {
      // 先输入无效命令
      await curlFilterPage.inputCurlCommand('invalid command');
      await curlFilterPage.applyFilter();
      
      // 检查错误消息
      let errorMessage = await curlFilterPage.getErrorMessage();
      expect(errorMessage).toBeTruthy();
      
      // 输入有效命令
      const validCurl = STANDARD_CURL_COMMANDS.simpleGet;
      const result = await curlFilterPage.performCompleteFilterFlow(validCurl);
      
      // 检查恢复成功
      expect(result.success).toBe(true);
      expect(result.output).toBeTruthy();
    });
  });

  test.afterEach(async ({ page }) => {
    // 截图保存（如果测试失败）
    if (test.info().status !== 'passed') {
      await takeScreenshot(page, `curl-parsing-${test.info().title}`);
    }
  });
});
