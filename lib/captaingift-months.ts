type CaptaingiftMonthItem = {
  readonly month: string;
};

export const buildCaptaingiftMonthOptions = (
  archiveItems: readonly CaptaingiftMonthItem[],
  currentMonth: string
) => Array.from(new Set([currentMonth, ...archiveItems.map((item) => item.month)])).sort((a, b) =>
  b.localeCompare(a)
);
