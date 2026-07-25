import { isHTTPError } from 'ky';
import { apiClient } from '@/lib/api';
import {
  type AuditResponse,
  auditSchema,
  type ManagedSongDetail,
  type ManagedSongList,
  type MusicAdminStats,
  managedSongDetailSchema,
  managedSongListSchema,
  musicAdminStatsSchema,
  mutationSchema,
  type PerformanceDraft,
  type PerformanceImportResponse,
  performanceImportErrorSchema,
  performanceImportResponseSchema,
  type SongDraft,
  type WorkbookIssue
} from '@/lib/music-admin/schemas';

const authHeaders = (token: string) => ({ Authorization: `Bearer ${token}` });

export const isMusicVersionConflict = (reason: unknown): boolean =>
  isHTTPError(reason) && reason.response.status === 409;

export class MusicImportError extends Error {
  readonly issues: readonly WorkbookIssue[];

  constructor(message: string, issues: readonly WorkbookIssue[]) {
    super(message);
    this.name = 'MusicImportError';
    this.issues = issues;
  }
}

export const getMusicAdminStats = async (token: string): Promise<MusicAdminStats> => {
  const payload = await apiClient
    .get('music-manage/stats', { headers: authHeaders(token) })
    .json<unknown>();
  return musicAdminStatsSchema.parse(payload);
};

export const listManagedSongs = async (
  token: string,
  query: { readonly q?: string; readonly status?: string; readonly page: number }
): Promise<ManagedSongList> => {
  const searchParams = new URLSearchParams({ page: String(query.page), page_size: '30' });
  if (query.q) searchParams.set('q', query.q);
  if (query.status) searchParams.set('status', query.status);
  const payload = await apiClient
    .get('music-manage/songs', { headers: authHeaders(token), searchParams })
    .json<unknown>();
  return managedSongListSchema.parse(payload);
};

export const getManagedSong = async (token: string, songId: number): Promise<ManagedSongDetail> => {
  const payload = await apiClient
    .get(`music-manage/songs/${songId}`, { headers: authHeaders(token) })
    .json<unknown>();
  return managedSongDetailSchema.parse(payload);
};

export const createSong = async (token: string, draft: SongDraft): Promise<number> => {
  const payload = await apiClient
    .post('music-manage/songs', { headers: authHeaders(token), json: draft })
    .json<unknown>();
  const parsed = mutationSchema.parse(payload);
  if (!parsed.song_id) throw new Error('创建响应缺少歌曲 ID');
  return parsed.song_id;
};

export const updateSong = async (
  token: string,
  songId: number,
  version: number,
  draft: SongDraft
): Promise<number> => {
  const payload = await apiClient
    .put(`music-manage/songs/${songId}`, {
      headers: authHeaders(token),
      json: { ...draft, version }
    })
    .json<unknown>();
  const parsed = mutationSchema.parse(payload);
  if (!parsed.version) throw new Error('保存响应缺少版本号');
  return parsed.version;
};

export const setSongArchived = async (
  token: string,
  songId: number,
  version: number,
  archived: boolean
): Promise<void> => {
  await apiClient.post(`music-manage/songs/${songId}/${archived ? 'archive' : 'restore'}`, {
    headers: authHeaders(token),
    json: { version }
  });
};

export const createPerformance = async (
  token: string,
  songId: number,
  version: number,
  draft: PerformanceDraft
): Promise<void> => {
  await apiClient.post(`music-manage/songs/${songId}/performances`, {
    headers: authHeaders(token),
    json: { ...draft, version }
  });
};

export const updatePerformance = async (
  token: string,
  performanceId: number,
  version: number,
  draft: PerformanceDraft
): Promise<void> => {
  await apiClient.put(`music-manage/performances/${performanceId}`, {
    headers: authHeaders(token),
    json: { ...draft, version }
  });
};

export const deletePerformance = async (
  token: string,
  performanceId: number,
  version: number
): Promise<void> => {
  await apiClient.delete(`music-manage/performances/${performanceId}`, {
    headers: authHeaders(token),
    searchParams: { version }
  });
};

export const downloadPerformanceTemplate = async (token: string): Promise<Blob> =>
  apiClient
    .get('music-manage/performances/template', { headers: authHeaders(token) })
    .blob();

export const importPerformances = async (
  token: string,
  file: File
): Promise<PerformanceImportResponse> => {
  const formData = new FormData();
  formData.set('file', file);
  const response = await apiClient.post('music-manage/performances/import', {
    headers: authHeaders(token),
    body: formData,
    throwHttpErrors: false
  });
  const payload = await response.json<unknown>();
  if (!response.ok) {
    const parsed = performanceImportErrorSchema.safeParse(payload);
    if (parsed.success) {
      throw new MusicImportError('导入文件校验失败', parsed.data.detail.errors);
    }
    throw new MusicImportError(`导入失败（HTTP ${response.status}）`, []);
  }
  return performanceImportResponseSchema.parse(payload);
};

export const getMusicAudit = async (token: string, page: number): Promise<AuditResponse> => {
  const payload = await apiClient
    .get('music-manage/audit', {
      headers: authHeaders(token),
      searchParams: { page, page_size: 50 }
    })
    .json<unknown>();
  return auditSchema.parse(payload);
};
