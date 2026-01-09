'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type LoginResponse = {
  code: number;
  token?: string;
  user?: {
    username: string;
  };
  message?: string;
};

type AuthResponse = {
  code: number;
  authenticated: boolean;
  user?: {
    username: string;
  };
};

const TOKEN_KEY = 'harei-admin-token';
const TOKEN_EXPIRES_KEY = 'harei-admin-token-expires';
const TOKEN_VALID_DAYS = 7;

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const checkToken = async () => {
      const token = localStorage.getItem(TOKEN_KEY);
      const expiresAt = Number(localStorage.getItem(TOKEN_EXPIRES_KEY));
      if (!token || !expiresAt || Number.isNaN(expiresAt)) {
        return;
      }

      if (Date.now() > expiresAt) {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(TOKEN_EXPIRES_KEY);
        return;
      }

      try {
        const response = await fetch('https://api.harei.cn/auth', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('auth failed');
        }

        const data = (await response.json()) as AuthResponse;
        if (data.code === 0 && data.authenticated) {
          router.replace('/admin');
        }
      } catch (error) {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(TOKEN_EXPIRES_KEY);
      }
    };

    checkToken();
  }, [router]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!username.trim() || !password) {
      setErrorMessage('请输入用户名和密码。');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('https://api.harei.cn/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: username.trim(),
          password
        })
      });

      if (!response.ok) {
        throw new Error('登录请求失败');
      }

      const data = (await response.json()) as LoginResponse;

      if (data.code !== 0 || !data.token) {
        throw new Error(data.message || '用户名或密码错误');
      }

      const expiresAt = Date.now() + TOKEN_VALID_DAYS * 24 * 60 * 60 * 1000;
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(TOKEN_EXPIRES_KEY, String(expiresAt));

      setSuccessMessage(`登录成功，Token 有效期为 ${TOKEN_VALID_DAYS} 天。`);
      setPassword('');
      router.replace('/admin');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '登录失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="login-page">
      <div className="login-card">
        <h1 className="login-title">后台登录</h1>
        <p className="login-subtitle">请输入用户名和密码以继续。</p>
        <form className="login-form" onSubmit={handleSubmit}>
          <label className="login-field">
            <span className="login-label">用户名</span>
            <input
              className="login-input"
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="请输入用户名"
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
              placeholder="请输入密码"
              autoComplete="current-password"
            />
          </label>
          <button className="login-button" type="submit" disabled={isSubmitting}>
            {isSubmitting ? '登录中...' : '登录'}
          </button>
        </form>
        {errorMessage ? <p className="login-message is-error">{errorMessage}</p> : null}
        {successMessage ? (
          <p className="login-message is-success">{successMessage}</p>
        ) : null}
      </div>
    </section>
  );
}
