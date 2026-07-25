'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ADMIN_SCOPE,
  login,
  saveSession,
  selectSession,
  verifySession
} from '@/lib/auth/session';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const stored = selectSession(ADMIN_SCOPE, window.localStorage);
    if (!stored) return;
    void verifySession(stored.session.token)
      .then((session) => {
        if (session.scopes.includes(ADMIN_SCOPE)) router.replace('/admin');
      })
      .catch(() => undefined);
  }, [router]);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!username.trim() || !password) {
      setMessage('请输入用户名和密码。');
      return;
    }
    setIsSubmitting(true);
    setMessage(null);
    try {
      const response = await login('admin', username.trim(), password);
      if (!response.scopes.includes(ADMIN_SCOPE)) throw new Error('账号没有后台权限');
      saveSession('admin', response, window.localStorage);
      router.replace('/admin');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '登录失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="login-page">
      <div className="login-card">
        <h1 className="login-title">后台登录</h1>
        <p className="login-subtitle">请输入主后台账号以继续。</p>
        <form className="login-form" onSubmit={submit}>
          <label className="login-field">
            <span className="login-label">用户名</span>
            <input
              className="login-input"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="username"
            />
          </label>
          <label className="login-field">
            <span className="login-label">密码</span>
            <input
              className="login-input"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
            />
          </label>
          <button className="login-button" type="submit" disabled={isSubmitting}>
            {isSubmitting ? '登录中…' : '登录'}
          </button>
        </form>
        {message ? <p className="login-message is-error" aria-live="polite">{message}</p> : null}
      </div>
    </section>
  );
}
