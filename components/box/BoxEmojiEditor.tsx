'use client';

import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
  type ClipboardEvent,
  type ForwardedRef,
  type KeyboardEvent
} from 'react';
import { findPreviousEmojiIndex } from '@/lib/box/atomic-emoji';
import { emojiImageUrl, type EmojiFiles, type EmojiGroups } from '@/lib/box/emojis';

export type BoxEmojiEditorHandle = {
  readonly insertEmoji: (groupName: string, emojiName: string) => void;
};

type BoxEmojiEditorProps = {
  readonly files: EmojiFiles;
  readonly emojiGroups: EmojiGroups;
  readonly isError: boolean;
  readonly onChange: (message: string) => void;
};

function serializeEditor(editor: HTMLElement): string {
  const isBlock = (node: Node): node is HTMLElement =>
    node instanceof HTMLElement && (node.tagName === 'DIV' || node.tagName === 'P');

  const serializeNode = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? '';
    if (!(node instanceof HTMLElement)) return '';
    if (node.dataset.emojiGroup && node.dataset.emojiName) {
      return `[[${node.dataset.emojiGroup}/${node.dataset.emojiName}]]`;
    }
    if (node.dataset.emojiName) return `[[${node.dataset.emojiName}]]`;
    if (node.tagName === 'BR') return '\n';
    if (
      (node.tagName === 'DIV' || node.tagName === 'P') &&
      node.childNodes.length === 1 &&
      node.firstChild instanceof HTMLElement &&
      node.firstChild.tagName === 'BR'
    ) {
      return '';
    }
    return serializeChildren(node);
  };

  const serializeChildren = (parent: HTMLElement): string => {
    let message = '';
    let previousWasBlock = false;
    let previousBlockWasEmpty = false;
    for (const child of parent.childNodes) {
      const currentIsBlock = isBlock(child);
      const content = serializeNode(child);
      const needsBlankParagraphSeparator =
        currentIsBlock && previousWasBlock && previousBlockWasEmpty;
      if (
        (previousWasBlock || currentIsBlock) &&
        message &&
        (!message.endsWith('\n') || needsBlankParagraphSeparator)
      ) {
        message += '\n';
      }
      message += currentIsBlock && content && !content.endsWith('\n') ? `${content}\n` : content;
      previousWasBlock = currentIsBlock;
      previousBlockWasEmpty = currentIsBlock && content.length === 0;
    }
    return message;
  };

  const message = serializeChildren(editor).replace(/\r\n?/g, '\n');
  const lastChild = editor.lastChild;
  const hasTrailingEmptyLine =
    isBlock(lastChild ?? editor) &&
    lastChild?.childNodes.length === 1 &&
    lastChild.firstChild instanceof HTMLElement &&
    lastChild.firstChild.tagName === 'BR';
  if (isBlock(lastChild ?? editor) && message.endsWith('\n') && !hasTrailingEmptyLine) {
    return message.slice(0, -1);
  }
  return message;
}

function selectRange(editor: HTMLElement, savedRange: Range | null): Range {
  const selection = window.getSelection();
  if (selection?.rangeCount) {
    const range = selection.getRangeAt(0);
    if (editor.contains(range.commonAncestorContainer)) return range.cloneRange();
  }
  if (savedRange && editor.contains(savedRange.commonAncestorContainer)) {
    return savedRange.cloneRange();
  }

  const range = document.createRange();
  range.selectNodeContents(editor);
  range.collapse(false);
  return range;
}

function restoreCaret(range: Range, editor: HTMLElement, savedRange: { current: Range | null }) {
  range.collapse(true);
  const selection = window.getSelection();
  selection?.removeAllRanges();
  selection?.addRange(range);
  savedRange.current = range.cloneRange();
  editor.focus();
}

function previousEmojiAtCaret(container: Node, offset: number): HTMLElement | null {
  const parent = container.nodeType === Node.TEXT_NODE ? container.parentNode : container;
  if (!(parent instanceof HTMLElement)) return null;

  const parentChildren = Array.from(parent.childNodes);
  const caretOffset =
    container === parent
      ? offset
      : container instanceof Text && offset === 0
        ? parentChildren.indexOf(container)
        : -1;
  if (caretOffset < 0) return null;

  const previousChildren = parentChildren.slice(0, caretOffset);
  const emojiNodes = previousChildren.map(
    (node) => node instanceof HTMLElement && Boolean(node.dataset.emojiName)
  );
  const emptyTextNodes = previousChildren.map(
    (node) => node.nodeType === Node.TEXT_NODE && node.textContent === ''
  );
  const previousIndex = findPreviousEmojiIndex(emojiNodes, emptyTextNodes, previousChildren.length);
  const previousNode = previousIndex === null ? null : previousChildren[previousIndex];
  return previousNode instanceof HTMLElement && previousNode.dataset.emojiName
    ? previousNode
    : null;
}

const BoxEmojiEditor = forwardRef(function BoxEmojiEditor(
  { emojiGroups, files, isError, onChange }: BoxEmojiEditorProps,
  ref: ForwardedRef<BoxEmojiEditorHandle>
) {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const savedRangeRef = useRef<Range | null>(null);

  const saveSelection = useCallback(() => {
    const editor = editorRef.current;
    const selection = window.getSelection();
    if (!editor || !selection?.rangeCount) return;
    const range = selection.getRangeAt(0);
    if (editor.contains(range.commonAncestorContainer)) {
      savedRangeRef.current = range.cloneRange();
    }
  }, []);

  const syncMessage = useCallback(() => {
    const editor = editorRef.current;
    if (editor) onChange(serializeEditor(editor));
  }, [onChange]);

  const insertEmoji = useCallback(
    (groupName: string, emojiName: string) => {
      const editor = editorRef.current;
      if (!editor || !emojiGroups[groupName]?.includes(emojiName)) return;

      const range = selectRange(editor, savedRangeRef.current);
      range.deleteContents();

      const token = document.createElement('span');
      token.className = 'box-emoji-token';
      token.contentEditable = 'false';
      token.dataset.emojiGroup = groupName;
      token.dataset.emojiName = emojiName;

      const image = document.createElement('img');
      image.className = 'box-emoji';
      image.src = emojiImageUrl(groupName, emojiName, files);
      image.alt = `表情包：${emojiName}`;
      token.append(image);

      range.insertNode(token);
      range.setStartAfter(token);
      const caret = document.createTextNode('');
      range.insertNode(caret);
      range.setStart(caret, 0);
      restoreCaret(range, editor, savedRangeRef);
      syncMessage();
    },
    [emojiGroups, files, syncMessage]
  );

  useImperativeHandle(ref, () => ({ insertEmoji }), [insertEmoji]);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Backspace') return;

    const editor = editorRef.current;
    const selection = window.getSelection();
    if (!editor || !selection?.isCollapsed || !selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    const previousNode = previousEmojiAtCaret(range.startContainer, range.startOffset);
    if (!previousNode) return;

    event.preventDefault();
    range.setStartBefore(previousNode);
    range.collapse(true);
    previousNode.remove();
    restoreCaret(range, editor, savedRangeRef);
    syncMessage();
  };

  const handlePaste = (event: ClipboardEvent<HTMLDivElement>) => {
    event.preventDefault();
    const editor = editorRef.current;
    if (!editor) return;

    const pastedText = event.clipboardData.getData('text/plain');
    if (!pastedText) return;

    const range = selectRange(editor, savedRangeRef.current);
    range.deleteContents();
    const textNode = document.createTextNode(pastedText);
    range.insertNode(textNode);
    range.setStartAfter(textNode);
    const caret = document.createTextNode('');
    range.insertNode(caret);
    range.setStart(caret, 0);
    restoreCaret(range, editor, savedRangeRef);
    syncMessage();
  };

  return (
    <>
      {/* biome-ignore lint/a11y/useSemanticElements: contentEditable is needed to render atomic inline images. */}
      <div
        ref={editorRef}
        className={`box-input box-rich-input${isError ? ' is-error' : ''}`}
        contentEditable
        role="textbox"
        tabIndex={0}
        aria-label="写下你的提问..."
        aria-multiline="true"
        aria-invalid={isError}
        data-empty={isEmpty(editorRef.current)}
        data-placeholder="写下你的提问..."
        onInput={() => {
          saveSelection();
          syncMessage();
        }}
        onKeyDown={handleKeyDown}
        onKeyUp={saveSelection}
        onMouseUp={saveSelection}
        onBlur={saveSelection}
        onPaste={handlePaste}
        suppressContentEditableWarning
      />
    </>
  );
});

function isEmpty(editor: HTMLDivElement | null): boolean {
  return !editor?.textContent && !editor?.querySelector('[data-emoji-name]');
}

export { BoxEmojiEditor };
