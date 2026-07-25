'use client';

import { useParams } from 'next/navigation';
import { SongEditor } from '@/app/music-admin/_components/SongEditor';

export default function EditSongPage() {
  const params = useParams<{ id: string }>();
  const songId = Number(params.id);
  return Number.isInteger(songId) && songId > 0 ? <SongEditor songId={songId} /> : <p>无效的歌曲 ID</p>;
}
