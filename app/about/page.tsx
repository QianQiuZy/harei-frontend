import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const ABOUT_MARKDOWN = `# 花礼Harei的小空间

> 本站由**千秋紫莹**个人搭建与维护；一切纠纷与**花礼 Harei**无关。

## 🧩概览

- **维护方式**：自建服务 + 云资源托管
- **代码开源**：MIT许可证开源
  - 后端仓库：[harei-backend](https://github.com/QianQiuZy/harei-backend)
  - 前端仓库：[harei-frontend](https://github.com/QianQiuZy/harei-frontend)

---

## 🛠️技术栈

### 🧱后端（FastAPI）

- **架构**：FastAPI + Uvicorn
- **数据层**：MySQL / Redis
- **ORM / 连接**：SQLAlchemy / Redis Client
- **安全与认证**：Argon2（密码哈希）
- **能力扩展**：BLiveDM（直播间监控）

### 🖥️前端（React / Next.js）

- **架构**：React + Next.js
- **UI 体系**：shadcn/ui + Tailwind CSS + Radix UI
- **类型与动画**：TypeScript + Framer Motion

---

## ☁️运维与成本

**服务商**：腾讯云

 - 服务器：轻量服务器 4C8G，2C2G×2
 - 域名：3 个
 - CDN：腾讯云 EO

- 💳**年度维护成本**：约 **2,000 元/年**

---

## 💡VR斗虫相关

 - 斗虫源码：[VR_douchong](https://github.com/QianQiuZy/VR_douchong)
 - 斗虫衍生：[hihi粉丝站](https://dc.hihivr.top)
 - 斗虫QQbot插件：[nonebot2-plugin](https://github.com/QianQiuZy/nonebot-plugin-vrpspdouchong)

---

## 🗓️时间线

- **2024-10-11**：项目初建立
- **2024-10-13**：正式上线
- **2026-01-09**：项目完全重写

---

## 👤关于作者

- ✉️邮箱：qianqiuzy@qq.com
- 🔗Bilibili：[千秋紫莹](https://space.bilibili.com/351708822)
- 👋赞助支持：[爱发电](https://ifdian.net/a/qianqiuzy)
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
