import './globals.css';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { AppShell } from '@/components/AppShell';

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
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
