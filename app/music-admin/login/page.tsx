'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { login, MUSIC_SCOPE, saveSession, selectSession, verifySession } from '@/lib/auth/session';
import styles from '../admin.module.css';

export default function MusicAdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const selected = selectSession(MUSIC_SCOPE, window.localStorage);
    if (!selected) return;
    void verifySession(selected.session.token)
      .then((session) => {
        if (session.scopes.includes(MUSIC_SCOPE)) router.replace('/music-admin');
      })
      .catch(() => undefined);
  }, [router]);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!username.trim() || !password) {
      setError('请输入用户名和密码。');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const response = await login('music', username.trim(), password);
      saveSession('music', response, window.localStorage);
      router.replace('/music-admin');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '登录失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className={`login-page ${styles.loginTypography}`}>
      <div className="login-card">
        <h1 className="login-title">歌单管理登录</h1>
        <p className="login-subtitle">歌单管理员与主后台账号均可继续。</p>
        <form className="login-form" onSubmit={submit}>
          <label className="login-field">
            <span className="login-label">用户名</span>
            <input className="login-input" value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" />
          </label>
          <label className="login-field">
            <span className="login-label">密码</span>
            <input className="login-input" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" />
          </label>
          <button className="login-button" type="submit" disabled={submitting}>
            {submitting ? '登录中…' : '登录'}
          </button>
        </form>
        {error ? <p className="login-message is-error" aria-live="polite">{error}</p> : null}
      </div>
    </section>
  );
}
