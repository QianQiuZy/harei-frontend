'use client';

import { useEffect, useRef, useState } from 'react';
import { ApiError, onMemberSessionChange, personalQuery, request, type SecurityAction } from '@/lib/member';
import { ActionForm, CurrentPasswordField, errorText, Field, Panel, s, value } from './MemberUI';
import { MemberDialog } from './MemberDialog';
import EmailCodeForm from './EmailCodeForm';

function VerificationCode({ label }: { label: string }) {
  return (
    <Field
      name="code"
      label={label}
      pattern="[0-9]{6}"
      inputMode="numeric"
      maxLength={6}
      autoComplete="one-time-code"
    />
  );
}

function ChangeEmail({ email, done }: { email: string; done: () => void }) {
  const key = 'harei-change-email:' + email;
  const [flow, setFlow] = useState(() => sessionStorage.getItem(key) || '');
  const [sentTo, setSentTo] = useState(() => sessionStorage.getItem(key + ':to') || '');
  const [target, setTarget] = useState(sentTo);
  function restart() {
    sessionStorage.removeItem(key);
    sessionStorage.removeItem(key + ':to');
    setFlow('');
    setSentTo('');
    setTarget('');
  }
  function checkExpiry(err: unknown): never {
    if (err instanceof ApiError && err.status === 410) {
      restart();
      throw new ApiError(err.status, '原邮箱验证已失效，请重新验证。', err.retryAfter);
    }
    throw err;
  }
  if (!flow)
    return (
      <Panel title="验证原邮箱">
        <p className={s.sectionHint}>{email}</p>
        <EmailCodeForm
          purpose={'change-old:' + email}
          submit="向原邮箱发送验证码"
          send={() => request('/me/email-code', {})}
          note="验证码已发送至原邮箱，10 分钟内有效。"
        />
        <ActionForm
          submit="验证原邮箱并继续"
          action={async (data) => {
            const result = await request<{ flow: string }>('/me/email/verify-old', {
              code: value(data, 'code')
            });
            sessionStorage.setItem(key, result.flow);
            setFlow(result.flow);
          }}
        >
          <VerificationCode label="原邮箱验证码" />
        </ActionForm>
      </Panel>
    );
  return (
    <Panel title="验证新邮箱">
      <EmailCodeForm
        purpose={'change-new:' + email}
        submit="向新邮箱发送验证码"
        note="验证码已发送至新邮箱，10 分钟内有效。"
        send={async (data) => {
          const to = value(data, 'email').trim().toLowerCase();
          const result = await request<{ retry_after: number }>('/me/email/new-code', {
            flow,
            email: to
          }).catch(checkExpiry);
          sessionStorage.setItem(key + ':to', to);
          setTarget(to);
          setSentTo(to);
          return result;
        }}
      >
        <Field
          name="email"
          label="新邮箱"
          type="email"
          autoComplete="email"
          value={target}
          readOnly={!!sentTo}
          onChange={(e) => setTarget(e.target.value)}
        />
      </EmailCodeForm>
      {sentTo && (
        <ActionForm
          submit="确认换绑邮箱"
          action={async (data) => {
            await request('/me/email', { flow, email: sentTo, code: value(data, 'code') }).catch(
              checkExpiry
            );
            restart();
            done();
          }}
        >
          <VerificationCode label="新邮箱验证码" />
        </ActionForm>
      )}
      <button type="button" className={s.secondary} onClick={restart}>
        重新验证原邮箱
      </button>
    </Panel>
  );
}

function DeleteAccount({ email, done }: { email: string; done: () => void }) {
  const [pendingCode, setPendingCode] = useState('');
  const deleteButton = useRef<HTMLButtonElement>(null);
  return (
    <Panel title="验证当前邮箱">
      <p className={s.sectionHint}>{email}</p>
      <EmailCodeForm
        purpose={'delete:' + email}
        submit="发送注销验证码"
        send={() => request('/me/deletion-code', {})}
        note="注销验证码已发送，10 分钟内有效。"
      />
      <form
        method="post"
        className={s.form}
        onSubmit={(event) => {
          event.preventDefault();
          setPendingCode(value(new FormData(event.currentTarget), 'code'));
        }}
      >
        <VerificationCode label="邮箱验证码" />
        <button ref={deleteButton} type="submit">
          注销账号
        </button>
      </form>
      {pendingCode && (
        <MemberDialog
          opener={deleteButton}
          title="确认注销账号？"
          onDismiss={() => setPendingCode('')}
        >
          <p>确认后将立即注销 {email}，此操作无法撤销。</p>
          <ActionForm
            submit="确认注销"
            action={async () => {
              await request('/me/deletion', { code: pendingCode, confirmed: true });
              done();
            }}
          />
        </MemberDialog>
      )}
    </Panel>
  );
}

export default function SecurityActionForm({ mode }: { mode: SecurityAction }) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  useEffect(() => onMemberSessionChange(() => {
    setEmail('');
    setRevision((n) => n + 1);
  }), []);
  useEffect(() => {
    let active = true;
    request<{ email: string }>('/me/account')
      .then((result) => {
        if (active) {
          setEmail(result.email);
          setError('');
        }
      })
      .catch((err) => {
        if (!active) return;
        if (err instanceof ApiError && err.status === 401) {
          setEmail('');
          window.location.replace('/account/login' + personalQuery(undefined, mode));
        } else setError(errorText(err));
      });
    return () => {
      active = false;
    };
  }, [mode, revision]);
  if (error)
    return (
      <p role="alert">
        {error} <button onClick={() => setRevision((n) => n + 1)}>重试</button>
      </p>
    );
  if (!email) return <p className={s.empty}>正在读取账号…</p>;
  if (mode === 'change-email')
    return (
      <ChangeEmail key={email} email={email} done={() => window.location.replace('/account/login?section=security')} />
    );
  if (mode === 'delete-account')
    return <DeleteAccount key={email} email={email} done={() => window.location.replace('/account/login')} />;
  return (
    <ActionForm
      submit="保存新密码"
      action={async (data) => {
        await request('/me/password', {
          password: value(data, 'password'),
          new_password: value(data, 'new_password')
        });
        window.location.replace('/account/login?section=security');
      }}
    >
      <CurrentPasswordField />
      <Field
        label="新密码"
        name="new_password"
        type="password"
        minLength={8}
        maxLength={128}
        autoComplete="new-password"
      />
    </ActionForm>
  );
}
