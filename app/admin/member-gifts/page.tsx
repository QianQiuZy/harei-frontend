import { selectedGiftMonth } from '@/lib/captaingift-months';
import GiftAdmin from './GiftAdmin';

export default async function GiftAdminPage({
  searchParams
}: {
  searchParams: Promise<{ month?: string | string[] }>;
}) {
  const { month } = await searchParams;
  const initialMonth = selectedGiftMonth(month);
  return <GiftAdmin key={initialMonth} initialMonth={initialMonth} />;
}
