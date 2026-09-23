export function findPreviousEmojiIndex(
  emojiNodes: readonly boolean[],
  emptyTextNodes: readonly boolean[],
  caretOffset: number
): number | null {
  for (let index = caretOffset - 1; index >= 0; index -= 1) {
    if (emojiNodes[index]) return index;
    if (!emptyTextNodes[index]) return null;
  }
  return null;
}
