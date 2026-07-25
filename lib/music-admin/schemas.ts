import { z } from 'zod';
import { performanceSchema, songSummarySchema } from '@/lib/music/schemas';

export const musicAdminStatsSchema = z.object({
  code: z.number(),
  activeSongs: z.number().int().nonnegative(),
  archivedSongs: z.number().int().nonnegative(),
  performanceCount: z.number().int().nonnegative(),
  revision: z.number().int().nonnegative()
});

export const managedSongListSchema = z.object({
  code: z.number(),
  items: z.array(
    z.object({
      song_id: z.number().int().positive(),
      source_key: z.string(),
      title: z.string(),
      artist: z.string(),
      status: z.string(),
      version: z.number().int().positive()
    })
  ),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  page_size: z.number().int().positive()
});

export const managedSongDetailSchema = z.object({
  code: z.number(),
  item: songSummarySchema.extend({
    status: z.string(),
    version: z.number().int().positive(),
    performances: z.array(performanceSchema)
  })
});

export const mutationSchema = z.object({
  code: z.number(),
  song_id: z.number().int().positive().optional(),
  performance_id: z.number().int().positive().optional(),
  version: z.number().int().positive().optional(),
  revision: z.number().int().nonnegative()
});

export const auditSchema = z.object({
  code: z.number(),
  items: z.array(
    z.object({
      audit_id: z.number().int().positive(),
      actor: z.string(),
      action: z.string(),
      entity_type: z.string(),
      entity_id: z.string(),
      details: z.record(z.string(), z.unknown()),
      created_at: z.iso.datetime()
    })
  ),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  page_size: z.number().int().positive()
});

export const workbookIssueSchema = z.object({
  row: z.number().int().positive(),
  field: z.string(),
  code: z.string(),
  message: z.string()
});

export const performanceImportResponseSchema = z.object({
  code: z.number(),
  imported_count: z.number().int().positive(),
  affected_song_count: z.number().int().positive(),
  revision: z.number().int().nonnegative()
});

export const performanceImportErrorSchema = z.object({
  detail: z.object({
    error: z.string(),
    errors: z.array(workbookIssueSchema)
  })
});

export type MusicAdminStats = z.infer<typeof musicAdminStatsSchema>;
export type ManagedSongList = z.infer<typeof managedSongListSchema>;
export type ManagedSongDetail = z.infer<typeof managedSongDetailSchema>;
export type AuditResponse = z.infer<typeof auditSchema>;
export type WorkbookIssue = z.infer<typeof workbookIssueSchema>;
export type PerformanceImportResponse = z.infer<typeof performanceImportResponseSchema>;

export type SongDraft = {
  readonly title: string;
  readonly artist: string;
  readonly artists: readonly string[];
  readonly genre: string;
  readonly language: string;
  readonly work_type: string;
  readonly notes: string;
  readonly metadata_status: string;
};

export type PerformanceDraft = {
  readonly date: string;
  readonly platform: string;
  readonly stream_title: string | null;
  readonly stream_url: string | null;
  readonly clip_url: string | null;
};
