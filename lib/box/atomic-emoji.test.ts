import { describe, expect, it } from 'vitest';
import { findPreviousEmojiIndex } from './atomic-emoji';

describe('findPreviousEmojiIndex', () => {
  it('skips empty text nodes between the caret and the prior emoji', () => {
    expect(findPreviousEmojiIndex([true, false, false], [false, true, true], 3)).toBe(0);
  });

  it('does not skip real text before the caret to remove an earlier emoji', () => {
    expect(findPreviousEmojiIndex([true, false, false], [false, false, true], 3)).toBeNull();
  });
});
