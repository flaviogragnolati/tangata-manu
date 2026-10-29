import { redirect } from 'next/navigation';
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
    <main className="flex min-h-screen flex-col items-center bg-zinc-50 px-5 py-2">
      {children}
    </main>
  );
}
