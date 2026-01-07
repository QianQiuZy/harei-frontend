const sections = [
  {
    title: '基础架构',
    description: '基于 Next.js App Router 的静态页面骨架，支持扩展模块化页面与组件。'
  },
  {
    title: '静态资源',
    description: '统一使用 public/images 作为图片与静态文件存放路径，便于管理与部署。'
  },
  {
    title: '可扩展布局',
    description: '预置全局布局与样式文件，可直接追加业务页面与组件。'
  }
];

export default function HomePage() {
  return (
    <div className="page">
      <section className="hero" id="overview">
        <div>
          <p className="eyebrow">静态前端架构</p>
          <h1>React + Next.js 静态界面基础工程</h1>
          <p className="lead">
            已预置核心目录结构、全局布局与样式，并配置静态资源目录。
          </p>
        </div>
        <div className="hero-card" id="assets">
          <h2>静态资源目录</h2>
          <p>
            图片与静态文件请放置于 <code>public/images</code>，可通过
            <code>/images/xxx.png</code> 访问。
          </p>
          <div className="placeholder">示例占位区域</div>
        </div>
      </section>

      <section className="grid" id="sections">
        {sections.map((section) => (
          <article className="card" key={section.title}>
            <h3>{section.title}</h3>
            <p>{section.description}</p>
          </article>
        ))}
      </section>

      <section className="note">
        <h2>下一步建议</h2>
        <ul>
          <li>在 app/ 目录下新增页面（如 app/about/page.tsx）。</li>
          <li>在 components/ 目录下沉淀通用组件并引入到页面。</li>
          <li>将品牌图片、图标等静态文件放入 public/images。</li>
        </ul>
      </section>
    </div>
  );
}
