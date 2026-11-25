'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { ApiError } from '@/lib/member';
import { ActionForm } from './MemberUI';
import { useSecondsLeft } from './useSecondsLeft';

type Props = {
  purpose: string;
  submit: string;
  inline?: boolean;
  send: (data: FormData) => Promise<{ retry_after: number }>;
  note: string;
  children?: ReactNode;
};

export default function EmailCodeForm({ purpose, submit, inline, send, note, children }: Props) {
  const key = 'harei-email-resend:' + purpose;
  const [until, setUntil] = useState(() => Number(localStorage.getItem(key)) || 0);
  const seconds = useSecondsLeft(until);
  useEffect(() => {
    const sync = (event: StorageEvent) => {
      if (event.key === key) setUntil(Number(event.newValue) || 0);
    };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, [key]);
  const wait = (delay: number) => {
    const deadline = Date.now() + delay * 1000;
    localStorage.setItem(key, String(deadline));
    setUntil(deadline);
  };
  return (
    <ActionForm
      inline={inline}
      disabled={seconds > 0}
      submit={seconds ? `${seconds} 秒后可重发` : submit}
      action={async (data) => {
        try {
          const result = await send(data);
          wait(result.retry_after);
          return note;
        } catch (err) {
          if (err instanceof ApiError && err.retryAfter > 0) wait(err.retryAfter);
          throw err;
        }
      }}
    >
      {children}
    </ActionForm>
  );
}
