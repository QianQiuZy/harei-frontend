'use client';

import { useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useBackgroundAnimation } from '@/components/background/useBackgroundAnimation';

type NavItem = {
  label: string;
  href: string;
  icon: string;
  external?: boolean;
};

const FRONT_NAV_ITEMS: NavItem[] = [
  { label: '首页', href: '/', icon: '/images/icon/home.png' },
  { label: '歌单', href: '/music', icon: '/images/icon/music.png' },
  { label: '提问箱', href: '/box', icon: '/images/icon/box.png' },
  { label: '豆力巅峰榜', href: '/huangdou', icon: '/images/icon/huangdou.png' },
  { label: '资源下载', href: '/download', icon: '/images/icon/download.png' },
  { label: '舰礼留档', href: '/captaingift', icon: '/images/icon/captaingift.png' },
  {
    label: '了解花礼',
    href: 'https://mzh.moegirl.org.cn/%E8%8A%B1%E7%A4%BC',
    icon: '/images/icon/moegirl.png',
    external: true
  },
  {
    label: '花礼主页',
    href: 'https://space.bilibili.com/1048135385',
    icon: '/images/icon/space.png',
    external: true
  },
  {
    label: '花礼直播间',
    href: 'https://live.bilibili.com/1820703922',
    icon: '/images/icon/stream.png',
    external: true
  },
  {
    label: '花礼录播号',
    href: 'https://space.bilibili.com/3546636416452709',
    icon: '/images/icon/lubo.png',
    external: true
  },
  { label: '关于本站', href: '/about', icon: '/images/icon/zuozhe.png' }
];

const ADMIN_NAV_ITEMS: NavItem[] = [
  { label: '首页', href: '/', icon: '/images/icon/home.png' },
  { label: '管理首页', href: '/admin', icon: '/images/icon/space.png' },
  { label: '留言箱', href: '/admin/message', icon: '/images/icon/box.png' },
  { label: '审核界面', href: '/admin/audit', icon: '/images/icon/lubo.png' },
  { label: '下载资源管理', href: '/admin/download', icon: '/images/icon/download.png' },
  { label: '留言箱tag管理', href: '/admin/tag', icon: '/images/icon/stream.png' },
  { label: '舰长列表', href: '/admin/captains', icon: '/images/icon/moegirl.png' },
  { label: '舰礼留档', href: '/admin/captaingift', icon: '/images/icon/captaingift.png' }
];

export const Sidebar = () => {
  const pathname = usePathname();
  const { enabled, toggle } = useBackgroundAnimation();
  const [open, setOpen] = useState(false);
  const items = useMemo(
    () => (pathname.startsWith('/admin') ? ADMIN_NAV_ITEMS : FRONT_NAV_ITEMS),
    [pathname]
  );

  const handleToggle = () => {
    setOpen((prev) => !prev);
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        className="sidebar-trigger"
        aria-label={open ? '关闭侧边栏' : '打开侧边栏'}
        onClick={handleToggle}
      >
        <span className="sidebar-trigger-bar" />
        <span className="sidebar-trigger-bar" />
        <span className="sidebar-trigger-bar" />
      </button>

      <aside className={`sidebar ${open ? 'is-open' : ''}`} aria-hidden={!open}>
        <div className="sidebar-header">
          <div className="sidebar-switch">
            <span className="sidebar-switch-label">背景切换</span>
            <button
              type="button"
              className={`sidebar-switch-toggle ${enabled ? 'is-on' : 'is-off'}`}
              role="switch"
              aria-checked={enabled}
              onClick={toggle}
            >
              <span className="sidebar-switch-handle" />
            </button>
          </div>
        </div>
        <nav className="sidebar-nav">
          {items.map((item, index) => (
            <a
              key={item.label}
              href={item.href}
              className="sidebar-link"
              style={{ animationDelay: `${120 + index * 60}ms` }}
              target={item.external ? '_blank' : undefined}
              rel={item.external ? 'noreferrer noopener' : undefined}
              onClick={handleClose}
            >
              <span className="sidebar-icon-wrap">
                <img src={item.icon} alt="" className="sidebar-icon" aria-hidden="true" />
              </span>
              <span className="sidebar-text">{item.label}</span>
            </a>
          ))}
        </nav>
      </aside>

      {open ? (
        <button
          type="button"
          className="sidebar-overlay"
          aria-label="关闭侧边栏"
          onClick={handleClose}
        />
      ) : null}
    </>
  );
};
