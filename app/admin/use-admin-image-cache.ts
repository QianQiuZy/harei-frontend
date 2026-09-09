'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export type AdminImageType = 'thumb' | 'jpg' | 'original';
type PreloadImageType = Exclude<AdminImageType, 'original'>;

export type AdminImagePreloadItem = {
  readonly thumbnails: readonly string[];
  readonly jpgs: readonly string[];
};

export type AdminImagePreloadLoader = (
  type: PreloadImageType,
  path: string,
  signal: AbortSignal
) => Promise<boolean>;

type ImageRequest = {
  readonly promise: Promise<boolean>;
  readonly signal?: AbortSignal;
};

type UseAdminImageCacheOptions = {
  readonly token: string | null;
  readonly items: readonly AdminImagePreloadItem[];
  readonly selectedIndex: number;
};

const buildImageUrl = (type: AdminImageType, path: string) =>
  `/api/admin-image?type=${type}&path=${encodeURIComponent(path)}`;

const getCacheKey = (type: AdminImageType, path: string) => `${type}:${path}`;

export async function preloadAdminImages(
  items: readonly AdminImagePreloadItem[],
  selectedIndex: number,
  signal: AbortSignal,
  loadImage: AdminImagePreloadLoader
): Promise<void> {
  if (selectedIndex < 0) {
    return;
  }

  const endIndex = Math.min(items.length, selectedIndex + 3);
  for (let index = selectedIndex; index < endIndex; index += 1) {
    const item = items[index];
    if (!item || signal.aborted) {
      return;
    }

    await Promise.all(item.thumbnails.map((path) => loadImage('thumb', path, signal)));
    if (signal.aborted) {
      return;
    }

    await Promise.all(item.jpgs.map((path) => loadImage('jpg', path, signal)));
  }
}

export function useAdminImageCache({
  token,
  items,
  selectedIndex
}: UseAdminImageCacheOptions) {
  const [, setCacheVersion] = useState(0);
  const imageCacheRef = useRef<Map<string, string>>(new Map());
  const imageLoadingRef = useRef<Map<string, ImageRequest>>(new Map());
  const activePreloadRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);

  const loadImage = useCallback(
    async (type: AdminImageType, path: string, signal?: AbortSignal): Promise<boolean> => {
      if (!token || !path || signal?.aborted) {
        return false;
      }

      const key = getCacheKey(type, path);
      if (imageCacheRef.current.has(key)) {
        return true;
      }

      const activeRequest = imageLoadingRef.current.get(key);
      if (activeRequest) {
        if (activeRequest.signal?.aborted) {
          imageLoadingRef.current.delete(key);
        } else {
          return activeRequest.promise;
        }
      }

      const request = (async () => {
        try {
          const response = await fetch(buildImageUrl(type, path), {
            headers: {
              Authorization: `Bearer ${token}`
            },
            signal
          });
          if (!response.ok) {
            return false;
          }

          const objectUrl = URL.createObjectURL(await response.blob());
          if (signal?.aborted || !mountedRef.current) {
            URL.revokeObjectURL(objectUrl);
            return false;
          }

          imageCacheRef.current.set(key, objectUrl);
          setCacheVersion((version) => version + 1);
          return true;
        } catch (error) {
          if (error instanceof Error && error.name === 'AbortError') {
            return false;
          }
          return false;
        }
      })();

      imageLoadingRef.current.set(key, { promise: request, signal });
      void request.then(
        () => {
          const currentRequest = imageLoadingRef.current.get(key);
          if (currentRequest?.promise === request) {
            imageLoadingRef.current.delete(key);
          }
        },
        () => {
          const currentRequest = imageLoadingRef.current.get(key);
          if (currentRequest?.promise === request) {
            imageLoadingRef.current.delete(key);
          }
        }
      );
      return request;
    },
    [token]
  );

  const getCachedImageUrl = useCallback(
    (type: AdminImageType, path: string) => imageCacheRef.current.get(getCacheKey(type, path)),
    []
  );

  const cacheImage = useCallback(
    async (type: AdminImageType, path: string): Promise<void> => {
      await loadImage(type, path);
    },
    [loadImage]
  );

  useEffect(() => {
    if (!token || selectedIndex < 0) {
      return;
    }

    const controller = new AbortController();
    activePreloadRef.current?.abort();
    activePreloadRef.current = controller;
    void preloadAdminImages(items, selectedIndex, controller.signal, (type, path, signal) =>
      loadImage(type, path, signal)
    );

    return () => {
      controller.abort();
      if (activePreloadRef.current === controller) {
        activePreloadRef.current = null;
      }
    };
  }, [items, loadImage, selectedIndex, token]);

  useEffect(() => {
    const imageCache = imageCacheRef.current;
    const imageLoading = imageLoadingRef.current;

    return () => {
      mountedRef.current = false;
      activePreloadRef.current?.abort();
      imageCache.forEach((url) => {
        URL.revokeObjectURL(url);
      });
      imageCache.clear();
      imageLoading.clear();
    };
  }, []);

  return { cacheImage, getCachedImageUrl };
}
