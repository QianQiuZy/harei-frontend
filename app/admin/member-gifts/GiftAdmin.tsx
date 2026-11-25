'use client';

import { useCallback, useEffect, useState } from 'react';
import { useLegacyAdminToken } from '@/lib/auth/useLegacyAdminToken';
import { lastEditableMinute, request, type Gift } from '@/lib/member';
import { ActionForm, errorText, Field, Panel, s, value } from '@/components/member/MemberUI';
import GiftManagement from './GiftManagement';
import FulfillmentActions from './FulfillmentActions';
import { GiftMonthHeader } from './GiftMonthHeader';
import { Pagination, type PageInfo } from './Pagination';

type Phase = 'pending' | 'open' | 'grace' | 'closed';
type Row = Pick<
  Gift,
  'month' | 'uid' | 'nickname' | 'tier' | 'state' | 'has_address' | 'waived' | 'collection_status' | 'needs_reship'
> & { can_return_address: boolean };
type MonthResult = PageInfo & {
  items: Row[];
  schedule: {
    phase: Phase;
    settled: boolean;
    deadline: string | null;
    refill_deadline: string | null;
    next_change: string | null;
  };
  roster_recipient: string;
  needs_resend: boolean;
};
type Filter = 'all' | 'missing' | 'ready' | 'reship';
const phaseText = {
  pending: '尚未开始收集',
  open: '正式收集中',
  grace: '补填期内',
  closed: '收集已结束'
};

export default function GiftAdmin({ initialMonth }: { initialMonth: string }) {
  const token = useLegacyAdminToken();
  const [month, setMonth] = useState(initialMonth);
  const [result, setResult] = useState<(MonthResult & { month: string; key: string }) | null>(null);
  const [page, setPage] = useState(1);
  const [input, setInput] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [selected, setSelected] = useState<{ uid: string; anchor: HTMLButtonElement } | null>(null);
  const closeManagement = useCallback(() => setSelected(null), []);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  const reload = useCallback(() => setRevision((n) => n + 1), []);
  const path = '/admin/member-gifts/months/' + month;
  const key = path + '?' + new URLSearchParams({ kind: filter, q: search, page: String(page) });
  const current = result?.key === key ? result : null;
  const loaded = current !== null;
  const schedule = result?.month === month ? result.schedule : undefined;
  const boundary = schedule?.next_change;
  useEffect(() => {
    if (input.trim() === search) return;
    const timer = setTimeout(() => {
      setPage(1);
      setSelected(null);
      setSearch(input.trim());
    }, 220);
    return () => clearTimeout(timer);
  }, [input, search]);
  const pastDeadline = schedule?.phase === 'grace' || schedule?.phase === 'closed';
  const formDeadline = pastDeadline ? schedule?.refill_deadline : schedule?.deadline;
  useEffect(() => {
    if (!token || !month) return;
    let active = true;
    request<MonthResult>(key, undefined, 'GET', token)
      .then((data) => {
        if (active) {
          setResult({ ...data, month, key });
          setError('');
        }
      })
      .catch((err) => {
        if (active) {
          setResult(null);
          setError(errorText(err));
        }
      });
    return () => {
      active = false;
    };
  }, [month, key, revision, token]);
  useEffect(() => {
    window.addEventListener('focus', reload);
    // The API returns naive Beijing datetimes. Recheck at the actual transition,
    // including individual extensions, even while this page stays open.
    const delay = boundary ? Date.parse(boundary + '+08:00') - Date.now() + 200 : null;
    const timer =
      delay !== null
        ? window.setTimeout(reload, Math.min(2147483647, Math.max(1000, delay)))
        : undefined;
    return () => {
      window.removeEventListener('focus', reload);
      window.clearTimeout(timer);
    };
  }, [boundary, reload, revision]);
  if (!token) return null;
  const visible = current?.items ?? [];
  const goToPage = (next: number) => {
    setSelected(null);
    setPage(next);
  };
  const detail = current?.items.find((r) => r.uid === selected?.uid);
  const pendingText = error ? '数据暂不可用' : month ? '正在加载…' : '请选择舰礼月份';
  const update = async (url: string, body: unknown, method = 'PUT') => {
    await request(url, body, method, token);
    reload();
  };
  return (
    <div className={`${s.page} ${s.workspace}`}>
      <GiftMonthHeader
        title="舰礼地址管理"
        month={month}
        onChange={(next) => {
          setSelected(null);
          setError('');
          setPage(1);
          setMonth(next);
        }}
      >
        {schedule ? phaseText[schedule.phase] : pendingText}
      </GiftMonthHeader>
      {error && (
        <p role="alert">
          {error} <button onClick={reload}>重试</button>
        </p>
      )}
      <Panel title="收集安排">
        <div className={schedule?.deadline ? s.scheduledDeadline : undefined}>
          <div className={s.deadlineText}>
            <p>
              {pastDeadline ? '正式填写已截止于 ' : '当前截止时间 '}
              <strong>
                {schedule?.deadline
                  ? lastEditableMinute(schedule.deadline)
                  : schedule
                    ? '尚未设置'
                    : pendingText}
              </strong>
            </p>
            {pastDeadline && (
              <p>
                当前补填截止{' '}
                <strong>
                  {schedule.refill_deadline
                    ? lastEditableMinute(schedule.refill_deadline)
                    : '尚未开放'}
                </strong>
              </p>
            )}
          </div>
          <ActionForm
            key={month + (pastDeadline ? '-refill' : '-formal')}
            disabled={!schedule}
            submit={pastDeadline ? '延长补填期' : '保存截止日期'}
            action={(d) =>
              update(
                pastDeadline ? path + '/extend' : path,
                { date: value(d, 'date') },
                pastDeadline ? 'POST' : 'PUT'
              )
            }
          >
            <Field
              key={formDeadline}
              type="date"
              name="date"
              label={pastDeadline ? '最后可补填日期' : '最后可修改日期'}
              defaultValue={formDeadline ? lastEditableMinute(formDeadline).slice(0, 10) : ''}
            />
          </ActionForm>
        </div>
      </Panel>
      <Panel
        title="资格与寄送"
        aside={
          <FulfillmentActions
            key={month}
            month={month}
            token={token}
            settled={!!schedule?.settled}
            recipient={result?.month === month ? result.roster_recipient : undefined}
            closed={!!schedule?.settled && schedule.phase === 'closed'}
            reload={reload}
          />
        }
      >
        <div className={s.rosterFilters}>
          <div className={s.field}>
            <label htmlFor="gift-roster-filter">名单筛选</label>
            <select
              id="gift-roster-filter"
              value={filter}
              onChange={(e) => {
                setPage(1);
                setFilter(e.target.value as Filter);
                setSelected(null);
              }}
            >
              <option value="all">全部资格</option>
              <option value="ready">{schedule?.phase === 'grace' ? '地址已锁定' : '待发货'}</option>
              <option value="missing">缺地址（含未注册）</option>
              <option value="reship">需人工补寄</option>
            </select>
          </div>
          <label className={s.field}>
            搜索 UID 或昵称
            <input
              type="search"
              placeholder="输入 UID 或昵称"
              maxLength={255}
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
          </label>
          {loaded && <span className={s.count}>共 {current.total} 份</span>}
        </div>
        {current?.needs_resend && (
          <p className={s.advisory} role="status">
            收件信息已变更，请重新发送本月名单。
          </p>
        )}
        {loaded && visible.length > 0 ? (
          <div className={s.table}>
            <table>
              <colgroup>
                <col className={s.uidColumn} />
                <col />
                <col className={s.tierColumn} />
                <col className={s.statusColumn} />
                <col className={s.manageColumn} />
              </colgroup>
              <thead>
                <tr>
                  {['UID', '昵称', '舰礼档位', '收集状态', '操作'].map((h) => (
                    <th scope="col" key={h}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visible.map((r) => (
                  <tr key={r.uid} data-selected={selected?.uid === r.uid}>
                    <td data-label="UID">{r.uid}</td>
                    <td data-label="昵称">{r.nickname}</td>
                    <td data-label="舰礼档位">{r.tier}</td>
                    <td data-label="收集状态">
                      <span className={s.state} data-status={r.collection_status}>
                        {r.collection_status}
                      </span>
                      {r.waived && <small className={s.shippingStatus}>已放弃</small>}
                      {r.state === 'shipped' && <small className={s.shippingStatus}>已发货</small>}
                      {r.needs_reship && <small className={s.shippingStatus}>需人工补寄</small>}
                      {r.state === 'ready' && schedule?.phase === 'closed' && (
                        <small className={s.shippingStatus}>待发货</small>
                      )}
                    </td>
                    <td>
                      <button
                        className={s.secondary}
                        aria-label={'管理 UID ' + r.uid}
                        aria-haspopup="dialog"
                        aria-controls={selected?.uid === r.uid ? 'gift-management' : undefined}
                        aria-expanded={selected?.uid === r.uid}
                        onClick={(e) => {
                          setSelected(
                            selected?.uid === r.uid ? null : { uid: r.uid, anchor: e.currentTarget }
                          );
                        }}
                      >
                        管理
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className={s.empty}>
            {loaded
              ? search
                ? '没有符合搜索条件的记录'
                : filter === 'all'
                  ? '本月暂无舰礼资格记录'
                  : '当前分类暂无记录'
              : pendingText}
          </p>
        )}
        {current && current.total > 0 && (
          <Pagination data={current} label="资格与寄送分页" onChange={goToPage} />
        )}
        {detail && selected && (
          <GiftManagement
            key={month + detail.uid}
            row={detail}
            anchor={selected.anchor}
            onClose={closeManagement}
            update={(suffix, body, method) =>
              update(path + '/' + detail.uid + suffix, body, method)
            }
          />
        )}
      </Panel>
    </div>
  );
}
