import { z } from 'zod';

const httpUrlSchema = z.string().url().refine((value) => /^https?:\/\//i.test(value), {
  message: 'URL must use http or https'
});

export const streamSchema = z.object({
  id: z.string().nullable().optional(),
  title: z.string().nullable().optional(),
  platform: z.string(),
  url: httpUrlSchema.nullable().optional()
});

export const performanceSchema = z.object({
  performance_id: z.number().int().positive().optional(),
  id: z.string(),
  date: z.iso.date(),
  stream: streamSchema,
  clipUrl: httpUrlSchema.nullable().optional()
});

export const songSummarySchema = z.object({
  song_id: z.number().int().positive(),
  id: z.string(),
  source_key: z.string(),
  title: z.string(),
  artist: z.string(),
  artists: z.array(z.string()),
  genre: z.string(),
  language: z.string(),
  workType: z.string(),
  notes: z.string(),
  metadataStatus: z.string(),
  latestPerformanceAt: z.iso.date().nullable().optional(),
  latestLink: httpUrlSchema.nullable().optional(),
  performanceCount: z.number().int().nonnegative()
});

export const musicListSchema = z.object({
  code: z.number(),
  items: z.array(songSummarySchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  page_size: z.number().int().positive(),
  facets: z.object({
    genres: z.array(z.string()),
    languages: z.array(z.string()),
    workTypes: z.array(z.string())
  }),
  stats: z.object({
    song_count: z.number().int().nonnegative(),
    performance_count: z.number().int().nonnegative()
  }),
  revision: z.number().int().nonnegative()
});

export const songDetailSchema = z.object({
  code: z.number(),
  item: songSummarySchema.extend({ performances: z.array(performanceSchema) })
});

export type Performance = z.infer<typeof performanceSchema>;
export type SongSummary = z.infer<typeof songSummarySchema>;
export type MusicListResponse = z.infer<typeof musicListSchema>;
export type SongDetailResponse = z.infer<typeof songDetailSchema>;
