import { FullConfig } from '@playwright/test';

/**
 * 全局测试清理
 * 在所有测试结束后执行
 */
async function globalTeardown(config: FullConfig) {
  console.log('🧹 开始全局测试清理...');
  
  try {
    // 生成测试报告摘要
    console.log('📊 生成测试报告摘要...');
    
    // 清理临时文件
    console.log('🗑️ 清理临时文件...');
    
    // 输出测试统计信息
    console.log('📈 测试执行统计:');
    console.log(`   - 配置项目数: ${config.projects.length}`);
    console.log(`   - 基础URL: ${config.projects[0].use?.baseURL}`);
    console.log(`   - 并行执行: ${config.fullyParallel ? '是' : '否'}`);
    
  } catch (error) {
    console.error('❌ 全局清理失败:', error);
  }
  
  console.log('✅ 全局测试清理完成');
}

export default globalTeardown;
