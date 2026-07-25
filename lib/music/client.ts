import { apiClient } from '@/lib/api';
import {
  musicListSchema,
  songDetailSchema,
  type MusicListResponse,
  type SongDetailResponse
} from '@/lib/music/schemas';

export type MusicSort = 'title' | 'recent' | 'count';
export type SearchMode = 'title' | 'artist';

export type MusicQuery = {
  readonly q?: string;
  readonly searchMode?: SearchMode;
  readonly genre?: string;
  readonly language?: string;
  readonly workType?: string;
  readonly sort: MusicSort;
  readonly order: 'asc' | 'desc';
  readonly page: number;
  readonly pageSize: number;
};

type MusicCacheEntry = {
  readonly etag: string;
  readonly payload: MusicListResponse;
};

const musicCache = new Map<string, MusicCacheEntry>();

const musicSearchParams = (query: MusicQuery): URLSearchParams => {
  const params = new URLSearchParams({
    sort: query.sort,
    order: query.order,
    page: String(query.page),
    page_size: String(query.pageSize)
  });
  if (query.q) params.set('q', query.q);
  if (query.searchMode) params.set('search_mode', query.searchMode);
  if (query.genre) params.set('genre', query.genre);
  if (query.language) params.set('language', query.language);
  if (query.workType) params.set('work_type', query.workType);
  return params;
};

export const listMusic = async (query: MusicQuery): Promise<MusicListResponse> => {
  const searchParams = musicSearchParams(query);
  const cacheKey = searchParams.toString();
  const cached = musicCache.get(cacheKey);
  const response = await apiClient.get('music', {
    searchParams,
    headers: cached ? { 'If-None-Match': cached.etag } : undefined,
    throwHttpErrors: false
  });
  if (response.status === 304 && cached) return cached.payload;

  const payload = musicListSchema.parse(await response.json<unknown>());
  const etag = response.headers.get('etag');
  if (etag) musicCache.set(cacheKey, { etag, payload });
  else musicCache.delete(cacheKey);
  return payload;
};

export const getSong = async (sourceKey: string): Promise<SongDetailResponse> => {
  const payload = await apiClient.get(`music/${encodeURIComponent(sourceKey)}`).json<unknown>();
  return songDetailSchema.parse(payload);
};
