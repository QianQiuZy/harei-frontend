'use client';

import { createContext, useContext, type ReactNode } from 'react';
import type { SessionKind, StoredSession } from '@/lib/auth/session';

type MusicAdminSessionValue = {
  readonly kind: SessionKind;
  readonly session: StoredSession;
};

const MusicAdminSessionContext = createContext<MusicAdminSessionValue | null>(null);

export const MusicAdminSessionProvider = ({
  value,
  children
}: {
  readonly value: MusicAdminSessionValue;
  readonly children: ReactNode;
}) => <MusicAdminSessionContext.Provider value={value}>{children}</MusicAdminSessionContext.Provider>;

export const useMusicAdminSession = (): MusicAdminSessionValue => {
  const value = useContext(MusicAdminSessionContext);
  if (!value) throw new Error('音乐管理会话尚未初始化');
  return value;
};
