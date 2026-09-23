import type { EmojiGroups } from './emojis';

const INLINE_TOKEN = /(\[\[[^\]]+\]\]|BV[0-9A-Za-z]{10})/g;

export type BoxMessagePart =
  | { readonly kind: 'text'; readonly text: string }
  | { readonly kind: 'emoji'; readonly groupName: string; readonly emojiName: string }
  | { readonly kind: 'link'; readonly videoId: string }
  | { readonly kind: 'mask'; readonly children: readonly BoxMessagePart[] };

function parseInline(text: string, emojiGroups: EmojiGroups): BoxMessagePart[] {
  const nameGroups = new Map<string, string>();
  for (const [groupName, emojiNames] of Object.entries(emojiGroups)) {
    for (const emojiName of emojiNames) {
      if (!nameGroups.has(emojiName)) nameGroups.set(emojiName, groupName);
    }
  }

  return text.split(INLINE_TOKEN).filter(Boolean).map((part) => {
    if (part.startsWith('[[') && part.endsWith(']]')) {
      const shortcode = part.slice(2, -2);
      const separator = shortcode.indexOf('/');
      if (separator >= 0) {
        const groupName = shortcode.slice(0, separator);
        const emojiName = shortcode.slice(separator + 1);
        return emojiGroups[groupName]?.includes(emojiName)
          ? { kind: 'emoji', groupName, emojiName }
          : { kind: 'text', text: part };
      }

      const groupName = nameGroups.get(shortcode);
      return groupName
        ? { kind: 'emoji', groupName, emojiName: shortcode }
        : { kind: 'text', text: part };
    }
    if (/^BV[0-9A-Za-z]{10}$/.test(part)) {
      return { kind: 'link', videoId: part };
    }
    return { kind: 'text', text: part };
  });
}

export function parseBoxMessage(message: string, emojiGroups: EmojiGroups): BoxMessagePart[] {
  const parts: BoxMessagePart[] = [];
  const maskPattern = /{{([\s\S]*?)}}/g;
  let lastIndex = 0;
  let match = maskPattern.exec(message);

  while (match) {
    if (match.index > lastIndex) {
      parts.push(...parseInline(message.slice(lastIndex, match.index), emojiGroups));
    }
    parts.push({ kind: 'mask', children: parseInline(match[1], emojiGroups) });
    lastIndex = match.index + match[0].length;
    match = maskPattern.exec(message);
  }
  if (lastIndex < message.length) {
    parts.push(...parseInline(message.slice(lastIndex), emojiGroups));
  }
  return parts;
}
