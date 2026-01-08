'use client';

import { useBackgroundAnimation } from './useBackgroundAnimation';

export const BackgroundAnimationToggle = () => {
  const { area, enabled, toggle } = useBackgroundAnimation();

  return (
    <button className="bg-toggle" type="button" onClick={toggle}>
      {area === 'admin' ? '后台' : '前台'}背景动效：{enabled ? '开' : '关'}
    </button>
  );
};
