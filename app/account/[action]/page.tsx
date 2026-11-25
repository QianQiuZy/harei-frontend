import { notFound } from 'next/navigation';
import AccountScreen from '@/components/member/AccountScreen';
import { isSecurityAction, personalQuery } from '@/lib/member';

export default async function AccountPage({
  params,
  searchParams
}: {
  params: Promise<{ action: string }>;
  searchParams: Promise<{ uid?: string; section?: string }>;
}) {
  const { action } = await params;
  const { uid, section } = await searchParams;
  if (
    action !== 'login' &&
    action !== 'register' &&
    action !== 'forgot-password' &&
    action !== 'appeal' &&
    !isSecurityAction(action)
  )
    notFound();
  return <AccountScreen mode={action} query={personalQuery(uid, section)} />;
}
