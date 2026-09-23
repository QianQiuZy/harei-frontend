'use client';

import ky from 'ky';
import { emojiGroupsResponseSchema, type EmojiCatalog } from './emojis';
import { useEffect, useState } from 'react';

export function useEmojiGroups() {
  const [catalog, setCatalog] = useState<EmojiCatalog>({
    code: 0,
    groups: {},
    files: {},
    group_icons: {}
  });
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadGroups = async () => {
      try {
        const payload: unknown = await ky.get('/api/emoji').json();
        const response = emojiGroupsResponseSchema.parse(payload);
        if (isMounted) {
          setCatalog(response);
          setIsLoaded(true);
        }
      } catch (error) {
        if (error instanceof Error) {
          if (isMounted) setIsLoaded(true);
          return;
        }
        throw error;
      }
    };

    void loadGroups();
    return () => {
      isMounted = false;
    };
  }, []);

  return { ...catalog, isLoaded } as const;
}
