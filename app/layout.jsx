import './globals.css';

export const metadata = {
  title: 'Harei Frontend',
  description: 'Static frontend scaffold for Harei.'
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <body>
        <div className="app-shell">
          <header className="app-header">
            <div className="brand">Harei Frontend</div>
            <nav className="nav">
              <a href="#overview">概览</a>
              <a href="#sections">区块</a>
              <a href="#assets">静态资源</a>
            </nav>
          </header>
          <main className="app-main">{children}</main>
          <footer className="app-footer">© 2025 Harei. All rights reserved.</footer>
        </div>
      </body>
    </html>
  );
}
