import Link from 'next/link';
import { redirect } from 'next/navigation';
import LogoutButton from '~/client/components/ui/LogoutButton';
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

  // Redirecting here would loop: `/` sends SUPERADMIN back to /admin
  if (session.user.role !== 'ADMIN') {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
        <h1 className="m-0 text-2xl font-bold text-gray-900">
          No tiene acceso a esta sección
        </h1>
        <div className="flex gap-2">
          <Link
            href="/user"
            className="rounded-lg px-5 py-2.5 text-sm font-medium text-blue-700 hover:underline"
          >
            Ir al inicio
          </Link>
          <LogoutButton />
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center px-5 py-2">
      {children}
    </main>
  );
}
