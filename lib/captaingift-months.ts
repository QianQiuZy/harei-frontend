type CaptaingiftMonthItem = {
  readonly month: string;
};

export const FIRST_GIFT_YEAR = 2026;
export const isGiftMonth = (value: unknown): value is string =>
  typeof value === 'string' &&
  /^\d{4}(0[1-9]|1[0-2])$/.test(value) &&
  Number(value.slice(0, 4)) >= FIRST_GIFT_YEAR;

export const beijingGiftMonth = (date = new Date()) =>
  new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit'
  })
    .format(date)
    .replace('-', '');

export const buildCaptaingiftMonthOptions = (
  archiveItems: readonly CaptaingiftMonthItem[],
  currentMonth: string
) => {
  const toMonthIndex = (month: string) =>
    Number(month.slice(0, 4)) * 12 + Number(month.slice(4)) - 1;
  const currentMonthIndex = toMonthIndex(currentMonth);
  // Keep last month selectable even before the first archive has been uploaded.
  const earliestMonthIndex = Math.max(
    FIRST_GIFT_YEAR * 12,
    archiveItems.reduce(
      (earliest, item) => Math.min(earliest, toMonthIndex(item.month)),
      currentMonthIndex - 1
    )
  );
  const months = new Set(archiveItems.map((item) => item.month).filter(isGiftMonth));

  for (let index = currentMonthIndex; index >= earliestMonthIndex; index -= 1) {
    const year = Math.floor(index / 12);
    const month = String((index % 12) + 1).padStart(2, '0');
    months.add(`${year}${month}`);
  }

  return Array.from(months).sort((a, b) => b.localeCompare(a));
};

export function selectedGiftMonth(value: unknown): string {
  return isGiftMonth(value) ? value : beijingGiftMonth();
}
