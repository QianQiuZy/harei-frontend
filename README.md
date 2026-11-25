# Harei Frontend

## 项目简介
Harei Frontend 是一套基于 Next.js App Router 的前端站点，用于呈现 Harei 相关页面与互动功能，包括首页状态展示、提问箱、音乐列表、下载与舰长相关内容等页面模块。项目采用客户端渲染与静态资源结合的方式，页面之间通过路由分区组织。接口文档见 [`api.md`](./api.md)。

## 技术栈
- **运行环境**：Node.js 26.13.1（版本见 `.nvmrc`，最低要求见 `package.json`）
- **框架**：Next.js 16（App Router）
- **语言**：TypeScript 7（独立类型检查）/ TypeScript 6 兼容 API / React 19
- **样式**：Tailwind CSS 4（`@tailwindcss/postcss`）
- **组件与工具**：Radix UI Slot、clsx、tailwind-merge、framer-motion

## 目录结构
```
app/                # 路由与页面
components/         # 复用组件
lib/                # 工具与通用方法
public/             # 静态资源
api.md              # 后端接口清单
```

## 快速开始
### 1) 选择 Node.js 并安装依赖
```bash
nvm install
nvm use
npm ci
```

未使用 nvm 时，手动安装 Node.js 26.13.1 或兼容的 26.x 新版本。部署时用同一版本的 Node.js 安装依赖、构建并启动服务；跨主版本升级后执行 `npm ci` 和完整构建，不复用旧的 `node_modules` 或 `.next`。若使用 PM2/systemd，确认服务进程也切换到了新的 Node.js 可执行文件。

### 2) 本地开发
```bash
npm run dev
```

### 3) 构建与启动
```bash
npm run build
npm run start
```

## 常用脚本
- `npm run dev`：启动本地开发服务器
- `npm run build`：构建生产包
- `npm run start`：以生产模式启动服务
- `npm run lint`：运行 ESLint 规范检查
- `npm run typecheck`：使用 TypeScript 7.0.2 运行类型检查
- `npm test`：运行 Vitest 测试

Next.js 16 的构建不再自动执行 ESLint；CI 分别运行构建、类型检查、ESLint 和测试。ESLint 已升级到 10.15.0，继续使用 `eslint-config-next/core-web-vitals`，检查 Next.js、React Hooks、React、无障碍与导入规则；不额外启用 TypeScript 类型感知规则。

`eslint-plugin-react`、`eslint-plugin-import` 和 `eslint-plugin-jsx-a11y` 的 peer 声明尚未覆盖 ESLint 10，因此 `package.json` 对这三个插件的 ESLint peer 使用定向 `overrides`。Next.js 配置已包含旧规则 API 的兼容包装，项目实际检查通过；安装仍启用严格 peer 校验，不使用 `--force` 或 `--legacy-peer-deps`。待这些插件正式声明支持 ESLint 10 后，可移除对应覆盖并重新验证。

项目并行安装两个 TypeScript 包。`typescript-native-cli` 指向稳定版 TypeScript 7.0.2，提供独立类型检查使用的 `tsc`。`typescript` 指向 `@typescript/typescript6`，为 Next.js 和 ESLint 提供兼容的编译器 API。ESLint 将 `@typescript/native` 用作可选的预览版接口，所以项目使用独立的 CLI 别名。

Tailwind CSS 4 要求现代浏览器：Chrome/Edge 111+、Safari 16.4+、Firefox 128+。

此前一次升级已在 WSL/Linux x64 的 Node.js 26.12.1 下验证：严格依赖安装、生产构建、类型检查和 32 项测试通过；ESLint 为 0 错误、15 条既有图片优化警告。Chromium 桌面/移动视口共检查 10 次页面加载，并验证 9 类交互和模拟后端下的 8 项代理检查（含 Brotli 响应解码）。这些是本地验证，未部署或连接真实后台执行管理操作。

2026-11-25 升级到 Next.js 16.4.6 后，生产依赖和完整依赖树的 npm 审计均为 0 项已知漏洞。

## 接口与数据
- 后端接口清单：`api.md`
- 浏览器请求使用根目录 `.env` 的配置。默认 `NEXT_PUBLIC_API_MODE=auto`，`npm run dev` 访问 `http://localhost:6555`，生产构建访问 `https://api.harei.cn`。本地后端使用 `uvicorn app.main:app --port 6555`。
- 可设置 `NEXT_PUBLIC_API_MODE=local` 或 `production`，也可通过 `NEXT_PUBLIC_API_BASE_URL` 直接覆盖地址。Next.js 服务端代理在开发与生产环境均默认直连 `http://127.0.0.1:6555`，可用 `HAREI_BACKEND_API_URL` 单独设置。更改公开变量后重启开发服务或重新构建生产包。

## 其他说明

本地调试可通过 `http://localhost:3000` 或 `http://127.0.0.1:3000` 打开。默认本地 API 使用页面的回环主机名和 6555 端口。本地使用系统字体，生产页面加载原有字体样式表。
- 项目主要页面位于 `app/` 目录下，各页面以文件夹路由组织。
- 静态图片资源位于 `public/` 目录。
- 缓存策略：公开的版本化静态图片可缓存 1 年。需要管理员登录的图片由页面在当前会话内缓存，代理响应使用 `private, no-store`。网页不缓存。部署时建议配置如下缓存头以落地策略：
  - 公开的版本化图片、css、js：`public, immutable, max-age=31536000`
  - 网页（HTML 路由响应）：`must-revalidate, proxy-revalidate, no-cache, no-store, max-age=0`
