import { describe, expect, it } from 'vitest';
import {
  type AdminImagePreloadItem,
  type AdminImagePreloadLoader,
  preloadAdminImages
} from './use-admin-image-cache';

describe('admin image preload order', () => {
  it('loads the selected item and only the next two items in thumbnail-first stages', async () => {
    const items: readonly AdminImagePreloadItem[] = [
      { thumbnails: ['a-thumb'], jpgs: ['a-jpg'] },
      { thumbnails: ['b-thumb-1', 'b-thumb-2'], jpgs: ['b-jpg'] },
      { thumbnails: ['c-thumb'], jpgs: ['c-jpg-1', 'c-jpg-2'] },
      { thumbnails: ['d-thumb'], jpgs: ['d-jpg'] },
      { thumbnails: ['e-thumb'], jpgs: ['e-jpg'] }
    ];
    const calls: string[] = [];
    const loadImage: AdminImagePreloadLoader = async (type, path) => {
      calls.push(`${type}:${path}`);
      return true;
    };

    await preloadAdminImages(items, 1, new AbortController().signal, loadImage);

    expect(calls).toEqual([
      'thumb:b-thumb-1',
      'thumb:b-thumb-2',
      'jpg:b-jpg',
      'thumb:c-thumb',
      'jpg:c-jpg-1',
      'jpg:c-jpg-2',
      'thumb:d-thumb',
      'jpg:d-jpg'
    ]);
  });
});
