# GitHub Pages 自动部署配置

本项目已配置为使用 GitHub Actions 自动部署到 GitHub Pages。

## 配置说明

### 1. GitHub Actions 工作流

工作流文件位于 `.github/workflows/deploy.yml`，包含以下功能：

- **触发条件**：
  - 推送到 `main` 分支时自动触发
  - 支持手动触发（workflow_dispatch）

- **构建过程**：
  - 使用 Node.js 20
  - 安装依赖：`npm ci`
  - 构建项目：`npm run build`
  - 上传构建产物到 GitHub Pages

- **部署过程**：
  - 自动部署到 GitHub Pages
  - 使用 GitHub 提供的官方 Actions

### 2. Vite 配置

`vite.config.ts` 已配置为适配 GitHub Pages：

- **base 路径**：设置为 `/curl-filter/` 以匹配实际部署路径
- **构建输出**：输出到 `dist` 目录
- **源映射**：启用源映射文件用于调试

### 3. GitHub Pages 设置

需要在 GitHub 仓库中进行以下设置：

1. 进入仓库的 **Settings** 页面
2. 找到 **Pages** 部分
3. 在 **Source** 中选择 **GitHub Actions**
4. 保存设置

### 4. 部署流程

1. 将代码推送到 `main` 分支
2. GitHub Actions 自动触发构建
3. 构建成功后自动部署到 GitHub Pages
4. 网站将在 `https://jsrei.github.io/curl-filter/` 可访问

### 5. 本地测试

在推送前可以本地测试构建：

```bash
# 安装依赖
npm install

# 构建项目
npm run build

# 预览构建结果
npm run preview
```

### 6. 故障排除

- **构建失败**：检查 Actions 页面的构建日志
- **页面无法访问**：确认 GitHub Pages 设置正确
- **资源加载失败**：检查 `base` 路径配置是否正确

## 注意事项

- 确保所有代码更改都推送到 `main` 分支
- 构建过程中的任何 TypeScript 错误都会导致部署失败
- 首次部署可能需要几分钟时间生效
- 如果GitHub Actions没有触发，请检查仓库的Actions设置是否启用

## 故障排除步骤

如果GitHub Actions没有自动触发：

1. **检查Actions权限**：
   - 进入仓库 Settings → Actions → General
   - 确保 "Allow all actions and reusable workflows" 已启用

2. **检查Pages设置**：
   - 进入仓库 Settings → Pages
   - Source 必须设置为 "GitHub Actions"

3. **手动触发**：
   - 进入仓库的 Actions 页面
   - 选择 "部署到 GitHub Pages" 工作流
   - 点击 "Run workflow" 手动触发
