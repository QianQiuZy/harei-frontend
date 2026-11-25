'use client';

import type { ReactNode } from 'react';
import { s } from '@/components/member/MemberUI';
import { beijingGiftMonth, FIRST_GIFT_YEAR } from '@/lib/captaingift-months';

export function GiftMonthHeader({
  title,
  month,
  onChange,
  children
}: {
  title: string;
  month: string;
  onChange: (month: string) => void;
  children?: ReactNode;
}) {
  const year = Number(month.slice(0, 4));
  const lastYear = Math.min(9999, Math.max(year, Number(beijingGiftMonth().slice(0, 4))) + 1);
  const select = (next: string) => {
    onChange(next);
    window.history.replaceState(null, '', window.location.pathname + '?month=' + next);
  };
  return (
    <header className={s.workspaceHeader}>
      <div>
        <h1>{title}</h1>
        {children && <p>{children}</p>}
      </div>
      <fieldset className={s.monthPicker}>
        <legend>舰礼月份</legend>
        <select
          aria-label="舰礼年份"
          value={year}
          onChange={(e) => select(e.target.value + month.slice(4))}
        >
          {Array.from(
            { length: lastYear - FIRST_GIFT_YEAR + 1 },
            (_, i) => FIRST_GIFT_YEAR + i
          ).map((y) => (
            <option key={y} value={y}>
              {y} 年
            </option>
          ))}
        </select>
        <select
          aria-label="舰礼月份"
          value={month.slice(4)}
          onChange={(e) => select(String(year) + e.target.value)}
        >
          {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')).map((m) => (
            <option key={m} value={m}>
              {Number(m)} 月
            </option>
          ))}
        </select>
      </fieldset>
    </header>
  );
}
