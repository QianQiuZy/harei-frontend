'use client';

import Image from 'next/image';
import DocumentLink from '@/components/DocumentLink';
import { usePathname } from 'next/navigation';
import { Fragment, useEffect, useRef, type ReactNode } from 'react';
import { request, type Profile } from '@/lib/member';
import { ActionForm, s } from './MemberUI';
import { useMemberData } from './useMemberData';

type Props = {
  title?: string;
  watchGifts?: boolean;
  loginQuery: string;
  children: (profile: Profile, reload: () => Promise<void>) => ReactNode;
};

export default function PersonalShell({ title, loginQuery, children, watchGifts = false }: Props) {
  const pathname = usePathname();
  const { data: profile, error, reload, clear } = useMemberData<Profile>('/me', loginQuery);
  const refreshedThrough = useRef(0);
  useEffect(() => {
    if (!watchGifts || !profile) return;
    let nextDeadline = Infinity;
    for (const gift of profile.gifts) {
      if (gift.frozen_at || (gift.state !== 'open' && gift.state !== 'grace')) continue;
      const boundary = gift.grace_until || gift.deadline;
      if (!boundary) continue;
      const deadline = Date.parse(boundary + '+08:00');
      if (deadline > refreshedThrough.current) nextDeadline = Math.min(nextDeadline, deadline);
    }
    if (!Number.isFinite(nextDeadline)) return;
    let timer: ReturnType<typeof setTimeout>;
    function schedule() {
      const now = Date.now();
      const remaining = nextDeadline - now;
      if (remaining <= 0) {
        refreshedThrough.current = now;
        void reload();
      } else {
        timer = setTimeout(schedule, Math.min(remaining + 30, 2147483647));
      }
    }
    schedule();
    return () => clearTimeout(timer);
  }, [profile, reload, watchGifts]);
  return (
    <div className={`${s.page} ${s.workspace} ${s.personal}`}>
      <header className={`${s.workspaceHeader} ${s.personalHeader}`}>
        <div className={s.authHeader}>
          <Image src="/images/icon/gift-address.png" width={60} height={60} alt="" unoptimized />
          <div>
            <h1>{title ?? '个人中心'}</h1>
            {profile && <p>{profile.email}</p>}
          </div>
        </div>
        {profile && (
          <>
            <ActionForm
              submit="退出登录"
              action={async () => {
                await request('/user-auth/logout', {});
                clear();
                sessionStorage.removeItem('harei-binding-flow:' + profile.email);
                window.location.replace('/account/login');
              }}
            />
            <nav className={s.personalActions} aria-label="个人中心导航">
              {[
                ['/personal', '个人中心'],
                ['/personal/bindings', 'UID绑定'],
                ['/personal/security', '账号安全']
              ].map(([href, label]) => (
                <DocumentLink
                  key={href}
                  className={s.personalButton}
                  href={href}
                  aria-current={pathname === href ? 'page' : undefined}
                >
                  {label}
                </DocumentLink>
              ))}
            </nav>
          </>
        )}
      </header>
      {error && (
        <p role="alert">
          {error} <button onClick={() => void reload()}>重试</button>
        </p>
      )}
      {!profile && !error && <p className={s.empty}>正在读取账号…</p>}
      {profile && <Fragment key={profile.email}>{children(profile, reload)}</Fragment>}
    </div>
  );
}
