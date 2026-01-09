'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

type BoxItem = {
  id: number;
  created_at: string;
  msg: string;
  tag: string;
  images: string[];
  images_thumb: string[];
  images_jpg: string[];
};

type BoxResponse = {
  code: number;
  items: BoxItem[];
};

type AuthResponse = {
  code: number;
  authenticated: boolean;
};

type MessageResponse = {
  code: number;
  message: string;
};

const API_HOST = 'https://api.harei.cn';
const TOKEN_KEY = 'harei-admin-token';
const TOKEN_EXPIRES_KEY = 'harei-admin-token-expires';

const formatDateTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

const buildImageUrl = (type: 'thumb' | 'jpg' | 'original', path: string, token: string) =>
  `/api/admin-image?type=${type}&path=${encodeURIComponent(path)}&token=${encodeURIComponent(
    token
  )}`;

export default function AdminMessagePage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [items, setItems] = useState<BoxItem[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [readIds, setReadIds] = useState<Set<number>>(new Set());
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [viewerScale, setViewerScale] = useState(1);
  const [viewerOffset, setViewerOffset] = useState({ x: 0, y: 0 });
  const [viewerDragging, setViewerDragging] = useState(false);
  const dragOriginRef = useRef({ x: 0, y: 0 });
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const dragNextOffsetRef = useRef({ x: 0, y: 0 });
  const dragRafRef = useRef<number | null>(null);
  const viewerDragMovedRef = useRef(false);
  const viewerClickGuardRef = useRef(false);
  const [viewerOriginalSet, setViewerOriginalSet] = useState<Set<string>>(new Set());
  const previousSelectedRef = useRef<number | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      const expiresAt = Number(localStorage.getItem(TOKEN_EXPIRES_KEY));

      if (!storedToken || !expiresAt || Number.isNaN(expiresAt) || Date.now() > expiresAt) {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(TOKEN_EXPIRES_KEY);
        router.replace('/login');
        return;
      }

      try {
        const response = await fetch(`${API_HOST}/auth`, {
          headers: {
            Authorization: `Bearer ${storedToken}`
          }
        });

        if (!response.ok) {
          throw new Error('auth failed');
        }

        const data = (await response.json()) as AuthResponse;
        if (data.code !== 0 || !data.authenticated) {
          throw new Error('auth failed');
        }

        setToken(storedToken);
      } catch (error) {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(TOKEN_EXPIRES_KEY);
        router.replace('/login');
      }
    };

    checkAuth();
  }, [router]);

  useEffect(() => {
    if (!token) {
      return;
    }

    const fetchItems = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`${API_HOST}/box/pending`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('fetch failed');
        }

        const data = (await response.json()) as BoxResponse;
        if (data.code !== 0) {
          throw new Error('fetch failed');
        }
        const sortedItems = [...(data.items ?? [])].sort((a, b) => a.id - b.id);
        setItems(sortedItems);
        if (sortedItems.length) {
          setSelectedId((current) => current ?? sortedItems[0].id);
        }
      } catch (error) {
        setItems([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchItems();
  }, [token]);

  const selectedItem = useMemo(
    () => items.find((item) => item.id === selectedId) ?? null,
    [items, selectedId]
  );

  useEffect(() => {
    if (selectedId === null) {
      previousSelectedRef.current = null;
      return;
    }

    const previousId = previousSelectedRef.current;
    if (previousId !== null && previousId !== selectedId) {
      setReadIds((prev) => {
        const next = new Set(prev);
        next.add(previousId);
        return next;
      });
    }
    previousSelectedRef.current = selectedId;
  }, [selectedId]);

  const handleSelect = (item: BoxItem) => {
    if (viewerOpen) {
      closeViewer();
    }
    setSelectedId(item.id);
  };

  const handleDelete = async () => {
    if (!token || !selectedItem) {
      return;
    }
    try {
      const response = await fetch(`${API_HOST}/box/delete`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id: selectedItem.id })
      });
      if (!response.ok) {
        throw new Error('delete failed');
      }
      const data = (await response.json()) as MessageResponse;
      if (data.code !== 0) {
        throw new Error('delete failed');
      }
      setStatusMessage(data.message);
      setItems((prev) => prev.filter((item) => item.id !== selectedItem.id));
      setSelectedId((prev) => {
        if (prev !== selectedItem.id) {
          return prev;
        }
        const remaining = items.filter((item) => item.id !== selectedItem.id);
        return remaining[0]?.id ?? null;
      });
    } catch (error) {
      setStatusMessage('删除失败，请稍后重试');
    }
  };

  const handleArchive = async () => {
    if (!token) {
      return;
    }
    try {
      const response = await fetch(`${API_HOST}/box/approve`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error('archive failed');
      }
      const data = (await response.json()) as MessageResponse;
      if (data.code !== 0) {
        throw new Error('archive failed');
      }
      setStatusMessage(data.message);
    } catch (error) {
      setStatusMessage('过审失败，请稍后重试');
    }
  };

  const currentImages = selectedItem?.images_jpg ?? [];
  const currentThumbs = selectedItem?.images_thumb ?? [];
  const currentOriginals = selectedItem?.images ?? [];
  const hasImages = currentThumbs.length > 0;

  const openViewer = (index: number) => {
    setViewerIndex(index);
    setViewerScale(1);
    setViewerOffset({ x: 0, y: 0 });
    viewerDragMovedRef.current = false;
    viewerClickGuardRef.current = false;
    setViewerOpen(true);
  };

  const closeViewer = () => {
    setViewerOpen(false);
    setViewerScale(1);
    setViewerOffset({ x: 0, y: 0 });
    viewerDragMovedRef.current = false;
    viewerClickGuardRef.current = false;
  };

  const handlePrev = (event?: React.MouseEvent<HTMLButtonElement>) => {
    event?.stopPropagation();
    if (!currentImages.length) {
      return;
    }
    setViewerIndex((prev) => (prev - 1 + currentImages.length) % currentImages.length);
    setViewerScale(1);
    setViewerOffset({ x: 0, y: 0 });
  };

  const handleNext = (event?: React.MouseEvent<HTMLButtonElement>) => {
    event?.stopPropagation();
    if (!currentImages.length) {
      return;
    }
    setViewerIndex((prev) => (prev + 1) % currentImages.length);
    setViewerScale(1);
    setViewerOffset({ x: 0, y: 0 });
  };

  const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    const delta = event.deltaY > 0 ? -0.1 : 0.1;
    setViewerScale((prev) => Math.min(3, Math.max(0.5, prev + delta)));
  };

  const handleDragStart = (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    setViewerDragging(true);
    dragOriginRef.current = { x: event.clientX, y: event.clientY };
    dragOffsetRef.current = { ...viewerOffset };
    viewerDragMovedRef.current = false;
  };

  const handleDragMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!viewerDragging) {
      return;
    }
    const deltaX = event.clientX - dragOriginRef.current.x;
    const deltaY = event.clientY - dragOriginRef.current.y;
    if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) {
      viewerDragMovedRef.current = true;
    }
    dragNextOffsetRef.current = {
      x: dragOffsetRef.current.x + deltaX,
      y: dragOffsetRef.current.y + deltaY
    };
    if (dragRafRef.current === null) {
      dragRafRef.current = window.requestAnimationFrame(() => {
        setViewerOffset({ ...dragNextOffsetRef.current });
        dragRafRef.current = null;
      });
    }
  };

  const handleDragEnd = () => {
    setViewerDragging(false);
    viewerClickGuardRef.current = viewerDragMovedRef.current;
    if (dragRafRef.current !== null) {
      window.cancelAnimationFrame(dragRafRef.current);
      dragRafRef.current = null;
    }
  };

  const handleViewerClick = () => {
    if (viewerDragging || viewerClickGuardRef.current || viewerDragMovedRef.current) {
      viewerClickGuardRef.current = false;
      viewerDragMovedRef.current = false;
      return;
    }
    closeViewer();
  };

  const currentOriginalPath = currentOriginals[viewerIndex];
  const currentDisplayPath = viewerOriginalSet.has(currentOriginalPath)
    ? currentOriginalPath
    : currentImages[viewerIndex];
  const currentDisplayUrl =
    currentDisplayPath && token
      ? buildImageUrl(
          viewerOriginalSet.has(currentOriginalPath) ? 'original' : 'jpg',
          currentDisplayPath,
          token
        )
      : undefined;

  const headerText = selectedItem
    ? `${selectedItem.id}-${formatDateTime(selectedItem.created_at)}`
    : '暂无留言';
  const sortedItems = useMemo(() => [...items].sort((a, b) => a.id - b.id), [items]);

  return (
    <section className="admin-page admin-message-page">
      <div className="admin-message-card">
        <header className="admin-message-header">
          <div>
            <h1 className="admin-message-title">留言箱</h1>
            <p className="admin-message-subtitle">待审核留言列表</p>
          </div>
          {statusMessage ? <span className="admin-message-status">{statusMessage}</span> : null}
        </header>
        <div className="admin-message-body">
          <aside className="admin-message-list">
            {isLoading ? (
              <div className="admin-message-empty">加载中...</div>
            ) : items.length === 0 ? (
              <div className="admin-message-empty">暂无留言</div>
            ) : (
              sortedItems.map((item) => {
                const label = `${item.id}-${formatDateTime(item.created_at)}`;
                const isSelected = item.id === selectedId;
                const isRead = readIds.has(item.id);
                return (
                  <button
                    type="button"
                    key={item.id}
                    className={`admin-message-item${isSelected ? ' is-active' : ''}${
                      isRead ? ' is-read' : ''
                    }`}
                    onClick={() => handleSelect(item)}
                  >
                    {label}
                  </button>
                );
              })
            )}
          </aside>
          <div className="admin-message-detail">
            <div className="admin-message-detail-scroll">
              <div className="admin-message-detail-header">{headerText}</div>
              {selectedItem ? (
                <div className="admin-message-content">{selectedItem.msg}</div>
              ) : (
                <div className="admin-message-content">请选择左侧留言</div>
              )}
            </div>
            {selectedItem && hasImages ? (
              <div className="admin-message-images-panel">
                <div className="admin-message-divider" />
                <div className="admin-message-thumbs">
                  {currentThumbs.map((path, index) => (
                    <button
                      key={path}
                      type="button"
                      className="admin-message-thumb"
                      onClick={() => openViewer(index)}
                    >
                      {token ? (
                        <img src={buildImageUrl('thumb', path, token)} alt={`缩略图${index + 1}`} />
                      ) : (
                        <span>加载中...</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
            <div className="admin-message-actions">
              <button type="button" className="admin-message-button is-ghost" onClick={handleArchive}>
                一键过审
              </button>
              <button type="button" className="admin-message-button" onClick={handleDelete}>
                删除
              </button>
            </div>
            {viewerOpen && selectedItem ? (
              <div
                className="admin-message-viewer"
                onClick={handleViewerClick}
                onWheel={handleWheel}
                onMouseMove={handleDragMove}
                onMouseUp={handleDragEnd}
                onMouseLeave={handleDragEnd}
              >
                <button
                  type="button"
                  className="admin-message-viewer-nav is-prev"
                  onClick={handlePrev}
                >
                  &lt;
                </button>
                <div
                  className={`admin-message-viewer-canvas${
                    viewerDragging ? ' is-dragging' : ''
                  }`}
                  onMouseDown={handleDragStart}
                >
                  {currentDisplayUrl ? (
                    <img
                      src={currentDisplayUrl}
                      alt="留言图片"
                      className={viewerDragging ? 'is-dragging' : undefined}
                      style={{
                        transform: `translate(${viewerOffset.x}px, ${viewerOffset.y}px) scale(${viewerScale})`
                      }}
                      onError={() => {
                        if (!currentOriginalPath || viewerOriginalSet.has(currentOriginalPath)) {
                          return;
                        }
                        setViewerOriginalSet((prev) => new Set(prev).add(currentOriginalPath));
                      }}
                    />
                  ) : (
                    <span>图片加载中...</span>
                  )}
                </div>
                <button
                  type="button"
                  className="admin-message-viewer-nav is-next"
                  onClick={handleNext}
                >
                  &gt;
                </button>
                {!viewerOriginalSet.has(currentOriginalPath) ? (
                  <button
                    type="button"
                    className="admin-message-viewer-original"
                    onClick={(event) => {
                      event.stopPropagation();
                      if (!currentOriginalPath) {
                        return;
                      }
                      setViewerOriginalSet((prev) => new Set(prev).add(currentOriginalPath));
                    }}
                  >
                    显示原图
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
