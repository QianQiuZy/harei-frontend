import { describe, expect, it } from 'vitest';
import { emojiGroupIconUrl, emojiImageUrl } from './emojis';

describe('emoji asset URLs', () => {
  it('includes the asset file extension in emoji URLs', () => {
    expect(emojiImageUrl('dlc_act', 'prpr', { dlc_act: { prpr: 'prpr.png' } })).toBe(
      '/api/emoji/dlc_act/prpr.png'
    );
  });

  it('includes the actual representative image extension in group-icon URLs', () => {
    expect(emojiGroupIconUrl('emotelab', { emotelab: 'emotelab.gif' })).toBe(
      '/api/emoji/group-icon/emotelab.gif'
    );
  });
});
