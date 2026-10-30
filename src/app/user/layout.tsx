import { redirect } from 'next/navigation';
import AppShell from '~/client/components/ui/AppShell';
import { getServerAuthSession } from '~/server/auth';
import '~/styles/globals.css';

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerAuthSession();

  if (!session?.user) {
    redirect('/');
  }

  return (
    <AppShell area="user" user={session.user}>
      {children}
    </AppShell>
  );
}
