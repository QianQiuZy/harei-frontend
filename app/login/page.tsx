'use client';

import { useEffect, useState } from 'react';
import { submitAnchor, useActionFeedback } from '@/components/member/ActionFeedback';
import { HTTPError } from 'ky';
import { useHydrated } from '@/lib/use-hydrated';
import {
  ADMIN_SCOPE,
  login,
  saveSession,
  selectSession,
  verifySession
} from '@/lib/auth/session';

export default function LoginPage() {
  const hydrated = useHydrated();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const setMessage = useActionFeedback();

  useEffect(() => {
    const stored = selectSession(ADMIN_SCOPE, window.localStorage);
    if (!stored) return;
    void verifySession(stored.session.token)
      .then((session) => {
        if (session.scopes.includes(ADMIN_SCOPE)) window.location.replace('/admin');
      })
      .catch(() => undefined);
  }, []);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const anchor = submitAnchor(event);
    const data = new FormData(event.currentTarget);
    const username = String(data.get('username') ?? '').trim();
    const password = String(data.get('password') ?? '');
    if (!username || !password) {
      setMessage({ text: '请输入用户名和密码。', error: true, anchor });
      return;
    }
    setIsSubmitting(true);
    setMessage(null);
    try {
      const response = await login('admin', username, password);
      if (!response.scopes.includes(ADMIN_SCOPE)) throw new Error('账号没有后台权限');
      saveSession('admin', response, window.localStorage);
      window.location.replace('/admin');
    } catch (error) {
      if (error instanceof HTTPError && error.response.status === 401) {
        setMessage({ text: '用户名或密码错误。', error: true, anchor });
      } else {
        setMessage({ text: error instanceof Error ? error.message : '登录失败', error: true, anchor });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="login-page">
      <div className="login-card">
        <h1 className="login-title">后台登录</h1>
        <p className="login-subtitle">请输入主后台账号以继续。</p>
        <form className="login-form" method="post" onSubmit={submit}>
          <label className="login-field">
            <span className="login-label">用户名</span>
            <input
              className="login-input"
              name="username"
              autoComplete="username"
            />
          </label>
          <label className="login-field">
            <span className="login-label">密码</span>
            <input
              className="login-input"
              type="password"
              name="password"
              autoComplete="current-password"
            />
          </label>
          <button className="login-button" type="submit" disabled={!hydrated || isSubmitting}>
            {isSubmitting ? '登录中…' : '登录'}
          </button>
        </form>
      </div>
    </section>
  );
}
