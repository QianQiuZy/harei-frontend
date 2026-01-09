import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const ABOUT_MARKDOWN = `# 花礼Harei的小空间

> 本站由 **千秋紫莹** 个人搭建与维护；一切纠纷与 **花礼 Harei** 无关。

## 概览

- **维护方式**：自建服务 + 云资源托管
- **代码开源**：
  - 后端仓库：https://github.com/QianQiuZy/harei-backend
  - 前端仓库：https://github.com/QianQiuZy/harei-frontend

---

## 技术栈

### 后端（FastAPI）

- **架构**：FastAPI + Uvicorn
- **数据层**：MySQL / Redis
- **ORM / 连接**：SQLAlchemy / Redis Client
- **安全与认证**：Argon2（密码哈希）
- **能力扩展**：BLiveDM（直播间监控）

| 模块 | 选型 |
| --- | --- |
| Web 框架 | FastAPI |
| ASGI Server | Uvicorn |
| 关系型数据库 | MySQL |
| 缓存/队列 | Redis |
| ORM | SQLAlchemy |
| 密码哈希 | Argon2 |
| 直播监控 | BLiveDM |

### 前端（React / Next.js）

- **架构**：React + Next.js
- **UI 体系**：shadcn/ui + Tailwind CSS + Radix UI
- **类型与动画**：TypeScript + Framer Motion

| 模块 | 选型 |
| --- | --- |
| 前端框架 | React |
| SSR/工程化 | Next.js |
| UI 组件 | shadcn/ui、Radix UI |
| 样式 | Tailwind CSS |
| 语言 | TypeScript |
| 动效 | Framer Motion |

---

## 运维与成本

> 以下资源均使用腾讯云。

| 资源 | 规格/数量 | 说明 |
| --- | --- | --- |
| 服务器 | 轻量服务器 4C8G | 承载后端与核心服务 |
| 域名 | 1 个 | 主站/子域名 |
| CDN | 腾讯云 EO | 静态资源与加速 |

- **年度维护成本**：约 **2,000 元/年**（以实际账单为准）

---

## 时间线

- **2024-10-11**：项目初建立  
- **2024-10-13**：正式上线  
- **2026-01-09**：项目完全重写  

---

## 关于作者

- 邮箱：qianqiuzy@qq.com  
- Bilibili：<https://space.bilibili.com/351708822>  
- 赞助支持：<https://afdian.com/a/qianqiuzy>  
`;

export default function AboutPage() {
  return (
    <div className="about-page">
      <div className="about-card">
        <img
          src="/images/icon/avatar.jpg"
          alt="花礼Harei"
          className="about-avatar"
        />
        <div className="about-content">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{ABOUT_MARKDOWN}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
