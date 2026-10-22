'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLegacyAdminToken } from '@/lib/auth/useLegacyAdminToken';

type TagResponse = {
  code: number;
  items: string[];
};

type MessageResponse = {
  code: number;
  message: string;
};

const API_HOST = 'https://api.harei.cn';

const fetchTags = async () => {
  const response = await fetch(`${API_HOST}/tag/active`);
  if (!response.ok) throw new Error('fetch failed');
  const data = (await response.json()) as TagResponse;
  if (data.code !== 0) throw new Error('fetch failed');
  return data.items ?? [];
};

export default function AdminTagPage() {
  const router = useRouter();
  const token = useLegacyAdminToken();
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const refreshTags = async () => {
    try {
      setTags(await fetchTags());
    } catch (error) {
      setTags([]);
    }
  };

  useEffect(() => {
    let active = true;
    void fetchTags()
      .then((items) => { if (active) setTags(items); })
      .catch(() => { if (active) setTags([]); })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, []);

  const handleAdd = async () => {
    const tagName = tagInput.trim();
    if (!tagName) {
      setStatusMessage('请输入tag名称');
      return;
    }
    if (!token) {
      router.replace('/login');
      return;
    }
    setIsSubmitting(true);
    setStatusMessage('');
    try {
      const response = await fetch(`${API_HOST}/tag/add`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ tag_name: tagName })
      });
      if (!response.ok) {
        throw new Error('add failed');
      }
      const data = (await response.json()) as MessageResponse;
      if (data.code !== 0) {
        throw new Error('add failed');
      }
      setStatusMessage(data.message || '添加成功');
      setTagInput('');
      await refreshTags();
    } catch (error) {
      setStatusMessage('添加失败，请稍后重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleArchive = async (tagName: string) => {
    if (!token) {
      router.replace('/login');
      return;
    }
    setIsSubmitting(true);
    setStatusMessage('');
    try {
      const response = await fetch(`${API_HOST}/tag/archived`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ tag_name: tagName })
      });
      if (!response.ok) {
        throw new Error('archive failed');
      }
      const data = (await response.json()) as MessageResponse;
      if (data.code !== 0) {
        throw new Error('archive failed');
      }
      setStatusMessage(data.message || '归档成功');
      await refreshTags();
    } catch (error) {
      setStatusMessage('归档失败，请稍后重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="admin-page admin-tag-page">
      <div className="admin-tag-card">
        <header className="admin-tag-header">
          <h1 className="admin-tag-title">tag管理</h1>
          {statusMessage ? <span className="admin-tag-status">{statusMessage}</span> : null}
        </header>
        <div className="admin-tag-input-row">
          <input
            type="text"
            className="admin-tag-input"
            placeholder="请输入tag名称"
            value={tagInput}
            onChange={(event) => setTagInput(event.target.value)}
          />
          <button
            type="button"
            className="admin-tag-button"
            onClick={handleAdd}
            disabled={isSubmitting}
          >
            添加
          </button>
        </div>
        <div className="admin-tag-list">
          {isLoading ? (
            <div className="admin-tag-empty">加载中...</div>
          ) : tags.length === 0 ? (
            <div className="admin-tag-empty">暂无活动tag</div>
          ) : (
            tags.map((tag) => (
              <div key={tag} className="admin-tag-item">
                <span className="admin-tag-name">{tag}</span>
                <button
                  type="button"
                  className="admin-tag-archive"
                  onClick={() => handleArchive(tag)}
                  disabled={isSubmitting}
                >
                  归档
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
