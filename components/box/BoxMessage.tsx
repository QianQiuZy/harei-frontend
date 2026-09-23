import Image from 'next/image';
import type { ReactNode } from 'react';
import { emojiImageUrl, type EmojiFiles, type EmojiGroups } from '@/lib/box/emojis';
import { parseBoxMessage, type BoxMessagePart } from '@/lib/box/message-renderer';

function assertNever(part: never): never {
  throw new Error(`Unknown message part: ${JSON.stringify(part)}`);
}

function renderParts(
  parts: readonly BoxMessagePart[],
  keyPrefix: string,
  files: EmojiFiles
): ReactNode[] {
  return parts.map((part, index) => {
    const key = `${keyPrefix}-${index}`;
    switch (part.kind) {
      case 'text':
        return part.text;
      case 'emoji':
        return (
          <Image
            key={key}
            className="box-emoji"
            src={emojiImageUrl(part.groupName, part.emojiName, files)}
            width={100}
            height={100}
            alt={`表情包：${part.emojiName}`}
            loading="lazy"
            unoptimized
          />
        );
      case 'link':
        return (
          <a
            key={key}
            className="admin-message-bv-link"
            href={`https://www.bilibili.com/video/${part.videoId}`}
            target="_blank"
            rel="noreferrer"
          >
            {part.videoId}
          </a>
        );
      case 'mask':
        return (
          <span key={key} className="admin-message-mask">
            {renderParts(part.children, key, files)}
          </span>
        );
      default:
        return assertNever(part);
    }
  });
}

type BoxMessageProps = {
  readonly files: EmojiFiles;
  readonly message: string;
  readonly emojiGroups: EmojiGroups;
};

export function BoxMessage({ files, message, emojiGroups }: BoxMessageProps) {
  return renderParts(parseBoxMessage(message, emojiGroups), 'message', files);
}
