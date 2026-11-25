'use client';

import { useRef, useState } from 'react';
import { memberFetch, request } from '@/lib/member';
import { errorText, s } from '@/components/member/MemberUI';
import { feedbackAnchor, useActionFeedback } from '@/components/member/ActionFeedback';

export default function FulfillmentActions({
  month,
  token,
  settled,
  recipient,
  closed,
  reload
}: {
  month: string;
  token: string;
  settled: boolean;
  recipient?: string;
  closed: boolean;
  reload: () => void;
}) {
  const path = '/admin/member-gifts/months/' + month;
  const fileInput = useRef<HTMLInputElement>(null);
  const uploadButton = useRef<HTMLButtonElement>(null);
  const [busy, setBusy] = useState('');
  const setFeedback = useActionFeedback();
  async function perform(
    trigger: HTMLButtonElement,
    name: string,
    action: () => Promise<string | void>
  ) {
    if (busy) return;
    const anchor = feedbackAnchor(trigger);
    setBusy(name);
    setFeedback(null);
    try {
      const message = await action();
      if (message) setFeedback({ text: message, anchor });
    } catch (err) {
      setFeedback({ text: errorText(err), error: true, anchor });
    } finally {
      setBusy('');
      reload();
    }
  }
  return (
    <div className={s.fulfillmentActions}>
      <div>
        {closed && (
          <>
            <button
              type="button"
              className={s.secondary}
              disabled={!!busy}
              onClick={(e) =>
                void perform(e.currentTarget, 'download', async () => {
                  const res = await memberFetch(
                    path + '/tracking-template',
                    undefined,
                    'GET',
                    token
                  );
                  const url = URL.createObjectURL(await res.blob());
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = '寄送单号_' + month + '.xlsx';
                  link.click();
                  setTimeout(() => URL.revokeObjectURL(url), 1000);
                })
              }
            >
              下载模板
            </button>
            <input
              type="file"
              hidden
              ref={fileInput}
              aria-label="单号表格"
              accept=".xlsx"
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = '';
                if (!file || !uploadButton.current) return;
                void perform(uploadButton.current, 'upload', async () => {
                  const data = new FormData();
                  data.set('file', file);
                  const result = await request<{ changed: number; unchanged: number }>(
                    path + '/tracking-import',
                    data,
                    'POST',
                    token
                  );
                  return `单号已更新 ${result.changed} 条，未变动 ${result.unchanged} 条。`;
                });
              }}
            />
            <button
              type="button"
              className={s.secondary}
              disabled={!!busy}
              ref={uploadButton}
              onClick={() => fileInput.current?.click()}
            >
              {busy === 'upload' ? '正在上传…' : '上传单号表格'}
            </button>
          </>
        )}
        <button
          type="button"
          disabled={!!busy || !settled}
          title={recipient ? '发送整月名单至 ' + recipient : undefined}
          onClick={(e) =>
            void perform(e.currentTarget, 'email', async () => {
              const res = await request<{ recipient: string }>(path + '/email', {}, 'POST', token);
              return '本月名单已发送至 ' + res.recipient;
            })
          }
        >
          {busy === 'email' ? '正在发送…' : '发送到邮箱'}
        </button>
      </div>
    </div>
  );
}
