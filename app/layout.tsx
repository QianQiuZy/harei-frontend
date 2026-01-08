import './globals.css';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { BackgroundAnimationToggle } from '@/components/background/BackgroundAnimationToggle';
import { BackgroundSlideshow } from '@/components/background/BackgroundSlideshow';

export const metadata: Metadata = {
  title: '花礼harei的小空间',
  description: 'Static frontend scaffold for Harei.',
  icons: {
    icon: [
      { url: '/images/icon/16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/images/icon/32x32.png', sizes: '32x32', type: 'image/png' }
    ]
  }
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <BackgroundSlideshow />
        <div className="app-shell">
          <header className="app-header">
            <div className="brand">Harei Frontend</div>
            <nav className="nav">
              <a href="#overview">概览</a>
              <a href="#sections">区块</a>
              <a href="#assets">静态资源</a>
            </nav>
            <BackgroundAnimationToggle />
          </header>
          <main className="app-main">{children}</main>
          <footer className="app-footer">© 2025 Harei. All rights reserved.</footer>
        </div>
      </body>
    </html>
  );
}
