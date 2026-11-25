'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Fragment, useCallback, useEffect, useState, type ReactNode } from 'react';
import { ApiError, onMemberSessionChange, request, type Profile } from '@/lib/member';
import { ActionForm, errorText, s } from './MemberUI';

type Props = {
  title?: string;
  watchGifts?: boolean;
  loginQuery: string;
  children: (profile: Profile, reload: () => Promise<void>) => ReactNode;
};

export default function PersonalShell({ title, loginQuery, children, watchGifts = false }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  const reload = useCallback(async () => {
    setRevision((n) => n + 1);
  }, []);
  useEffect(() => {
    window.addEventListener('focus', reload);
    const unsubscribe = onMemberSessionChange(() => {
      setProfile(null);
      void reload();
    });
    return () => {
      window.removeEventListener('focus', reload);
      unsubscribe();
    };
  }, [reload]);
  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout>;
    async function fetchProfile() {
      try {
        const result = await request<Profile>('/me');
        if (active) {
          setProfile(result);
          setError('');
        }
      } catch (err) {
        if (!active) return;
        if (err instanceof ApiError && err.status === 401) {
          setProfile(null);
          router.replace('/account/login' + loginQuery);
          return;
        }
        setError(errorText(err));
      }
      if (active && watchGifts && !document.hidden) timer = setTimeout(fetchProfile, 5000);
    }
    const onVisible = () => {
      clearTimeout(timer);
      if (!document.hidden) void reload();
    };
    if (watchGifts) document.addEventListener('visibilitychange', onVisible);
    void fetchProfile();
    return () => {
      active = false;
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [revision, router, loginQuery, watchGifts, reload]);
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
                setProfile(null);
                sessionStorage.removeItem('harei-binding-flow:' + profile.email);
                router.replace('/account/login');
              }}
            />
            <nav className={s.personalActions} aria-label="个人中心导航">
              {[
                ['/personal', '个人中心'],
                ['/personal/bindings', 'UID绑定'],
                ['/personal/security', '账号安全']
              ].map(([href, label]) => (
                <Link
                  key={href}
                  className={s.personalButton}
                  href={href}
                  aria-current={pathname === href ? 'page' : undefined}
                >
                  {label}
                </Link>
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
