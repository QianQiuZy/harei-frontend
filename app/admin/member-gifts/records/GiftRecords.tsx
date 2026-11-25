'use client';

import { useEffect, useState } from 'react';
import { useLegacyAdminToken } from '@/lib/auth/useLegacyAdminToken';
import { request, timeLabel } from '@/lib/member';
import { ActionForm, errorText, Field, Panel, s, value } from '@/components/member/MemberUI';
import { Pagination, type PageInfo } from '../Pagination';

const base = '/admin/member-gifts';
type Appeal = {
  id: number;
  closed: boolean;
  contact: string;
  uid: string | null;
  message: string;
  reply: string | null;
};
type Audit = {
  id: number;
  at: string;
  actor: string;
  action: string;
  subject: string;
  details: Record<string, unknown>;
};

type Status = 'open' | 'closed' | 'all';

export default function GiftRecords({ initialMonth: month }: { initialMonth: string }) {
  const token = useLegacyAdminToken();
  const [status, setStatus] = useState<Status>('open');
  const [page, setPage] = useState(1);
  const [revision, setRevision] = useState(0);
  const [error, setError] = useState('');
  const [auditError, setAuditError] = useState('');
  const [auditPage, setAuditPage] = useState(1);
  const [auditResult, setAuditResult] = useState<
    (PageInfo & { requested: number; items: Audit[] }) | null
  >(null);
  const history = auditResult?.requested === auditPage ? auditResult : null;
  const [result, setResult] = useState<(PageInfo & { key: string; items: Appeal[] }) | null>(null);
  const key = status + '/' + page;
  const current = result?.key === key ? result : null;
  const appeals = current?.items ?? [];
  const pendingText = error ? '数据暂不可用' : '正在加载…';
  useEffect(() => {
    if (!token) return;
    let active = true;
    request<PageInfo & { items: Appeal[] }>(
      base + '/appeals?status=' + status + '&page=' + page,
      undefined,
      'GET',
      token
    )
      .then((data) => {
        if (active) {
          setResult({ ...data, key });
          setError('');
        }
      })
      .catch((err) => {
        if (active) {
          setError(errorText(err));
          setResult(null);
        }
      });
    return () => {
      active = false;
    };
  }, [status, page, key, token, revision]);
  useEffect(() => {
    if (!token) return;
    let active = true;
    request<PageInfo & { items: Audit[] }>(
      base + '/audit?month=' + month + '&page=' + auditPage,
      undefined,
      'GET',
      token
    )
      .then((data) => {
        if (active) {
          setAuditResult({ ...data, requested: auditPage });
          setAuditError('');
        }
      })
      .catch((err) => {
        if (active) {
          setAuditError(errorText(err));
          setAuditResult(null);
        }
      });
    return () => {
      active = false;
    };
  }, [month, auditPage, token, revision]);
  if (!token) return null;
  const update = async (url: string, body: unknown, method: string) => {
    await request(url, body, method, token);
    setRevision((n) => n + 1);
  };
  return (
    <div className={`${s.page} ${s.workspace}`}>
      <header className={s.workspaceHeader}>
        <h1>申诉与操作记录</h1>
      </header>
      {(error || auditError) && (
        <p role="alert">
          {error || auditError} <button onClick={() => setRevision((n) => n + 1)}>重试</button>
        </p>
      )}
      <Panel
        title="账号申诉"
        aside={
          <div className={s.field}>
            <label htmlFor="gift-appeal-status">申诉分类</label>
            <select
              id="gift-appeal-status"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as Status);
                setPage(1);
              }}
            >
              <option value="open">未处理</option>
              <option value="closed">已处理</option>
              <option value="all">全部</option>
            </select>
          </div>
        }
      >
        {!appeals.length && (
          <p className={s.empty}>
            {current
              ? { open: '暂无待处理的申诉', closed: '暂无已处理的申诉', all: '暂无申诉记录' }[
                  status
                ]
              : pendingText}
          </p>
        )}
        {appeals.map((a) => (
          <article className={s.card} key={a.id}>
            <strong>
              申诉 #{a.id} · {a.contact} · {a.closed ? '已处理' : '未处理'}
            </strong>
            <p>UID {a.uid || '未提供'}</p>
            <p>{a.message}</p>
            {a.closed ? (
              <p>{a.reply}</p>
            ) : (
              <ActionForm
                submit="确认处理"
                action={(d) =>
                  update(
                    base + '/appeals/' + a.id,
                    {
                      reply: value(d, 'reply'),
                      action: value(d, 'action'),
                      old_email: value(d, 'old_email') || null
                    },
                    'POST'
                  )
                }
              >
                <label className={s.field}>
                  人工核实后的操作
                  <select name="action">
                    <option value="reply">仅答复</option>
                    <option value="release_uid">解除争议 UID 绑定</option>
                    <option value="recover_email">将原账号邮箱改为已核实的联系邮箱</option>
                  </select>
                </label>
                <Field
                  name="old_email"
                  label="原邮箱（恢复账号时填写）"
                  type="email"
                  required={false}
                />
                <Field label="处理答复" name="reply" maxLength={1000} />
              </ActionForm>
            )}
          </article>
        ))}
        {current && current.total > 0 && (
          <Pagination data={current} label="账号申诉分页" onChange={setPage} />
        )}
      </Panel>
      <Panel title="本月操作记录">
        {history && history.items.length > 0 ? (
          <ul className={s.history}>
            {history.items.map((entry) => (
              <li key={entry.id}>
                <time dateTime={entry.at}>{timeLabel(entry.at)}</time>
                <span>
                  {entry.actor} · {entry.action} · {entry.subject}{' '}
                  {Object.values(entry.details).map(String).join(' / ')}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className={s.empty}>{history ? '本月暂无操作记录' : auditError || '正在加载…'}</p>
        )}
        {history && history.total > 0 && (
          <Pagination data={history} label="本月操作记录分页" onChange={setAuditPage} />
        )}
      </Panel>
    </div>
  );
}
