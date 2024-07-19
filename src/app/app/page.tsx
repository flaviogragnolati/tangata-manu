import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getServerAuthSession } from '~/server/auth';

export default async function AppHome() {
  const session = await getServerAuthSession();
  if (!session?.user) {
    redirect('/api/auth/signin');
  }
  const name = session.user.name;

  return (
    <div>
      <div className="flex justify-center py-4">
        <Link href="/api/auth/signout">Cerrar Sesión</Link>
      </div>
      <h1>Hola, {name}</h1>
      <div className="flex flex-col items-center justify-center space-y-2">
        <Link href="/app/hour-log">Cargar horas</Link>
        <Link href="/app/hour-log-history">Ver Horas Cargadas</Link>
      </div>
    </div>
  );
}
