import { describe, expect, it } from 'vitest';
import { buildCaptaingiftMonthOptions } from './captaingift-months';

describe('captaingift month options', () => {
  it('includes the current month when it has no archive item yet', () => {
    const archiveItems = [
      { month: '202608', path: 'uploads/captaingift/202608_hash.jpg' },
      { month: '202607', path: 'uploads/captaingift/202607_hash.jpg' }
    ];

    expect(buildCaptaingiftMonthOptions(archiveItems, '202609')).toEqual([
      '202609',
      '202608',
      '202607'
    ]);
  });
});
