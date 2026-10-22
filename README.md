# Harei Frontend

## 项目简介
Harei Frontend 是一套基于 Next.js App Router 的前端站点，用于呈现 Harei 相关页面与互动功能，包括首页状态展示、提问箱、音乐列表、下载与舰长相关内容等页面模块。项目采用客户端渲染与静态资源结合的方式，页面之间通过路由分区组织。接口文档见 [`api.md`](./api.md)。

## 技术栈
- **运行环境**：Node.js 26.12.1（版本见 `.nvmrc`，最低要求见 `package.json`）
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

未使用 nvm 时，手动安装 Node.js 26.12.1 或兼容的 26.x 新版本。部署时用同一版本的 Node.js 安装依赖、构建并启动服务；跨主版本升级后执行 `npm ci` 和完整构建，不复用旧的 `node_modules` 或 `.next`。若使用 PM2/systemd，确认服务进程也切换到了新的 Node.js 可执行文件。

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

Next.js 16 的构建不再自动执行 ESLint；CI 分别运行构建、类型检查、ESLint 和测试。ESLint 已升级到 10.13.0，继续使用 `eslint-config-next/core-web-vitals`，检查 Next.js、React Hooks、React、无障碍与导入规则；不额外启用 TypeScript 类型感知规则。

`eslint-plugin-react`、`eslint-plugin-import` 和 `eslint-plugin-jsx-a11y` 的 peer 声明尚未覆盖 ESLint 10，因此 `package.json` 对这三个插件的 ESLint peer 使用定向 `overrides`。Next.js 配置已包含旧规则 API 的兼容包装，项目实际检查通过；安装仍启用严格 peer 校验，不使用 `--force` 或 `--legacy-peer-deps`。待这些插件正式声明支持 ESLint 10 后，可移除对应覆盖并重新验证。

TypeScript 采用[微软官方并行方案](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/#running-side-by-side-with-typescript-6-0)：`@typescript/native` 是 TypeScript 7.0.2 的 npm 别名，提供 `tsc`；`typescript` 是 `@typescript/typescript6` 的别名，为 ESLint 和 Next.js 提供 TypeScript 6.0.3 API 与 `tsc6`。因此独立类型检查使用 TS 7，而 Next.js 构建内的类型检查仍使用 TS 6；两者均须通过。不能直接将 `typescript` 替换为 7，因为当前 typescript-eslint 仍需要旧编译器 API。编辑器也不会因该 npm 别名自动切换到 TS 7，需要按编辑器文档另行配置。

Tailwind CSS 4 要求现代浏览器：Chrome/Edge 111+、Safari 16.4+、Firefox 128+。

本次升级已在 WSL/Linux x64 的 Node.js 26.12.1 下验证：严格依赖安装、生产构建、类型检查和 32 项测试通过；ESLint 为 0 错误、15 条既有图片优化警告。Chromium 桌面/移动视口共检查 10 次页面加载，并验证 9 类交互和模拟后端下的 8 项代理检查（含 Brotli 响应解码）。这些是本地验证，未部署或连接真实后台执行管理操作。

2026-10-22 依赖升级时，生产依赖 `npm audit --omit=dev` 为 0；完整审计仍报告开发工具链中的 `braces`（[CVE-2026-93687](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm)，上游暂无修复版本），经由 ESLint 的 glob 依赖关联到 5 个包。未使用 `npm audit fix --force` 降级框架。

## 接口与数据
- 后端接口清单：`api.md`
- 当前页面直接请求 `https://api.harei.cn`（无额外环境变量配置）
- 浏览器端 API 客户端使用 `NEXT_PUBLIC_API_BASE_URL`（默认 `https://api.harei.cn`）；不要将其设为 `127.0.0.1`，因为浏览器中的 loopback 指向访客自己的设备。
- Next.js 服务端 API 代理使用 `HAREI_BACKEND_API_URL`（默认 `http://127.0.0.1:6555`）直连同机后端。只有 Next.js 与后端部署在同一台主机时使用默认值；分开部署时在 Next.js 服务端环境中设置该地址，不要加 `NEXT_PUBLIC_` 前缀。

## 其他说明
- 项目主要页面位于 `app/` 目录下，各页面以文件夹路由组织。
- 静态图片资源位于 `public/` 目录。
- 缓存策略：图片缓存1年，网页不缓存。部署时建议配置如下缓存头以落地策略：
  - 图片、css、js：`public, immutable, max-age=31536000`
  - 网页（HTML 路由响应）：`must-revalidate, proxy-revalidate, no-cache, no-store, max-age=0`
