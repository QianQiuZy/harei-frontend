'use client';

import { useEffect, useRef, useState } from 'react';
import { ApiError, request } from '@/lib/member';
import { ActionForm, errorText, Field, s, value } from './MemberUI';
import { useSecondsLeft } from './useSecondsLeft';
import { feedbackAnchor, useActionFeedback, type FeedbackAnchor } from './ActionFeedback';

type Status = {
  room: number;
  issued: boolean;
  code: string | null;
  verified: boolean;
  uid: string | null;
  username: string | null;
  expires_in: number;
  retry_after: number;
  listener: string;
};

const listenerLabels: Record<string, string> = {
  offline: '监听尚未启动',
  connecting: '监听正在连接',
  awaiting_danmaku: '监听已连接，正在等待直播间弹幕',
  uid_unavailable: '监听暂时无法取得发送者 UID',
  online: '正在等待验证弹幕'
};

function RegistrationPasswordForm({
  flow,
  uid,
  done
}: {
  flow: string;
  uid: string;
  done: () => void;
}) {
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const mismatch = confirmation.length > 0 && password !== confirmation;
  const registerButton = useRef<HTMLButtonElement>(null);
  const setFeedback = useActionFeedback();
  const mismatchText = '两次输入的密码不一致';
  useEffect(() => {
    if (!mismatch || !registerButton.current) return;
    setFeedback({
      text: mismatchText,
      error: true,
      anchor: feedbackAnchor(registerButton.current)
    });
    return () => setFeedback((current) => (current?.text === mismatchText ? null : current));
  }, [mismatch, setFeedback]);
  return (
    <ActionForm
      submit="完成注册"
      submitRef={registerButton}
      disabled={password.length < 8 || password !== confirmation}
      action={async (data) => {
        const first = value(data, 'password');
        const second = value(data, 'confirm_password');
        if (first !== second) throw new Error(mismatchText);
        await request('/user-auth/register', {
          flow,
          uid,
          password: first,
          confirm_password: second
        });
        done();
      }}
    >
      <Field
        label="设置密码（至少 8 位）"
        name="password"
        type="password"
        minLength={8}
        maxLength={128}
        autoComplete="new-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <Field
        label="确认密码"
        name="confirm_password"
        type="password"
        minLength={8}
        maxLength={128}
        autoComplete="new-password"
        value={confirmation}
        onChange={(e) => setConfirmation(e.target.value)}
        aria-invalid={mismatch || undefined}
        aria-description={mismatch ? mismatchText : undefined}
      />
    </ActionForm>
  );
}

export default function UIDProof({
  flow,
  register,
  done,
  onExpired
}: {
  flow: string;
  register?: boolean;
  done: () => void;
  onExpired: (anchor: FeedbackAnchor) => void;
}) {
  const [attempt, setAttempt] = useState(0);
  const [snapshot, setSnapshot] = useState({
    attempt: -1,
    data: null as Status | null,
    resendAt: 0,
    expiresAt: 0
  });
  const [confirmed, setConfirmed] = useState('');
  const setFeedback = useActionFeedback();
  const codeElement = useRef<HTMLElement>(null);
  const generateButton = useRef<HTMLButtonElement>(null);
  const remaining = useSecondsLeft(snapshot.resendAt);
  const lifetime = useSecondsLeft(snapshot.expiresAt);
  const busy = snapshot.attempt !== attempt;
  const status = snapshot.data;
  const uid = status?.verified ? status.uid : null;
  const code = status?.code;
  const activeCode = !busy && !uid && lifetime > 0 ? code : null;

  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout>;
    let limitedUntil = 0;
    let lastPollError = '';
    const read = () => request<Status>('/user-auth/verification-status', { flow });
    const generate = async () => {
      try {
        return await request<Status>('/user-auth/uid-challenge', { flow });
      } catch (err) {
        if (!(err instanceof ApiError) || err.status !== 429) throw err;
        limitedUntil = Date.now() + err.retryAfter * 1000;
        return read();
      }
    };
    const poll = async (first: boolean) => {
      try {
        let data = first && attempt > 0 ? await generate() : await read();
        if (!active) return;
        if (first && attempt === 0 && !data.issued && !data.retry_after) data = await generate();
        if (!active) return;
        const now = Date.now();
        if (lastPollError) {
          const recovered = lastPollError;
          lastPollError = '';
          setFeedback((notice) => (notice?.text === recovered ? null : notice));
        }
        setSnapshot({
          attempt,
          data,
          resendAt: Math.max(limitedUntil, now + data.retry_after * 1000),
          expiresAt: now + data.expires_in * 1000
        });
      } catch (err) {
        if (!active) return;
        if (!generateButton.current) return;
        if (err instanceof ApiError && err.status === 410) {
          onExpired(feedbackAnchor(generateButton.current));
          return;
        }
        setSnapshot((old) => ({ ...old, attempt }));
        const message = errorText(err);
        if (message !== lastPollError) {
          lastPollError = message;
          setFeedback({
            text: message,
            error: true,
            anchor: feedbackAnchor(generateButton.current)
          });
        }
      }
      if (active) timer = setTimeout(() => void poll(false), 2500);
    };
    void poll(true);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [flow, attempt, onExpired, setFeedback]);

  const copy = async (anchor: FeedbackAnchor) => {
    if (!activeCode) return;
    try {
      await navigator.clipboard.writeText(activeCode);
    } catch {
      const selection = window.getSelection();
      if (!selection || !codeElement.current) {
        setFeedback({ text: '请手动选中验证码复制。', error: true, anchor });
        return;
      }
      const range = document.createRange();
      range.selectNodeContents(codeElement.current);
      selection.removeAllRanges();
      selection.addRange(range);
      let copiedSelection = false;
      try {
        copiedSelection = document.execCommand('copy');
      } catch {
        // The selection remains available when the browser blocks clipboard access.
      }
      if (!copiedSelection) {
        setFeedback({ text: '请复制已选中的验证码。', error: true, anchor });
        return;
      }
      selection.removeAllRanges();
    }
    setFeedback({ text: '验证码已复制', anchor });
  };

  return (
    <div className={s.uidProof}>
      {uid && !busy ? (
        <>
          <dl className={s.identity} aria-label="弹幕发送者" aria-live="polite">
            <div>
              <dt>UID：</dt>
              <dd>{uid}</dd>
            </div>
            <div>
              <dt>用户名：</dt>
              <dd>{status?.username || '直播间未提供'}</dd>
            </div>
          </dl>
          {register && confirmed !== code ? (
            <button type="button" onClick={() => setConfirmed(code ?? '')}>
              确认绑定
            </button>
          ) : register ? (
            <RegistrationPasswordForm key={code} flow={flow} uid={uid} done={done} />
          ) : (
            <ActionForm
              key={code}
              submit="确认绑定"
              action={async () => {
                await request('/me/bind', { flow, uid });
                done();
              }}
            />
          )}
        </>
      ) : (
        <>
          {activeCode && status && (
            <>
              <p>
                请用要绑定的 B 站账号，在
                <a
                  href={'https://live.bilibili.com/' + status.room}
                  target="_blank"
                  rel="noreferrer"
                >
                  花礼直播间
                </a>
                发送此验证码。
              </p>
              <div className={s.codeRow}>
                <code ref={codeElement}>{activeCode}</code>
                <button
                  type="button"
                  className={s.secondary}
                  onClick={(e) => void copy(feedbackAnchor(e.currentTarget))}
                >
                  复制验证码
                </button>
              </div>
              <p className={s.proofHint}>
                {listenerLabels[status.listener]} · 验证码剩余 {Math.floor(lifetime / 60)}:
                {String(lifetime % 60).padStart(2, '0')}
              </p>
            </>
          )}
          {!busy && status?.issued && !activeCode && (
            <p role="status">验证码已过期，请重新生成。</p>
          )}
        </>
      )}
      <button
        ref={generateButton}
        type="button"
        className={s.secondary}
        disabled={busy || remaining > 0}
        onClick={() => {
          setConfirmed('');
          setFeedback(null);
          setAttempt((n) => n + 1);
        }}
      >
        {busy
          ? '正在获取验证码…'
          : remaining
            ? `${remaining} 秒后可重新生成`
            : status?.issued
              ? '重新生成弹幕验证码'
              : '获取弹幕验证码'}
      </button>
    </div>
  );
}
