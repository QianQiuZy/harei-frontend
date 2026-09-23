import { describe, expect, it } from 'vitest';
import { parseBoxMessage } from './message-renderer';

describe('renderBoxMessage', () => {
  it('resolves group-qualified emoji tokens and leaves unknown tokens as text', () => {
    const groups = { dlc_act: ['prpr'], emotelab: ['prpr'] };
    const parts = parseBoxMessage('Hi [[emotelab/prpr]] [[unknown/missing]]', groups);

    expect(parts).toEqual([
      { kind: 'text', text: 'Hi ' },
      { kind: 'emoji', groupName: 'emotelab', emojiName: 'prpr' },
      { kind: 'text', text: ' ' },
      { kind: 'text', text: '[[unknown/missing]]' }
    ]);
  });

  it('continues resolving legacy unqualified emoji tokens', () => {
    const parts = parseBoxMessage('[[prpr]]', { dlc_act: ['prpr'], emotelab: ['prpr'] });

    expect(parts).toEqual([{ kind: 'emoji', groupName: 'dlc_act', emojiName: 'prpr' }]);
  });

  it('keeps emoji within hidden text masked and retains BV links', () => {
    const parts = parseBoxMessage('{{[[dlc_act/prpr]]}} BV1abc123456', { dlc_act: ['prpr'] });

    expect(parts).toEqual([
      {
        kind: 'mask',
        children: [{ kind: 'emoji', groupName: 'dlc_act', emojiName: 'prpr' }]
      },
      { kind: 'text', text: ' ' },
      { kind: 'link', videoId: 'BV1abc123456' }
    ]);
  });
});
