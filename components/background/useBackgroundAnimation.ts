'use client';

import { useSyncExternalStore } from 'react';
import { usePathname } from 'next/navigation';

type BackgroundArea = 'front' | 'admin';

type AnimationSetting = {
  area: BackgroundArea;
  enabled: boolean;
  toggle: () => void;
};

const STORAGE_PREFIX = 'harei:bg-animation';

const getDefaultEnabled = (area: BackgroundArea) => (area === 'admin' ? false : true);

const getStorageKey = (area: BackgroundArea) => `${STORAGE_PREFIX}:${area}`;

const readSetting = (area: BackgroundArea) => {
  if (typeof window === 'undefined') {
    return getDefaultEnabled(area);
  }
  const stored = window.localStorage.getItem(getStorageKey(area));
  if (stored === null) {
    return getDefaultEnabled(area);
  }
  return stored === 'true';
};

const writeSetting = (area: BackgroundArea, enabled: boolean) => {
  window.localStorage.setItem(getStorageKey(area), String(enabled));
  window.dispatchEvent(
    new CustomEvent('harei-bg-animation-change', {
      detail: { area, enabled }
    })
  );
};

const subscribe = (onChange: () => void) => {
  window.addEventListener('harei-bg-animation-change', onChange);
  window.addEventListener('storage', onChange);
  return () => {
    window.removeEventListener('harei-bg-animation-change', onChange);
    window.removeEventListener('storage', onChange);
  };
};

export const useBackgroundAnimation = (): AnimationSetting => {
  const pathname = usePathname();
  const area: BackgroundArea = pathname.startsWith('/admin') ? 'admin' : 'front';
  const enabled = useSyncExternalStore(
    subscribe,
    () => readSetting(area),
    () => getDefaultEnabled(area)
  );

  const toggle = () => {
    const nextValue = !enabled;
    writeSetting(area, nextValue);
  };

  return { area, enabled, toggle };
};
