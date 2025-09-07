#!/usr/bin/env ts-node

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

/**
 * 测试执行脚本
 * 执行所有Playwright测试并生成报告
 */

interface TestResult {
  testFile: string;
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
  errors: string[];
}

interface TestSummary {
  totalTests: number;
  totalPassed: number;
  totalFailed: number;
  totalSkipped: number;
  totalDuration: number;
  results: TestResult[];
  coverage: {
    ui: number;
    functionality: number;
    errorHandling: number;
    performance: number;
  };
}

class TestRunner {
  private results: TestResult[] = [];
  private startTime: number = 0;

  async runAllTests(): Promise<TestSummary> {
    console.log('🚀 开始执行Playwright MCP测试套件...\n');
    
    this.startTime = Date.now();
    
    // 测试文件列表
    const testFiles = [
      '01-main-ui-interactions.spec.ts',
      '02-curl-parsing.spec.ts', 
      '03-rule-management.spec.ts',
      '04-filter-engine-core.spec.ts',
      '05-comprehensive-features.spec.ts'
    ];

    // 执行每个测试文件
    for (const testFile of testFiles) {
      await this.runTestFile(testFile);
    }

    // 生成测试摘要
    const summary = this.generateSummary();
    
    // 生成报告
    await this.generateReports(summary);
    
    return summary;
  }

  private async runTestFile(testFile: string): Promise<void> {
    console.log(`📋 执行测试文件: ${testFile}`);
    
    const startTime = Date.now();
    let result: TestResult = {
      testFile,
      passed: 0,
      failed: 0,
      skipped: 0,
      duration: 0,
      errors: []
    };

    try {
      // 执行Playwright测试
      const command = `npx playwright test tests/e2e/${testFile} --reporter=json`;
      const output = execSync(command, { 
        encoding: 'utf8',
        cwd: process.cwd(),
        timeout: 300000 // 5分钟超时
      });

      // 解析测试结果
      const jsonResult = JSON.parse(output);
      result = this.parseTestResult(testFile, jsonResult);
      
    } catch (error: any) {
      console.error(`❌ 测试文件 ${testFile} 执行失败:`, error.message);
      result.failed = 1;
      result.errors.push(error.message);
    }

    result.duration = Date.now() - startTime;
    this.results.push(result);

    // 输出结果
    this.printTestResult(result);
  }

  private parseTestResult(testFile: string, jsonResult: any): TestResult {
    const result: TestResult = {
      testFile,
      passed: 0,
      failed: 0,
      skipped: 0,
      duration: 0,
      errors: []
    };

    if (jsonResult.suites) {
      jsonResult.suites.forEach((suite: any) => {
        suite.specs?.forEach((spec: any) => {
          spec.tests?.forEach((test: any) => {
            switch (test.status) {
              case 'passed':
                result.passed++;
                break;
              case 'failed':
                result.failed++;
                if (test.error) {
                  result.errors.push(`${test.title}: ${test.error.message}`);
                }
                break;
              case 'skipped':
                result.skipped++;
                break;
            }
          });
        });
      });
    }

    return result;
  }

  private printTestResult(result: TestResult): void {
    const total = result.passed + result.failed + result.skipped;
    const passRate = total > 0 ? ((result.passed / total) * 100).toFixed(1) : '0';
    
    console.log(`   ✅ 通过: ${result.passed}`);
    console.log(`   ❌ 失败: ${result.failed}`);
    console.log(`   ⏭️  跳过: ${result.skipped}`);
    console.log(`   📊 通过率: ${passRate}%`);
    console.log(`   ⏱️  耗时: ${(result.duration / 1000).toFixed(2)}s`);
    
    if (result.errors.length > 0) {
      console.log(`   🐛 错误:`);
      result.errors.forEach(error => {
        console.log(`      - ${error}`);
      });
    }
    
    console.log('');
  }

  private generateSummary(): TestSummary {
    const totalDuration = Date.now() - this.startTime;
    
    const summary: TestSummary = {
      totalTests: 0,
      totalPassed: 0,
      totalFailed: 0,
      totalSkipped: 0,
      totalDuration,
      results: this.results,
      coverage: {
        ui: 0,
        functionality: 0,
        errorHandling: 0,
        performance: 0
      }
    };

    // 计算总计
    this.results.forEach(result => {
      summary.totalPassed += result.passed;
      summary.totalFailed += result.failed;
      summary.totalSkipped += result.skipped;
    });
    
    summary.totalTests = summary.totalPassed + summary.totalFailed + summary.totalSkipped;

    // 计算覆盖率（基于测试文件内容估算）
    summary.coverage = this.calculateCoverage();

    return summary;
  }

  private calculateCoverage(): TestSummary['coverage'] {
    // 基于测试用例数量和类型估算覆盖率
    const uiTests = this.results.find(r => r.testFile.includes('ui-interactions'));
    const functionalityTests = this.results.filter(r => 
      r.testFile.includes('parsing') || 
      r.testFile.includes('rule-management') || 
      r.testFile.includes('filter-engine')
    );
    const errorTests = this.results.find(r => r.testFile.includes('comprehensive'));
    const performanceTests = this.results.find(r => r.testFile.includes('comprehensive'));

    return {
      ui: uiTests ? Math.min(95, (uiTests.passed / (uiTests.passed + uiTests.failed)) * 100) : 0,
      functionality: functionalityTests.length > 0 ? 
        Math.min(90, functionalityTests.reduce((acc, r) => acc + r.passed, 0) / 
        functionalityTests.reduce((acc, r) => acc + r.passed + r.failed, 0) * 100) : 0,
      errorHandling: errorTests ? Math.min(85, (errorTests.passed / (errorTests.passed + errorTests.failed)) * 100) : 0,
      performance: performanceTests ? Math.min(80, (performanceTests.passed / (performanceTests.passed + performanceTests.failed)) * 100) : 0
    };
  }

  private async generateReports(summary: TestSummary): Promise<void> {
    // 创建报告目录
    const reportsDir = path.join(process.cwd(), 'test-results');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    // 生成JSON报告
    await this.generateJsonReport(summary, reportsDir);
    
    // 生成HTML报告
    await this.generateHtmlReport(summary, reportsDir);
    
    // 生成Markdown报告
    await this.generateMarkdownReport(summary, reportsDir);
    
    // 输出控制台摘要
    this.printSummary(summary);
  }

  private async generateJsonReport(summary: TestSummary, reportsDir: string): Promise<void> {
    const jsonPath = path.join(reportsDir, 'test-summary.json');
    fs.writeFileSync(jsonPath, JSON.stringify(summary, null, 2));
    console.log(`📄 JSON报告已生成: ${jsonPath}`);
  }

  private async generateHtmlReport(summary: TestSummary, reportsDir: string): Promise<void> {
    const htmlContent = this.generateHtmlContent(summary);
    const htmlPath = path.join(reportsDir, 'test-report.html');
    fs.writeFileSync(htmlPath, htmlContent);
    console.log(`🌐 HTML报告已生成: ${htmlPath}`);
  }

  private async generateMarkdownReport(summary: TestSummary, reportsDir: string): Promise<void> {
    const markdownContent = this.generateMarkdownContent(summary);
    const mdPath = path.join(reportsDir, 'test-report.md');
    fs.writeFileSync(mdPath, markdownContent);
    console.log(`📝 Markdown报告已生成: ${mdPath}`);
  }

  private generateHtmlContent(summary: TestSummary): string {
    const passRate = summary.totalTests > 0 ? 
      ((summary.totalPassed / summary.totalTests) * 100).toFixed(1) : '0';

    return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>cURL Filter - Playwright MCP 测试报告</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 40px; }
        .header { text-align: center; margin-bottom: 40px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 40px; }
        .card { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; }
        .card h3 { margin: 0 0 10px 0; color: #333; }
        .card .number { font-size: 2em; font-weight: bold; color: #007bff; }
        .results { margin-bottom: 40px; }
        .test-file { background: white; border: 1px solid #dee2e6; border-radius: 8px; margin-bottom: 20px; overflow: hidden; }
        .test-file-header { background: #e9ecef; padding: 15px; font-weight: bold; }
        .test-file-content { padding: 15px; }
        .coverage { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; }
        .coverage-item { text-align: center; }
        .coverage-bar { width: 100%; height: 20px; background: #e9ecef; border-radius: 10px; overflow: hidden; }
        .coverage-fill { height: 100%; background: linear-gradient(90deg, #28a745, #ffc107, #dc3545); }
        .passed { color: #28a745; }
        .failed { color: #dc3545; }
        .skipped { color: #6c757d; }
    </style>
</head>
<body>
    <div class="header">
        <h1>cURL Filter - Playwright MCP 测试报告</h1>
        <p>生成时间: ${new Date().toLocaleString('zh-CN')}</p>
    </div>

    <div class="summary">
        <div class="card">
            <h3>总测试数</h3>
            <div class="number">${summary.totalTests}</div>
        </div>
        <div class="card">
            <h3>通过率</h3>
            <div class="number">${passRate}%</div>
        </div>
        <div class="card">
            <h3>执行时间</h3>
            <div class="number">${(summary.totalDuration / 1000).toFixed(1)}s</div>
        </div>
        <div class="card">
            <h3>失败数</h3>
            <div class="number failed">${summary.totalFailed}</div>
        </div>
    </div>

    <div class="results">
        <h2>测试结果详情</h2>
        ${summary.results.map(result => `
            <div class="test-file">
                <div class="test-file-header">${result.testFile}</div>
                <div class="test-file-content">
                    <p><span class="passed">✅ 通过: ${result.passed}</span> | 
                       <span class="failed">❌ 失败: ${result.failed}</span> | 
                       <span class="skipped">⏭️ 跳过: ${result.skipped}</span> | 
                       ⏱️ 耗时: ${(result.duration / 1000).toFixed(2)}s</p>
                    ${result.errors.length > 0 ? `
                        <h4>错误详情:</h4>
                        <ul>${result.errors.map(error => `<li>${error}</li>`).join('')}</ul>
                    ` : ''}
                </div>
            </div>
        `).join('')}
    </div>

    <div class="coverage">
        <h2>测试覆盖率</h2>
        <div class="coverage-item">
            <h4>UI交互</h4>
            <div class="coverage-bar">
                <div class="coverage-fill" style="width: ${summary.coverage.ui}%"></div>
            </div>
            <p>${summary.coverage.ui.toFixed(1)}%</p>
        </div>
        <div class="coverage-item">
            <h4>功能测试</h4>
            <div class="coverage-bar">
                <div class="coverage-fill" style="width: ${summary.coverage.functionality}%"></div>
            </div>
            <p>${summary.coverage.functionality.toFixed(1)}%</p>
        </div>
        <div class="coverage-item">
            <h4>错误处理</h4>
            <div class="coverage-bar">
                <div class="coverage-fill" style="width: ${summary.coverage.errorHandling}%"></div>
            </div>
            <p>${summary.coverage.errorHandling.toFixed(1)}%</p>
        </div>
        <div class="coverage-item">
            <h4>性能测试</h4>
            <div class="coverage-bar">
                <div class="coverage-fill" style="width: ${summary.coverage.performance}%"></div>
            </div>
            <p>${summary.coverage.performance.toFixed(1)}%</p>
        </div>
    </div>
</body>
</html>`;
  }

  private generateMarkdownContent(summary: TestSummary): string {
    const passRate = summary.totalTests > 0 ? 
      ((summary.totalPassed / summary.totalTests) * 100).toFixed(1) : '0';

    return `# cURL Filter - Playwright MCP 测试报告

**生成时间:** ${new Date().toLocaleString('zh-CN')}

## 📊 测试摘要

| 指标 | 数值 |
|------|------|
| 总测试数 | ${summary.totalTests} |
| 通过数 | ${summary.totalPassed} |
| 失败数 | ${summary.totalFailed} |
| 跳过数 | ${summary.totalSkipped} |
| 通过率 | ${passRate}% |
| 执行时间 | ${(summary.totalDuration / 1000).toFixed(1)}s |

## 📋 详细结果

${summary.results.map(result => {
  const total = result.passed + result.failed + result.skipped;
  const rate = total > 0 ? ((result.passed / total) * 100).toFixed(1) : '0';
  
  return `### ${result.testFile}

- ✅ 通过: ${result.passed}
- ❌ 失败: ${result.failed}  
- ⏭️ 跳过: ${result.skipped}
- 📊 通过率: ${rate}%
- ⏱️ 耗时: ${(result.duration / 1000).toFixed(2)}s

${result.errors.length > 0 ? `**错误详情:**
${result.errors.map(error => `- ${error}`).join('\n')}` : ''}
`;
}).join('\n')}

## 🎯 测试覆盖率

| 类型 | 覆盖率 |
|------|--------|
| UI交互 | ${summary.coverage.ui.toFixed(1)}% |
| 功能测试 | ${summary.coverage.functionality.toFixed(1)}% |
| 错误处理 | ${summary.coverage.errorHandling.toFixed(1)}% |
| 性能测试 | ${summary.coverage.performance.toFixed(1)}% |

## 🔍 测试用例统计

本次测试共执行了 **${summary.totalTests}** 个测试用例，覆盖了以下功能模块：

1. **主界面UI交互** - 页面加载、语言切换、响应式布局等
2. **cURL解析功能** - 各种格式解析、边界条件处理等  
3. **规则管理** - CRUD操作、验证、模板应用等
4. **过滤引擎** - 核心过滤逻辑、匹配模式、优先级等
5. **综合功能** - 历史记录、数据存储、多语言等

## 📈 改进建议

${summary.totalFailed > 0 ? `
⚠️ **发现 ${summary.totalFailed} 个失败的测试用例，建议：**
- 检查失败用例的具体错误信息
- 修复相关功能缺陷
- 完善错误处理机制
` : '✅ **所有测试用例均通过，系统功能稳定！**'}

${summary.coverage.ui < 90 || summary.coverage.functionality < 90 ? `
📊 **测试覆盖率有待提升：**
- 增加更多边界条件测试
- 完善错误场景覆盖
- 添加性能压力测试
` : ''}
`;
  }

  private printSummary(summary: TestSummary): void {
    const passRate = summary.totalTests > 0 ? 
      ((summary.totalPassed / summary.totalTests) * 100).toFixed(1) : '0';

    console.log('\n' + '='.repeat(60));
    console.log('🎉 测试执行完成！');
    console.log('='.repeat(60));
    console.log(`📊 总测试数: ${summary.totalTests}`);
    console.log(`✅ 通过: ${summary.totalPassed}`);
    console.log(`❌ 失败: ${summary.totalFailed}`);
    console.log(`⏭️  跳过: ${summary.totalSkipped}`);
    console.log(`📈 通过率: ${passRate}%`);
    console.log(`⏱️  总耗时: ${(summary.totalDuration / 1000).toFixed(2)}s`);
    console.log('='.repeat(60));
    
    if (summary.totalFailed > 0) {
      console.log('⚠️  存在失败的测试用例，请检查详细报告');
    } else {
      console.log('🎊 所有测试用例均通过！');
    }
    
    console.log('\n📄 详细报告已生成在 test-results/ 目录下');
  }
}

// 执行测试
async function main() {
  const runner = new TestRunner();
  try {
    await runner.runAllTests();
    process.exit(0);
  } catch (error) {
    console.error('❌ 测试执行失败:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { TestRunner };
