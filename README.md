# Harei Frontend

## 项目简介
Harei Frontend 是一套基于 Next.js App Router 的前端站点，用于呈现 Harei 相关页面与互动功能，包括首页状态展示、提问箱、音乐列表、下载与舰长相关内容等页面模块。项目采用客户端渲染与静态资源结合的方式，页面之间通过路由分区组织。接口文档见 [`api.md`](./api.md)。

## 技术栈
- **框架**：Next.js 14（App Router）
- **语言**：TypeScript / React 18
- **样式**：Tailwind CSS
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
### 1) 安装依赖
```bash
npm install
```

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

## 接口与数据
- 后端接口清单：`api.md`
- 当前页面直接请求 `https://api.harei.cn`（无额外环境变量配置）

## 其他说明
- 项目主要页面位于 `app/` 目录下，各页面以文件夹路由组织。
- 静态图片资源位于 `public/` 目录。
- 缓存策略：图片缓存 1 个月，网页缓存 1 周。部署时建议配置如下缓存头以落地策略：
  - 图片（`/images/**` 等静态资源）：`Cache-Control: public, max-age=2592000, immutable`
  - 网页（HTML 路由响应）：`Cache-Control: public, max-age=604800, must-revalidate`
