# cURL 过滤器

中文 | [English](README.md)

一个强大的基于Web的工具，用于通过可配置规则过滤和编辑cURL命令。非常适合清理从浏览器开发者工具复制的cURL命令，然后导入到外部系统中。

## 🚀 在线演示

访问：[https://jsrei.github.io/curl-filter/](https://jsrei.github.io/curl-filter/)

## 🎯 解决的问题

当你从Chrome开发者工具（或其他浏览器）复制请求为cURL时，它会包含许多你可能不需要的默认请求头和参数：

- 不必要的请求头，如 `User-Agent`、`Accept-Language`、`Accept-Encoding` 等
- 浏览器特定的请求头，如 `sec-ch-ua`、`sec-fetch-*` 请求头
- 不应该共享的认证cookie
- 冗余的查询参数

这个工具通过应用可配置的过滤规则来帮助你清理这些cURL命令。

## 🔧 使用场景

- **API测试工具**：在导入到Postman、Apifox、Insomnia之前清理cURL命令
- **Coze插件开发**：为插件配置准备干净的API请求
- **文档编写**：为API文档生成干净的cURL示例
- **安全考虑**：从共享的cURL命令中移除敏感的请求头和cookie
- **自动化脚本**：为脚本和CI/CD流水线标准化cURL命令

## ✨ 功能特性

- **智能过滤**：移除不需要的请求头、查询参数和表单数据
- **可配置规则**：使用正则表达式创建自定义过滤规则
- **实时预览**：输入时即可看到过滤结果
- **输入验证**：智能检测和验证cURL命令
- **快速开始**：一键示例立即开始使用
- **键盘快捷键**：高效的键盘快捷键工作流
- **历史管理**：跟踪你的过滤历史记录
- **导出/导入**：保存和分享你的过滤规则
- **规则模板**：常见使用场景的预置模板
- **多语言支持**：支持中文和英文
- **响应式设计**：在桌面和移动设备上都能正常工作

## 🛠️ 安装

### 前置要求

- Node.js 18+ 
- npm 或 yarn

### 本地开发

1. 克隆仓库：
```bash
git clone https://github.com/JSREI/curl-filter.git
cd curl-filter
```

2. 安装依赖：
```bash
npm install
```

3. 启动开发服务器：
```bash
npm run dev
# 或使用提供的脚本
./start.sh
```

4. 打开浏览器访问 `http://localhost:25519`

### 生产构建

```bash
npm run build
```

构建文件将在 `dist` 目录中。

## 📖 使用方法

### 快速开始

1. **试用示例**：点击"使用示例"加载示例cURL命令
2. **配置规则**：点击"规则管理"(Ctrl+M) 设置过滤规则
3. **应用过滤**：点击"应用过滤规则"(Ctrl+Enter) 处理你的cURL命令
4. **复制结果**：使用复制按钮复制清理后的cURL命令

### 详细步骤

1. **粘贴cURL命令**：从浏览器开发者工具复制cURL命令并粘贴到输入框中。工具会自动验证你的输入。

2. **配置规则**：点击"规则管理"设置过滤规则：
   - 移除特定请求头（如 `User-Agent`、`Accept-Language`）
   - 过滤查询参数
   - 清理表单数据
   - 移除JSON请求体字段
   - 使用预置模板应对常见场景

3. **应用过滤**：点击"应用过滤规则"处理你的cURL命令。你也可以使用Ctrl+Enter快速处理。

4. **复制结果**：使用复制按钮复制清理后的cURL命令。

### 键盘快捷键

- **Ctrl+Enter**：应用过滤规则
- **Ctrl+K**：清空输入
- **Ctrl+M**：打开规则管理

### 示例

**过滤前：**
```bash
curl 'https://api.example.com/users?page=1' \
  -H 'accept: application/json' \
  -H 'accept-language: en-US,en;q=0.9,zh-CN;q=0.8' \
  -H 'cache-control: no-cache' \
  -H 'sec-ch-ua: "Chrome";v="120"' \
  -H 'sec-fetch-dest: empty' \
  -H 'user-agent: Mozilla/5.0...'
```

**过滤后：**
```bash
curl 'https://api.example.com/users?page=1' \
  -H 'accept: application/json' \
  -H 'cache-control: no-cache'
```

## 🔧 配置

工具支持各种过滤规则：

- **请求头过滤**：移除或修改HTTP请求头
- **查询参数过滤**：清理URL参数  
- **表单数据过滤**：过滤表单字段
- **JSON请求体过滤**：移除JSON属性
- **自定义模式**：使用正则表达式进行高级过滤

## 🤝 贡献

欢迎贡献！请随时提交Pull Request。

1. Fork 仓库
2. 创建你的功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交你的更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开一个Pull Request

## 📄 许可证

本项目基于MIT许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

- 使用React、TypeScript和Vite构建
- UI组件来自Material-UI
- 部署在GitHub Pages上

## 📞 支持

如果你有任何问题或需要帮助，请：

1. 查看 [Issues](https://github.com/JSREI/curl-filter/issues) 页面
2. 如果你的问题还没有被报告，创建一个新的issue
3. 提供关于你的使用场景的详细信息
