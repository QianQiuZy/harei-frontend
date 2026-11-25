'use client';

import DocumentLink from '@/components/DocumentLink';
import Image from 'next/image';
import { useCallback, useState } from 'react';
import { useHydrated } from '@/lib/use-hydrated';
import { isSecurityAction, personalDestination, request, type SecurityAction } from '@/lib/member';
import { ActionForm, Field, Panel, s, value } from './MemberUI';
import { useActionFeedback, type FeedbackAnchor } from './ActionFeedback';
import UIDProof from './UIDProof';
import EmailCodeForm from './EmailCodeForm';
import SecurityActionForm from './SecurityActionForm';

type Mode = 'login' | 'register' | 'forgot-password' | 'appeal';
const titles: Record<Mode | SecurityAction, string> = {
  login: '个人账号登录',
  register: '注册个人账号',
  'forgot-password': '找回密码',
  'change-password': '修改密码',
  'change-email': '换绑邮箱',
  'delete-account': '注销账号',
  appeal: '账号申诉'
};
const registrationKey = 'harei-registration-flow';
const descriptions: Record<Mode | SecurityAction, string> = {
  login: '登录后可管理绑定的 UID 和舰礼收件地址。',
  register: '先验证邮箱，再到花礼直播间验证 B 站 UID。',
  'forgot-password': '使用账号已验证的邮箱重设密码。',
  'change-password': '修改后，请使用新密码重新登录。',
  'change-email': '先验证当前邮箱，再验证新邮箱。',
  'delete-account': '注销后将释放邮箱和 UID，已冻结的舰礼继续按原地址寄送。',
  appeal: '遇到邮箱或 UID 绑定问题，可在这里联系管理员。'
};

export default function AccountScreen({
  mode,
  query
}: {
  mode: Mode | SecurityAction;
  query: string;
}) {
  const hydrated = useHydrated();
  const security = isSecurityAction(mode);
  const standalone = security || mode === 'appeal';
  return (
    <div className={`${s.page} ${s.auth}`}>
      <header className={s.authHeader}>
        <Image src="/images/icon/gift-address.png" width={60} height={60} alt="" unoptimized />
        <div>
          <h1>{titles[mode]}</h1>
          <p>{descriptions[mode]}</p>
        </div>
      </header>
      {!standalone && (
        <nav className={s.authNav} aria-label="个人账号">
          <DocumentLink
            href={'/account/login' + query}
            aria-current={mode === 'login' ? 'page' : undefined}
          >
            登录
          </DocumentLink>
          <DocumentLink
            href={'/account/register' + query}
            aria-current={mode === 'register' ? 'page' : undefined}
          >
            注册
          </DocumentLink>
        </nav>
      )}
      {hydrated &&
        (security ? (
          <SecurityActionForm key={mode} mode={mode} />
        ) : (
          <AccountBody key={mode} mode={mode} query={query} />
        ))}
      {standalone ? (
        <nav className={s.authHelp} aria-label="返回">
          {security || new URLSearchParams(query).get('section') === 'security' ? (
            <DocumentLink href="/personal/security">返回账号安全</DocumentLink>
          ) : (
            <DocumentLink href="/">返回首页</DocumentLink>
          )}
        </nav>
      ) : (
        <nav className={s.authHelp} aria-label="账号帮助">
          <DocumentLink
            href={'/account/forgot-password' + query}
            aria-current={mode === 'forgot-password' ? 'page' : undefined}
          >
            找回密码
          </DocumentLink>
          <DocumentLink href={'/account/appeal' + query}>账号申诉</DocumentLink>
        </nav>
      )}
    </div>
  );
}

function AccountBody({ mode, query }: { mode: Mode; query: string }) {
  const [email, setEmail] = useState('');
  const [flow, setFlow] = useState(() =>
    mode === 'register' ? sessionStorage.getItem(registrationKey) : null
  );
  const [ticket, setTicket] = useState('');
  const setFeedback = useActionFeedback();
  const expireFlow = useCallback(
    (anchor: FeedbackAnchor) => {
      sessionStorage.removeItem(registrationKey);
      setFlow(null);
      setFeedback({ text: '本次注册验证已过期，请重新获取邮箱验证码。', error: true, anchor });
    },
    [setFeedback]
  );
  if (mode === 'login')
    return (
      <ActionForm
        submit="登录"
        action={async (data) => {
          await request('/user-auth/login', {
            identifier: value(data, 'identifier'),
            password: value(data, 'password')
          });
          window.location.replace(personalDestination(query));
        }}
      >
        <Field
          name="identifier"
          label="邮箱或已绑定 UID"
          autoComplete="username"
          autoCapitalize="none"
        />
        <Field name="password" label="密码" type="password" autoComplete="current-password" />
      </ActionForm>
    );
  if (mode === 'appeal')
    return (
      <>
        <Panel title="提交申诉">
          <ActionForm
            submit="提交申诉"
            action={async (data) => {
              const res = await request<{ ticket: string }>('/user-auth/appeals', {
                contact: value(data, 'contact'),
                uid: value(data, 'uid') || null,
                message: value(data, 'message')
              });
              setTicket(res.ticket);
              return '请保存查询凭证，可用它查看处理结果。';
            }}
          >
            <Field name="contact" label="可联系邮箱" type="email" />
            <Field
              name="uid"
              label="相关 UID（选填）"
              required={false}
              pattern="[1-9][0-9]{0,19}"
            />
            <label className={s.field}>
              遇到的问题
              <textarea name="message" required minLength={5} maxLength={1500} />
            </label>
          </ActionForm>
        </Panel>
        <Panel title="查询处理结果">
          <ActionForm
            submit="查询"
            action={async (data) => {
              const res = await request<{ closed: boolean; reply: string | null }>(
                '/user-auth/appeals/status',
                { ticket: value(data, 'ticket') }
              );
              return res.closed ? res.reply || '已处理' : '等待管理员处理';
            }}
          >
            <Field
              name="ticket"
              label="查询凭证"
              value={ticket}
              onChange={(e) => setTicket(e.target.value)}
            />
          </ActionForm>
        </Panel>
      </>
    );
  if (flow && mode === 'register')
    return (
      <Panel title="验证 B 站 UID">
        <UIDProof
          key={flow}
          flow={flow}
          register
          onExpired={expireFlow}
          done={() => {
            sessionStorage.removeItem(registrationKey);
            window.location.replace(personalDestination(query));
          }}
        />
      </Panel>
    );
  return (
    <Panel title="验证邮箱">
      <EmailCodeForm
        purpose={mode}
        inline
        submit="发送邮箱验证码"
        send={() =>
          request('/user-auth/email-code', {
            email,
            purpose: mode === 'register' ? 'register' : 'reset'
          })
        }
        note="请检查收件箱，验证码 10 分钟内有效。"
      >
        <Field
          label="邮箱"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="name@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </EmailCodeForm>
      <ActionForm
        submit={mode === 'register' ? '验证邮箱并继续' : '重设密码'}
        action={async (data) => {
          const code = value(data, 'code');
          if (mode === 'register') {
            const res = await request<{ flow: string }>('/user-auth/registration/email-verify', {
              email,
              code
            });
            sessionStorage.setItem(registrationKey, res.flow);
            setFlow(res.flow);
          } else {
            await request('/user-auth/password-reset', {
              email,
              code,
              password: value(data, 'password')
            });
            window.location.replace('/account/login' + query);
          }
        }}
      >
        <Field
          label="6 位邮箱验证码"
          name="code"
          inputMode="numeric"
          pattern="[0-9]{6}"
          maxLength={6}
          autoComplete="one-time-code"
        />
        {mode === 'forgot-password' && (
          <Field
            label="新密码"
            name="password"
            type="password"
            minLength={8}
            maxLength={128}
            autoComplete="new-password"
          />
        )}
      </ActionForm>
    </Panel>
  );
}
