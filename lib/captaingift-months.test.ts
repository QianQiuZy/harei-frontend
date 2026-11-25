import { describe, expect, it } from 'vitest';
import { beijingGiftMonth, buildCaptaingiftMonthOptions, selectedGiftMonth } from './captaingift-months';

describe('captaingift month options', () => {
  it('switches month at midnight in Beijing', () => {
    expect(beijingGiftMonth(new Date('2026-11-30T15:59:59Z'))).toBe('202611');
    expect(beijingGiftMonth(new Date('2026-11-30T16:00:00Z'))).toBe('202612');
  });

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

  it('keeps September selectable in October before its archive is uploaded', () => {
    expect(buildCaptaingiftMonthOptions([{ month: '202608' }], '202610')).toEqual([
      '202610',
      '202609',
      '202608'
    ]);
  });

  it('fills all missing months between the earliest archive and the current month', () => {
    expect(buildCaptaingiftMonthOptions([
      { month: '202608' },
      { month: '202605' }
    ], '202610')).toEqual([
      '202610',
      '202609',
      '202608',
      '202607',
      '202606',
      '202605'
    ]);
  });

  it('fills missing months across a year boundary', () => {
    expect(buildCaptaingiftMonthOptions([{ month: '202611' }], '202702')).toEqual([
      '202702',
      '202701',
      '202612',
      '202611'
    ]);
  });

  it('limits archive options and deep links to 2026 or later', () => {
    expect(buildCaptaingiftMonthOptions([{month: '202504'}], '202602')).toEqual(['202602', '202601']);
    expect(selectedGiftMonth('202512')).toBe(beijingGiftMonth());
    expect(selectedGiftMonth('202601')).toBe('202601');
  });

  it('offers the current and previous month when there are no archives', () => {
    expect(buildCaptaingiftMonthOptions([], '202610')).toEqual(['202610', '202609']);
    expect(buildCaptaingiftMonthOptions([], '202601')).toEqual(['202601']);
  });

  it('keeps the previous month selectable when only the current month has an archive', () => {
    expect(buildCaptaingiftMonthOptions([{ month: '202610' }], '202610')).toEqual([
      '202610',
      '202609'
    ]);
  });

  it('preserves existing months and returns unique options in descending order', () => {
    expect(buildCaptaingiftMonthOptions([
      { month: '202608' },
      { month: '202611' },
      { month: '202610' },
      { month: '202608' }
    ], '202610')).toEqual([
      '202611',
      '202610',
      '202609',
      '202608'
    ]);
  });
});
