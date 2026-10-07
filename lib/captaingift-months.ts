type CaptaingiftMonthItem = {
  readonly month: string;
};

export const buildCaptaingiftMonthOptions = (
  archiveItems: readonly CaptaingiftMonthItem[],
  currentMonth: string
) => {
  const toMonthIndex = (month: string) =>
    Number(month.slice(0, 4)) * 12 + Number(month.slice(4)) - 1;
  const currentMonthIndex = toMonthIndex(currentMonth);
  // Keep last month selectable even before the first archive has been uploaded.
  const earliestMonthIndex = archiveItems.reduce(
    (earliest, item) => Math.min(earliest, toMonthIndex(item.month)),
    currentMonthIndex - 1
  );
  const months = new Set(archiveItems.map((item) => item.month));

  for (let index = currentMonthIndex; index >= earliestMonthIndex; index -= 1) {
    const year = Math.floor(index / 12);
    const month = String(index % 12 + 1).padStart(2, '0');
    months.add(`${year}${month}`);
  }

  return Array.from(months).sort((a, b) => b.localeCompare(a));
};
