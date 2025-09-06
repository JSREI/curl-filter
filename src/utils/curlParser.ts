// cURL命令解析和过滤工具

export interface ParsedCurl {
  url: string;
  method: string;
  headers: Record<string, string>;
  queryParams: Record<string, string>;
  formData: Record<string, string>;
  jsonBody: any;
  data?: string; // 原始数据，保持向后兼容
  otherOptions: string[];
}

// 需要保留的认证相关请求头
const AUTH_HEADERS = [
  'authorization',
  'x-api-key',
  'x-auth-token',
  'x-access-token',
  'bearer',
  'cookie',
  'x-csrf-token',
  'x-xsrf-token'
];

// 需要保留的内容相关请求头
const CONTENT_HEADERS = [
  'content-type',
  'content-length',
  'content-encoding',
  'accept',
  'accept-encoding',
  'accept-language'
];

/**
 * 解析URL中的查询参数
 */
function parseQueryParams(url: string): Record<string, string> {
  const queryParams: Record<string, string> = {};
  const urlObj = new URL(url);

  urlObj.searchParams.forEach((value, key) => {
    queryParams[key] = value;
  });

  return queryParams;
}

/**
 * 解析表单数据
 */
function parseFormData(data: string): Record<string, string> {
  const formData: Record<string, string> = {};

  if (!data) return formData;

  // 处理URL编码的表单数据
  const pairs = data.split('&');
  pairs.forEach(pair => {
    const [key, value] = pair.split('=');
    if (key) {
      formData[decodeURIComponent(key)] = value ? decodeURIComponent(value) : '';
    }
  });

  return formData;
}

/**
 * 尝试解析JSON数据
 */
function parseJsonBody(data: string): any {
  if (!data) return null;

  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

/**
 * 解析cURL命令
 */
export function parseCurl(curlCommand: string): ParsedCurl {
  const result: ParsedCurl = {
    url: '',
    method: 'GET',
    headers: {},
    queryParams: {},
    formData: {},
    jsonBody: null,
    otherOptions: []
  };

  // 移除多余的空格和换行符，处理反斜杠换行
  let cleanCommand = curlCommand.replace(/\\\s*\n/g, ' ').replace(/\s+/g, ' ').trim();
  
  // 使用正则表达式来正确解析带引号的参数
  const tokens = [];
  let current = '';
  let inQuotes = false;
  let quoteChar = '';
  
  for (let i = 0; i < cleanCommand.length; i++) {
    const char = cleanCommand[i];
    
    if (!inQuotes && (char === '"' || char === "'")) {
      inQuotes = true;
      quoteChar = char;
      current += char;
    } else if (inQuotes && char === quoteChar) {
      inQuotes = false;
      current += char;
      quoteChar = '';
    } else if (!inQuotes && char === ' ') {
      if (current.trim()) {
        tokens.push(current.trim());
        current = '';
      }
    } else {
      current += char;
    }
  }
  
  if (current.trim()) {
    tokens.push(current.trim());
  }
  
  // 解析tokens
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    
    if (token === 'curl') {
      continue;
    }
    
    // 解析方法
    if (token === '-X' || token === '--request') {
      if (i + 1 < tokens.length) {
        result.method = tokens[++i].replace(/["']/g, '');
      }
      continue;
    }
    
    // 解析请求头
    if (token === '-H' || token === '--header') {
      if (i + 1 < tokens.length) {
        const headerValue = tokens[++i].replace(/^["']|["']$/g, '');
        const colonIndex = headerValue.indexOf(':');
        if (colonIndex > 0) {
          const key = headerValue.substring(0, colonIndex).trim();
          const value = headerValue.substring(colonIndex + 1).trim();
          result.headers[key.toLowerCase()] = value;
        }
      }
      continue;
    }
    
    // 解析数据
    if (token === '-d' || token === '--data' || token === '--data-raw') {
      if (i + 1 < tokens.length) {
        result.data = tokens[++i].replace(/^["']|["']$/g, '');
      }
      continue;
    }
    
    // 解析URL
    if (token.startsWith('http://') || token.startsWith('https://')) {
      result.url = token.replace(/^["']|["']$/g, '');
      continue;
    }
    
    // 其他选项
    if (token.startsWith('-')) {
      result.otherOptions.push(token);
      // 如果下一个参数不是选项，也加入
      if (i + 1 < tokens.length && !tokens[i + 1].startsWith('-') && !tokens[i + 1].startsWith('http')) {
        result.otherOptions.push(tokens[++i]);
      }
    } else if (!token.startsWith('-') && !result.url && (token.includes('.') || token.includes('/'))) {
      // 如果没有找到URL，但这个token看起来像URL，就当作URL处理
      result.url = token.replace(/^["']|["']$/g, '');
    }
  }

  // 解析URL中的查询参数
  if (result.url) {
    try {
      result.queryParams = parseQueryParams(result.url);
    } catch (e) {
      // URL解析失败，忽略查询参数
      result.queryParams = {};
    }
  }

  // 解析请求体数据
  if (result.data) {
    // 检查Content-Type来决定如何解析数据
    const contentType = result.headers['content-type'] || '';

    if (contentType.includes('application/json')) {
      result.jsonBody = parseJsonBody(result.data);
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      result.formData = parseFormData(result.data);
    } else {
      // 尝试自动检测数据格式
      const jsonBody = parseJsonBody(result.data);
      if (jsonBody !== null) {
        result.jsonBody = jsonBody;
      } else {
        // 尝试解析为表单数据
        result.formData = parseFormData(result.data);
      }
    }
  }

  return result;
}

/**
 * 过滤请求头，只保留认证和内容相关的请求头
 */
export function filterHeaders(headers: Record<string, string>, customKeepHeaders: string[] = []): Record<string, string> {
  const filtered: Record<string, string> = {};
  const keepHeaders = [...AUTH_HEADERS, ...CONTENT_HEADERS, ...customKeepHeaders.map(h => h.toLowerCase())];
  
  Object.entries(headers).forEach(([key, value]) => {
    const lowerKey = key.toLowerCase();
    if (keepHeaders.some(keepHeader => lowerKey.includes(keepHeader))) {
      filtered[key] = value;
    }
  });
  
  return filtered;
}

/**
 * 重新构建cURL命令
 */
export function buildCurl(parsed: ParsedCurl, filteredHeaders: Record<string, string>): string {
  let command = 'curl';
  
  // 添加方法
  if (parsed.method !== 'GET') {
    command += ` -X ${parsed.method}`;
  }
  
  // 添加过滤后的请求头
  Object.entries(filteredHeaders).forEach(([key, value]) => {
    command += ` -H "${key}: ${value}"`;
  });
  
  // 添加数据
  if (parsed.data) {
    command += ` -d "${parsed.data}"`;
  }
  
  // 添加其他选项（排除一些可能有问题的选项）
  const safeOptions = parsed.otherOptions.filter(opt => 
    !opt.includes('user-agent') && 
    !opt.includes('referer') && 
    !opt.includes('origin')
  );
  if (safeOptions.length > 0) {
    command += ` ${safeOptions.join(' ')}`;
  }
  
  // 添加URL
  command += ` "${parsed.url}"`;
  
  return command;
}

/**
 * 获取默认的过滤规则说明
 */
export function getFilterRules(): string[] {
  return [
    '保留认证相关请求头: Authorization, X-API-Key, Cookie等',
    '保留内容相关请求头: Content-Type, Accept等',
    '移除浏览器特定请求头: User-Agent, Referer, Origin等',
    '移除缓存相关请求头: If-None-Match, If-Modified-Since等',
    '移除调试相关请求头: X-Requested-With等'
  ];
}