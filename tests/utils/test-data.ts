/**
 * 测试数据管理
 * 包含各种测试场景的数据
 */

/**
 * 标准cURL命令样本
 */
export const STANDARD_CURL_COMMANDS = {
  // 简单GET请求
  simpleGet: `curl 'https://api.example.com/users'`,
  
  // 带请求头的GET请求
  getWithHeaders: `curl 'https://api.example.com/users' \\
  -H 'accept: application/json' \\
  -H 'authorization: Bearer token123' \\
  -H 'user-agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'`,
  
  // POST请求with JSON
  postWithJson: `curl 'https://api.example.com/users' \\
  -X POST \\
  -H 'content-type: application/json' \\
  -H 'authorization: Bearer token123' \\
  -d '{"name":"John Doe","email":"john@example.com"}'`,
  
  // POST请求with表单数据
  postWithForm: `curl 'https://api.example.com/login' \\
  -X POST \\
  -H 'content-type: application/x-www-form-urlencoded' \\
  -d 'username=admin&password=secret123'`,
  
  // 复杂的Chrome复制的请求
  chromeComplex: `curl 'https://api.example.com/users?page=1&limit=10' \\
  -H 'accept: application/json, text/plain, */*' \\
  -H 'accept-language: zh-CN,zh;q=0.9,en;q=0.8' \\
  -H 'authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9' \\
  -H 'cache-control: no-cache' \\
  -H 'content-type: application/json' \\
  -H 'origin: https://app.example.com' \\
  -H 'pragma: no-cache' \\
  -H 'referer: https://app.example.com/users' \\
  -H 'sec-ch-ua: "Google Chrome";v="119", "Chromium";v="119", "Not?A_Brand";v="24"' \\
  -H 'sec-ch-ua-mobile: ?0' \\
  -H 'sec-ch-ua-platform: "macOS"' \\
  -H 'sec-fetch-dest: empty' \\
  -H 'sec-fetch-mode: cors' \\
  -H 'sec-fetch-site: same-site' \\
  -H 'user-agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' \\
  --compressed`
};

/**
 * 边界条件测试数据
 */
export const BOUNDARY_TEST_DATA = {
  // 空输入
  empty: '',
  
  // 只有空格
  whitespace: '   \n\t   ',
  
  // 无效的cURL命令
  invalidCurl: 'not a curl command',
  
  // 没有URL的cURL
  noUrl: 'curl -H "accept: application/json"',
  
  // 超长URL
  longUrl: `curl 'https://api.example.com/${'a'.repeat(2000)}'`,
  
  // 特殊字符
  specialChars: `curl 'https://api.example.com/test' -H 'test: "value with spaces and 特殊字符 & symbols"'`,
  
  // 多行格式
  multiline: `curl 'https://api.example.com/users' \\
    -H 'accept: application/json' \\
    -H 'authorization: Bearer token' \\
    -d '{
      "name": "John Doe",
      "email": "john@example.com"
    }'`,
  
  // 包含转义字符
  withEscapes: `curl 'https://api.example.com/test' -d '{"message":"Hello \"World\"\\nNew line"}'`
};

/**
 * 过滤规则测试数据
 */
export const FILTER_RULES_TEST_DATA = {
  // 删除User-Agent规则
  deleteUserAgent: {
    name: '删除User-Agent',
    action: 'delete',
    target: 'headers',
    matchMode: 'exact',
    matchValue: 'user-agent',
    priority: 50,
    enabled: true,
    description: '删除浏览器用户代理信息'
  },
  
  // 删除所有sec-*请求头
  deleteSecHeaders: {
    name: '删除安全请求头',
    action: 'delete',
    target: 'headers',
    matchMode: 'starts_with',
    matchValue: 'sec-',
    priority: 60,
    enabled: true,
    description: '删除浏览器安全相关请求头'
  },
  
  // 保留认证请求头
  keepAuth: {
    name: '保留认证信息',
    action: 'keep',
    target: 'headers',
    matchMode: 'exact',
    matchValue: 'authorization',
    priority: 90,
    enabled: true,
    description: '保留认证相关请求头'
  },
  
  // 删除所有查询参数
  deleteAllParams: {
    name: '删除所有查询参数',
    action: 'delete_all',
    target: 'query_params',
    matchMode: 'exact',
    matchValue: '',
    priority: 30,
    enabled: false,
    description: '删除URL中的所有查询参数'
  }
};

/**
 * 历史记录测试数据
 */
export const HISTORY_TEST_DATA = {
  entries: [
    {
      id: 'history_1',
      inputCurl: STANDARD_CURL_COMMANDS.simpleGet,
      outputCurl: `curl 'https://api.example.com/users'`,
      appliedRules: [],
      timestamp: new Date('2024-01-01T10:00:00Z').toISOString(),
      title: '简单GET请求',
      tags: ['api', 'get'],
      favorite: false
    },
    {
      id: 'history_2',
      inputCurl: STANDARD_CURL_COMMANDS.postWithJson,
      outputCurl: `curl 'https://api.example.com/users' -X POST -H 'content-type: application/json' -d '{"name":"John Doe","email":"john@example.com"}'`,
      appliedRules: ['rule_1'],
      timestamp: new Date('2024-01-02T10:00:00Z').toISOString(),
      title: 'POST JSON请求',
      tags: ['api', 'post', 'json'],
      favorite: true
    }
  ]
};

/**
 * 错误测试数据
 */
export const ERROR_TEST_DATA = {
  // 网络错误模拟
  networkError: {
    url: 'https://nonexistent-domain-12345.com/api',
    expectedError: 'Network error'
  },
  
  // 解析错误
  parseError: {
    input: 'curl malformed command with "unclosed quotes',
    expectedError: 'Parse error'
  },
  
  // 验证错误
  validationError: {
    rule: {
      name: '',  // 空名称应该导致验证错误
      action: 'invalid_action',
      target: 'headers'
    },
    expectedError: 'Validation error'
  }
};

/**
 * 性能测试数据
 */
export const PERFORMANCE_TEST_DATA = {
  // 大量请求头
  manyHeaders: {
    count: 100,
    template: (i: number) => `-H 'custom-header-${i}: value-${i}'`
  },
  
  // 大量查询参数
  manyParams: {
    count: 50,
    template: (i: number) => `param${i}=value${i}`
  },
  
  // 大JSON数据
  largeJson: {
    size: 10000, // 字符数
    template: () => JSON.stringify({
      data: Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        name: `Item ${i}`,
        description: `Description for item ${i}`.repeat(10)
      }))
    })
  }
};

/**
 * 多语言测试数据
 */
export const I18N_TEST_DATA = {
  languages: ['zh', 'en'],
  
  // 预期的翻译文本
  expectedTexts: {
    zh: {
      title: 'cURL 过滤器',
      subtitle: '智能过滤和清理cURL命令',
      applyFilter: '应用过滤',
      clear: '清空'
    },
    en: {
      title: 'cURL Filter',
      subtitle: 'Intelligently filter and clean cURL commands',
      applyFilter: 'Apply Filter',
      clear: 'Clear'
    }
  }
};

/**
 * 生成随机测试数据
 */
export class TestDataGenerator {
  /**
   * 生成随机字符串
   */
  static randomString(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
  
  /**
   * 生成随机URL
   */
  static randomUrl(): string {
    const domains = ['api.example.com', 'test.api.com', 'service.test.org'];
    const paths = ['users', 'data', 'items', 'resources'];
    const domain = domains[Math.floor(Math.random() * domains.length)];
    const path = paths[Math.floor(Math.random() * paths.length)];
    return `https://${domain}/${path}`;
  }
  
  /**
   * 生成随机cURL命令
   */
  static randomCurlCommand(): string {
    const url = this.randomUrl();
    const method = Math.random() > 0.5 ? 'GET' : 'POST';
    const headers = [
      `'accept: application/json'`,
      `'authorization: Bearer ${this.randomString(32)}'`,
      `'user-agent: TestAgent/1.0'`
    ];
    
    let command = `curl '${url}'`;
    if (method !== 'GET') {
      command += ` -X ${method}`;
    }
    
    headers.forEach(header => {
      command += ` -H ${header}`;
    });
    
    if (method === 'POST') {
      command += ` -d '{"test":"${this.randomString(10)}"}'`;
    }
    
    return command;
  }
}
