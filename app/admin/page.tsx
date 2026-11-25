'use client';

import { API_BASE_URL } from '@/lib/api-origin';
import { request } from '@/lib/member';
import { beijingGiftMonth } from '@/lib/captaingift-months';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

type BoxResponse = {
  code: number;
  items: unknown[];
};

type TagResponse = {
  code: number;
  items: string[];
};

type CaptainResponse = {
  code: number;
  items: unknown[];
};

type CountState = {
  pending: number | null;
  approved: number | null;
  tags: number | null;
  captains: number | null;
};

type GiftSummary = {
  archive: { month: string; uploaded: boolean };
  collection: { month: string; collected: number; missing: number } | null;
};

const TOKEN_KEY = 'harei-admin-token';
const TOKEN_EXPIRES_KEY = 'harei-admin-token-expires';

const getItemCount = (items: unknown[] | undefined) => (Array.isArray(items) ? items.length : 0);

export default function AdminPage() {
  const [giftSummary, setGiftSummary] = useState<GiftSummary | null>(null);
  const [giftStatus, setGiftStatus] = useState('加载中…');
  const [counts, setCounts] = useState<CountState>({
    pending: null,
    approved: null,
    tags: null,
    captains: null
  });

  const currentMonth = useMemo(() => beijingGiftMonth(), []);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    const expiresAt = Number(localStorage.getItem(TOKEN_EXPIRES_KEY));

    if (!token || !expiresAt || Number.isNaN(expiresAt) || Date.now() > expiresAt) {
      return;
    }

    let active = true;
    request<GiftSummary>('/admin/member-gifts/summary', undefined, 'GET', token)
      .then((summary) => {
        if (active) setGiftSummary(summary);
      })
      .catch(() => {
        if (active) setGiftStatus('状态暂不可用');
      });

    const fetchCounts = async () => {
      try {
        const authResponse = await fetch(`${API_BASE_URL}/auth`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (!authResponse.ok) {
          return;
        }

        const authData = (await authResponse.json()) as { code: number; authenticated: boolean };
        if (authData.code !== 0 || !authData.authenticated) {
          return;
        }

        const [pendingResponse, approvedResponse, tagResponse, captainResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/box/approved`, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }),
          fetch(`${API_BASE_URL}/box/pending`, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }),
          fetch(`${API_BASE_URL}/tag/active`),
          fetch(`${API_BASE_URL}/captains?month=${currentMonth}`, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          })
        ]);

        const pendingData = pendingResponse.ok ? ((await pendingResponse.json()) as BoxResponse) : null;
        const approvedData = approvedResponse.ok ? ((await approvedResponse.json()) as BoxResponse) : null;
        const tagData = tagResponse.ok ? ((await tagResponse.json()) as TagResponse) : null;
        const captainData = captainResponse.ok ? ((await captainResponse.json()) as CaptainResponse) : null;

        setCounts({
          pending: getItemCount(pendingData?.items),
          approved: getItemCount(approvedData?.items),
          tags: getItemCount(tagData?.items),
          captains: getItemCount(captainData?.items)
        });
      } catch (error) {
        setCounts({
          pending: 0,
          approved: 0,
          tags: 0,
          captains: 0
        });
      }
    };

    fetchCounts();
    return () => {
      active = false;
    };
  }, [currentMonth]);

  const pendingText =
    counts.pending === null ? '加载中...' : counts.pending === 0 ? '无未读消息' : `${counts.pending}条未读`;
  const approvedText =
    counts.approved === null
      ? '加载中...'
      : counts.approved === 0
        ? '无未审核消息'
        : `${counts.approved}条未审核`;
  const tagText = counts.tags === null ? '加载中...' : counts.tags === 0 ? '无活跃tag' : `${counts.tags}条活跃tag`;
  const captainText =
    counts.captains === null ? '加载中...' : `本月${counts.captains}条上舰记录`;
  const collection = giftSummary?.collection;
  const archiveText = giftSummary
    ? giftSummary.archive.month + (giftSummary.archive.uploaded ? '已上传' : '未上传')
    : giftStatus;
  const collectionText = collection ? (
    <>{collection.month} · <span>已收集{collection.collected}条，</span><span>{collection.missing}条未填写</span></>
  ) : giftSummary ? '未开始地址收集' : giftStatus;

  return (
    <section className="admin-page admin-home-page">
      <div className="admin-dashboard">
        <div className="admin-header">
          <h1 className="admin-title">后台管理</h1>
          <p className="admin-subtitle">请选择需要进入的管理模块。</p>
        </div>
        <div className="admin-grid">
          <Link className="admin-panel-card" href="/admin/message">
            <div className="admin-panel-title">留言箱</div>
            <div className="admin-panel-subtitle">{pendingText}</div>
          </Link>
          <Link className="admin-panel-card" href="/admin/audit">
            <div className="admin-panel-title">审核界面</div>
            <div className="admin-panel-subtitle">{approvedText}</div>
          </Link>
          <Link className="admin-panel-card" href="/admin/tag">
            <div className="admin-panel-title">tag管理</div>
            <div className="admin-panel-subtitle">{tagText}</div>
          </Link>
          <Link className="admin-panel-card" href="/admin/captains">
            <div className="admin-panel-title">舰长列表</div>
            <div className="admin-panel-subtitle">{captainText}</div>
          </Link>
          <Link className="admin-panel-card" href="/admin/captaingift">
            <div className="admin-panel-title">舰礼留档</div>
            <div className="admin-panel-subtitle">{archiveText}</div>
          </Link>
          <Link
            className="admin-panel-card"
            href={collection ? `/admin/member-gifts?month=${collection.month}` : '/admin/member-gifts'}
          >
            <div className="admin-panel-title">地址管理</div>
            <div className="admin-panel-subtitle">{collectionText}</div>
          </Link>
        </div>
      </div>
    </section>
  );
}
