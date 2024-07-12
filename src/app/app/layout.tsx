import Link from 'next/link';
import { getServerAuthSession } from '~/server/auth';
import '~/styles/globals.css';

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerAuthSession();

  if (!session?.user) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center">
        <h1>Iniciar Sesión</h1>
        <Link href="/api/auth/signin">Sign in</Link>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center">
      {children}
    </main>
  );
}
