'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { BackgroundSlideshow } from '@/components/background/BackgroundSlideshow';
import { Sidebar } from '@/components/Sidebar';

const LOGIN_PATH = '/login';

type AppShellProps = {
  children: ReactNode;
};

export const AppShell = ({ children }: AppShellProps) => {
  const pathname = usePathname();
  const isLogin = pathname === LOGIN_PATH;

  return (
    <>
      {!isLogin ? <BackgroundSlideshow /> : null}
      <div className={isLogin ? 'login-shell' : 'app-shell'}>
        {!isLogin ? <Sidebar /> : null}
        <main className={isLogin ? 'login-main' : 'app-main'}>{children}</main>
      </div>
    </>
  );
};
