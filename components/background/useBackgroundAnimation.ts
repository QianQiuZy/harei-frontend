'use client';

import { useEffect, useMemo, useState } from 'react';
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

export const useBackgroundAnimation = (): AnimationSetting => {
  const pathname = usePathname();
  const area = useMemo<BackgroundArea>(
    () => (pathname.startsWith('/admin') ? 'admin' : 'front'),
    [pathname]
  );
  const [enabled, setEnabled] = useState(() => getDefaultEnabled(area));

  useEffect(() => {
    setEnabled(readSetting(area));
  }, [area]);

  useEffect(() => {
    const handleChange = (event: Event) => {
      if (event instanceof CustomEvent) {
        const detail = event.detail as { area: BackgroundArea; enabled: boolean };
        if (detail.area === area) {
          setEnabled(detail.enabled);
        }
      }
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === getStorageKey(area)) {
        setEnabled(readSetting(area));
      }
    };

    window.addEventListener('harei-bg-animation-change', handleChange);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('harei-bg-animation-change', handleChange);
      window.removeEventListener('storage', handleStorage);
    };
  }, [area]);

  const toggle = () => {
    const nextValue = !enabled;
    setEnabled(nextValue);
    writeSetting(area, nextValue);
  };

  return { area, enabled, toggle };
};
