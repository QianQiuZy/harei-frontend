'use client';

import { useLayoutEffect, useRef } from 'react';
import { ActionForm, Field, s, value } from '@/components/member/MemberUI';
import { rememberFeedbackOpener } from '@/components/member/ActionFeedback';

type Props = {
  row: {
    uid: string;
    nickname: string;
    tier: string;
    state: string;
    collection_status: string;
    can_return_address: boolean;
  };
  anchor: HTMLButtonElement;
  onClose: () => void;
  update: (suffix: string, body: unknown, method?: string) => Promise<void>;
};

export default function GiftManagement({ row, anchor, onClose, update }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const panel = panelRef.current;
    const table = anchor.closest('table');
    const container = table?.parentElement;
    if (!panel || !table || !container) return;
    rememberFeedbackOpener(panel, anchor);
    panel.showPopover();
    const place = () => {
      const gap = 8;
      const rightEdge = document.documentElement.clientWidth - gap;
      const width = panel.offsetWidth;
      // On desktop, make room in the flexible nickname column for the right-hand panel.
      const bounds = container.getBoundingClientRect();
      const reserve = Math.min(
        Math.max(0, bounds.width - parseFloat(getComputedStyle(table).minWidth)),
        Math.max(0, bounds.right + gap + width - rightEdge)
      );
      container.style.paddingRight = reserve + 'px';
      const trigger = anchor.getBoundingClientRect();
      if (trigger.bottom <= 0 || trigger.top >= window.innerHeight) {
        onClose();
        return;
      }
      const left =
        trigger.right + gap + width <= rightEdge ? trigger.right + gap : trigger.left - gap - width;
      panel.style.left = Math.max(gap, Math.min(left, rightEdge - width)) + 'px';
      panel.style.top =
        Math.max(gap, Math.min(trigger.top, window.innerHeight - gap - panel.offsetHeight)) + 'px';
    };
    place();
    panel.focus({ preventScroll: true });
    const outside = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !panel.contains(event.target) &&
        !anchor.contains(event.target)
      )
        onClose();
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        anchor.focus({ preventScroll: true });
        onClose();
      }
    };
    const observer = new ResizeObserver(place);
    observer.observe(panel);
    observer.observe(table);
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('keydown', escape);
      container.style.removeProperty('padding-right');
      panel.hidePopover();
    };
  }, [anchor, onClose]);

  return (
    <div
      id="gift-management"
      ref={panelRef}
      popover="manual"
      role="dialog"
      tabIndex={-1}
      aria-labelledby="gift-management-title"
      className={s.managementPopover}
    >
      <div className={s.detailHeading}>
        <h3 id="gift-management-title">
          {row.nickname || '舰礼管理'}
          <small>UID {row.uid}</small>
        </h3>
        <button
          type="button"
          className={s.secondary}
          onClick={() => {
            anchor.focus({ preventScroll: true });
            onClose();
          }}
        >
          关闭
        </button>
      </div>
      {row.state === 'shipped' ? (
        <p>已发货</p>
      ) : (
        <ActionForm
          submit="保存档位"
          action={(d) =>
            update('/tier', {
              tier: Number(value(d, 'tier')),
              reason: value(d, 'reason')
            })
          }
        >
          <fieldset className={s.tierChoices}>
            <legend>核定档位</legend>
            {(['舰长', '提督', '总督'] as const).map((tier, i) => (
              <label key={tier}>
                <input type="radio" name="tier" value={3 - i} defaultChecked={tier === row.tier} />
                {tier}
              </label>
            ))}
          </fieldset>
          <Field label="核验依据" name="reason" minLength={2} maxLength={300} />
        </ActionForm>
      )}
      {(row.can_return_address || row.collection_status === '修改中') && (
        <ActionForm
          submit={row.can_return_address ? '地址打回' : '修改中'}
          disabled={!row.can_return_address}
          action={async () => {
            await update('/return-address', {}, 'POST');
            return '地址已打回';
          }}
        />
      )}
    </div>
  );
}
