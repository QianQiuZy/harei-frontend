'use client';

import { Smile, X } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import {
  emojiGroupIconUrl,
  emojiImageUrl,
  type EmojiFiles,
  type EmojiGroupIcons,
  type EmojiGroups
} from '@/lib/box/emojis';

type EmojiPickerProps = {
  readonly groups: EmojiGroups;
  readonly files: EmojiFiles;
  readonly groupIcons: EmojiGroupIcons;
  readonly onSelect: (groupName: string, emojiName: string) => void;
};

type PanelPlacement = {
  readonly side: 'above' | 'below';
  readonly left: number;
  readonly top: number | 'auto';
  readonly bottom: number | 'auto';
  readonly maxHeight: number;
};

function findPanelPlacement(
  triggerBounds: DOMRect,
  viewportWidth: number,
  viewportHeight: number
): PanelPlacement {
  const panelWidth = Math.min(360, viewportWidth - 40);
  const maxLeft = Math.max(20, viewportWidth - panelWidth - 20);
  const left = Math.min(maxLeft, Math.max(20, triggerBounds.right - panelWidth));
  const above = Math.max(0, triggerBounds.top - 16);
  const below = Math.max(0, viewportHeight - triggerBounds.bottom - 16);
  const side = above >= below ? 'above' : 'below';
  const availableHeight = side === 'above' ? above : below;
  return {
    side,
    left,
    top: side === 'below' ? triggerBounds.bottom + 8 : 'auto',
    bottom: side === 'above' ? viewportHeight - triggerBounds.top + 8 : 'auto',
    maxHeight: Math.max(120, Math.min(420, availableHeight))
  };
}

export function EmojiPicker({ groups, files, groupIcons, onSelect }: EmojiPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const [panelPlacement, setPanelPlacement] = useState<PanelPlacement>({
    side: 'above',
    left: 20,
    top: 'auto',
    bottom: 428,
    maxHeight: 420
  });
  const entries = Object.entries(groups);
  const [selectedGroup, setSelectedGroup] = useState('');
  const activeGroup = groups[selectedGroup] ? selectedGroup : entries[0]?.[0] ?? '';
  const activeNames = groups[activeGroup] ?? [];

  useEffect(() => {
    if (!isOpen) return;

    const updatePlacement = () => {
      const trigger = triggerRef.current;
      if (!trigger) return;
      setPanelPlacement(
        findPanelPlacement(trigger.getBoundingClientRect(), window.innerWidth, window.innerHeight)
      );
    };

    updatePlacement();
    window.addEventListener('resize', updatePlacement);
    return () => window.removeEventListener('resize', updatePlacement);
  }, [isOpen]);

  return (
    <div className="box-emoji-picker">
      <button
        ref={triggerRef}
        type="button"
        className="box-emoji-trigger"
        aria-label="打开表情包"
        aria-expanded={isOpen}
        onClick={(event) => {
          if (!isOpen) {
            setPanelPlacement(
              findPanelPlacement(
                event.currentTarget.getBoundingClientRect(),
                window.innerWidth,
                window.innerHeight
              )
            );
          }
          setIsOpen((open) => !open);
        }}
      >
        {isOpen ? <X size={18} aria-hidden="true" /> : <Smile size={18} aria-hidden="true" />}
      </button>
      {isOpen ? (
        <fieldset
          className="box-emoji-panel"
          style={{
            left: panelPlacement.left,
            top: panelPlacement.top,
            bottom: panelPlacement.bottom,
            maxHeight: panelPlacement.maxHeight
          }}
          aria-label="表情包选择器"
        >
          <div className="box-emoji-panel-header">
            {entries.length > 0 ? (
              <div className="box-emoji-group-tabs" role="tablist" aria-label="表情包组">
                {entries.map(([groupName]) => (
                  <button
                    key={groupName}
                    type="button"
                    role="tab"
                    className={`box-emoji-group-tab${groupName === activeGroup ? ' is-active' : ''}`}
                    aria-label={`切换到${groupName}`}
                    aria-selected={groupName === activeGroup}
                    title={groupName}
                    onClick={() => setSelectedGroup(groupName)}
                  >
                    <Image
                      src={emojiGroupIconUrl(groupName, groupIcons)}
                      alt=""
                      width={36}
                      height={36}
                      unoptimized
                    />
                  </button>
                ))}
              </div>
            ) : null}
            <button
              type="button"
              className="box-emoji-panel-close"
              aria-label="关闭表情包"
              onClick={() => setIsOpen(false)}
            >
              <X size={16} aria-hidden="true" />
            </button>
          </div>
          {entries.length === 0 ? (
            <p className="box-emoji-empty">暂时没有可用表情包</p>
          ) : (
            <div className="box-emoji-options" role="tabpanel" aria-label={activeGroup}>
              {activeNames.map((emojiName) => (
                <button
                  key={`${activeGroup}-${emojiName}`}
                  type="button"
                  className="box-emoji-option"
                  title={emojiName}
                  aria-label={`插入${activeGroup}/${emojiName}`}
                  onClick={() => {
                    onSelect(activeGroup, emojiName);
                    setIsOpen(false);
                  }}
                >
                  <Image
                    src={emojiImageUrl(activeGroup, emojiName, files)}
                    alt=""
                    width={44}
                    height={42}
                    unoptimized
                  />
                  <span>{emojiName}</span>
                </button>
              ))}
            </div>
          )}
        </fieldset>
      ) : null}
    </div>
  );
}
