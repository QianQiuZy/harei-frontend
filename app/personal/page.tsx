import PersonalScreen from '@/components/member/PersonalScreen';

export default async function PersonalPage({
  searchParams
}: {
  searchParams: Promise<{ uid?: string; section?: string }>;
}) {
  const { uid, section } = await searchParams;
  return (
    <PersonalScreen
      initialUid={typeof uid === 'string' ? uid : ''}
      openAddress={section === 'address'}
    />
  );
}
