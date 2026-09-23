import { z } from 'zod';

export const EMOJI_IMAGE_SUFFIXES = ['.apng', '.avif', '.gif', '.jpeg', '.jpg', '.png', '.webp'] as const;

export const emojiGroupsResponseSchema = z.object({
  code: z.literal(0),
  groups: z.record(z.string(), z.array(z.string())),
  files: z.record(z.string(), z.record(z.string(), z.string())),
  group_icons: z.record(z.string(), z.string())
});

export type EmojiCatalog = z.infer<typeof emojiGroupsResponseSchema>;
export type EmojiGroups = EmojiCatalog['groups'];
export type EmojiFiles = EmojiCatalog['files'];
export type EmojiGroupIcons = EmojiCatalog['group_icons'];

export const emojiNameFromFile = (filename: string) => {
  const normalizedName = filename.toLowerCase();
  const suffix = EMOJI_IMAGE_SUFFIXES.find((extension) => normalizedName.endsWith(extension));
  return suffix ? filename.slice(0, -suffix.length) : null;
};

export const emojiImageUrl = (groupName: string, emojiName: string, files: EmojiFiles) => {
  const filename = files[groupName][emojiName];
  return `/api/emoji/${encodeURIComponent(groupName)}/${encodeURIComponent(filename)}`;
};

export const emojiGroupIconUrl = (groupName: string, groupIcons: EmojiGroupIcons) => {
  const filename = groupIcons[groupName];
  return `/api/emoji/group-icon/${encodeURIComponent(filename)}`;
};
