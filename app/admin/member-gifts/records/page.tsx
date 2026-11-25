import { selectedGiftMonth } from '@/lib/captaingift-months';
import GiftRecords from './GiftRecords';

export default async function GiftRecordsPage({
  searchParams
}: {
  searchParams: Promise<{ month?: string | string[] }>;
}) {
  const { month } = await searchParams;
  const initialMonth = selectedGiftMonth(month);
  return <GiftRecords key={initialMonth} initialMonth={initialMonth} />;
}
