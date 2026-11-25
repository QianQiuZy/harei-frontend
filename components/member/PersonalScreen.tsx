'use client';

import { useEffect, useRef, useState } from 'react';
import {
  ApiError,
  formatAddress,
  lastEditableMinute,
  personalQuery,
  request,
  type Address,
  type Profile
} from '@/lib/member';
import { ActionForm, AddressFields, errorText, Panel, readAddress, s } from './MemberUI';
import PersonalShell from './PersonalShell';
import { MemberDialog } from './MemberDialog';
import {
  feedbackAnchor,
  submitAnchor,
  useActionFeedback,
  type FeedbackAnchor
} from './ActionFeedback';

function AddressBook({
  address,
  autoFill,
  uid,
  reload,
  openOnEntry = false
}: {
  address: Address | null;
  autoFill: boolean;
  uid?: string;
  reload: () => Promise<void>;
  openOnEntry?: boolean;
}) {
  const path = '/me/address' + (uid ? '/' + uid : '');
  const [busy, setBusy] = useState(false);
  const setNote = useActionFeedback();
  async function update(url: string, body: unknown, message: string, anchor: FeedbackAnchor) {
    if (busy) return;
    setBusy(true);
    setNote(null);
    try {
      await request(url, body, 'PUT');
      await reload();
      setNote({ text: message, anchor });
    } catch (err) {
      setNote({ text: errorText(err), error: true, anchor });
    } finally {
      setBusy(false);
    }
  }
  return (
    <details
      className={s.addressBook}
      id={uid ? 'address-' + uid : 'default-address'}
      open={openOnEntry || undefined}
    >
      <summary>
        <span className={s.addressSummary}>
          <strong>{uid ? 'UID ' + uid : '默认收件地址'}</strong>
          <span className={address ? s.savedAddress : undefined}>
            {address
              ? formatAddress(address)
              : uid
                ? autoFill
                  ? '使用账号默认地址'
                  : '尚未填写 UID 专属地址'
                : '尚未填写默认地址'}
          </span>
        </span>
        <span className={s.editHint}>
          <span>{address ? '编辑' : '填写'}</span>
          <span>收起</span>
        </span>
      </summary>
      <div className={s.addressEditor}>
        <form
          method="post"
          className={s.form}
          onSubmit={(event) => {
            event.preventDefault();
            void update(
              path,
              readAddress(new FormData(event.currentTarget)),
              '收件地址已保存',
              submitAnchor(event)
            );
          }}
        >
          <div className={s.addressGrid} key={JSON.stringify(address)}>
            <AddressFields address={address} />
          </div>
          <div className={s.addressActions}>
            <button type="submit" disabled={busy}>
              保存收件地址
            </button>
            {!uid && (
              <label className={s.autoFillSwitch}>
                <input
                  type="checkbox"
                  role="switch"
                  checked={autoFill}
                  disabled={busy}
                  onChange={(event) => {
                    const enabled = event.target.checked;
                    void update(
                      '/me/address-preference',
                      { auto_fill_address: enabled },
                      enabled ? '已开启自动填写' : '已关闭自动填写',
                      feedbackAnchor(event.currentTarget.closest('label') ?? event.currentTarget)
                    );
                  }}
                />
                自动填写地址
              </label>
            )}
            {(!uid || address) && (
              <button
                type="button"
                className={s.secondary}
                disabled={busy || !address}
                onClick={(e) =>
                  void update(path, null, '地址已删除', feedbackAnchor(e.currentTarget))
                }
              >
                {uid ? (autoFill ? '恢复使用默认地址' : '删除专属地址') : '删除默认地址'}
              </button>
            )}
          </div>
        </form>
      </div>
    </details>
  );
}

function AddressPanel({
  profile,
  reload,
  open,
  initialUid
}: {
  profile: Profile;
  reload: () => Promise<void>;
  open: boolean;
  initialUid: string;
}) {
  const multiple = profile.bindings.length > 1;
  const specific = open && multiple && profile.bindings.some((b) => b.uid === initialUid);
  return (
    <Panel title="舰礼收件地址">
      <p className={s.sectionHint}>
        仅支持中国大陆。{multiple && '多个 UID 共用默认地址，也可单独填写。'}
      </p>
      <AddressBook
        address={profile.address}
        autoFill={profile.auto_fill_address}
        reload={reload}
        openOnEntry={!profile.address && !specific}
      />
      {multiple &&
        profile.bindings.map((b) => (
          <AddressBook
            key={b.uid}
            uid={b.uid}
            address={b.address}
            autoFill={profile.auto_fill_address}
            reload={reload}
            openOnEntry={specific && b.uid === initialUid}
          />
        ))}
    </Panel>
  );
}

type PersonalGift = Profile['gifts'][number];

function GiftCard({
  gift: g,
  defaultAddress,
  reload
}: {
  gift: PersonalGift;
  defaultAddress: Address | null;
  reload: () => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const editButton = useRef<HTMLButtonElement>(null);
  const [defaultCopies, setDefaultCopies] = useState(0);
  const [expiredAt, setExpiredAt] = useState('');
  const boundary = g.grace_until || g.deadline;
  const active = !g.frozen_at && (g.state === 'open' || g.state === 'grace');
  useEffect(() => {
    if (!active || !boundary) return;
    const end = boundary;
    let timer: ReturnType<typeof setTimeout>;
    function schedule() {
      const delay = Date.parse(end + '+08:00') - Date.now();
      if (delay <= 0) {
        setExpiredAt(end);
        setEditing(false);
      } else timer = setTimeout(schedule, Math.min(delay + 30, 2147483647));
    }
    schedule();
    return () => clearTimeout(timer);
  }, [active, boundary]);
  const editable = active && (!boundary || expiredAt !== boundary);
  async function saveAddress(
    address: (Address & { confirm_refill?: boolean }) | { use_default: true }
  ) {
    try {
      await request('/me/gifts/' + g.month + '/' + g.uid + '/address', address, 'PUT');
    } catch (err) {
      if (err instanceof ApiError && (err.status === 404 || err.status === 409)) await reload();
      throw err;
    }
    setEditing(false);
    await reload();
  }
  return (
    <article className={s.card}>
      <div className={s.giftCardHeading}>
        <strong>
          {g.month.slice(0, 4)} 年 {g.month.slice(4)} 月 · {g.tier}
        </strong>
        {editable && (
          <div className={s.giftActions}>
            {!g.address && !g.refill_requested && defaultAddress && (
              <ActionForm submit="使用默认地址" action={() => saveAddress({ use_default: true })} />
            )}
            <button
              type="button"
              ref={editButton}
              className={s.secondary}
              onClick={() => {
                setDefaultCopies(0);
                setEditing(true);
              }}
            >
              {g.refill_requested ? '重新填写地址' : '修改地址'}
            </button>
          </div>
        )}
      </div>
      <p>
        UID {g.uid} · {g.username || '绑定时未记录'} · {g.collection_status}
      </p>
      {g.address && <p className={s.giftAddress}>{formatAddress(g.address)}</p>}
      {g.refill_requested && editable && (
        <p className={s.advisory}>
          {g.address
            ? '修改已保存，补填截止时自动提交。'
            : '请在补填截止前保存地址，未保存将记为未填写。'}
        </p>
      )}
      {g.state === 'grace' && g.grace_until && <p>补填截止 {lastEditableMinute(g.grace_until)}</p>}
      {g.deadline && !g.has_address && !g.waived && (g.state === 'open' || g.state === 'overdue') && (
        <p>收集截止 {lastEditableMinute(g.deadline)}</p>
      )}
      {g.waived && <p>已放弃</p>}
      {g.state === 'ready' && <p>待发货</p>}
      {g.tracking && <p>已发货 · 邮寄单号 {g.tracking}</p>}
      {g.needs_reship && <p>舰礼已升档，待补寄</p>}
      {g.waived && editable && (
        <ActionForm
          submit="恢复领取"
          action={async () => {
            await request('/me/gifts/' + g.month + '/' + g.uid, { waive: false });
            await reload();
          }}
        />
      )}
      {editing && editable && (
        <MemberDialog
          opener={editButton}
          title={g.refill_requested ? '重新填写舰礼地址' : '修改舰礼地址'}
          onDismiss={() => setEditing(false)}
        >
          <ActionForm
            submit={g.refill_requested ? '保存修改' : '保存收件地址'}
            action={(data) =>
              saveAddress(
                g.refill_requested
                  ? { ...readAddress(data), confirm_refill: true }
                  : readAddress(data)
              )
            }
          >
            {defaultAddress && (
              <button
                type="button"
                className={s.secondary}
                onClick={() => setDefaultCopies((n) => n + 1)}
              >
                使用默认地址
              </button>
            )}
            <div className={s.addressGrid} key={defaultCopies}>
              <AddressFields
                address={defaultCopies ? defaultAddress : (g.address ?? g.returned_address)}
              />
            </div>
          </ActionForm>
        </MemberDialog>
      )}
    </article>
  );
}

export default function PersonalScreen({
  initialUid,
  openAddress
}: {
  initialUid: string;
  openAddress: boolean;
}) {
  const [focusUid, setFocusUid] = useState(initialUid);
  return (
    <PersonalShell watchGifts loginQuery={personalQuery(initialUid, openAddress ? 'address' : undefined)}>
      {(profile, reload) => {
        const addressPanel = (
          <AddressPanel
            profile={profile}
            reload={reload}
            open={openAddress}
            initialUid={initialUid}
          />
        );
        const visibleGifts = profile.gifts.filter((g) => !focusUid || g.uid === focusUid);
        return (
          <>
            {openAddress && addressPanel}
            <Panel title="我的舰礼">
              {profile.bindings.length > 1 && (
                <label className={s.field}>
                  筛选 UID
                  <select value={focusUid} onChange={(e) => setFocusUid(e.target.value)}>
                    <option value="">所有 UID</option>
                    {[
                      ...new Set([
                        ...profile.bindings.map((b) => b.uid),
                        ...profile.gifts.map((g) => g.uid)
                      ])
                    ].map((uid) => (
                      <option key={uid}>{uid}</option>
                    ))}
                  </select>
                </label>
              )}
              {focusUid && <button onClick={() => setFocusUid('')}>查看全部 UID</button>}
              {!visibleGifts.length && <p className={s.empty}>暂无已开放的月度舰礼记录。</p>}
              {visibleGifts.map((g) => (
                <GiftCard
                  key={g.month + '/' + g.uid}
                  gift={g}
                  defaultAddress={profile.address}
                  reload={reload}
                />
              ))}
            </Panel>
            {!openAddress && addressPanel}
          </>
        );
      }}
    </PersonalShell>
  );
}
