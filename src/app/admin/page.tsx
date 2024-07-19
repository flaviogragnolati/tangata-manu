import Link from 'next/link';
import Title from '~/components/Title';

export default async function AdminHome() {
  return (
    <div>
      <div className="flex justify-center py-4">
        <Link href="/api/auth/signout">Cerrar Sesión</Link>
      </div>
      <Title>Admin Home</Title>
      <div className="flex flex-col items-center space-y-8">
        <Link className="text-xl" href="/admin/site">
          Sitios
        </Link>
        <Link className="text-xl" href="/admin/site-rate">
          Tarifas de Sitios
        </Link>
        <Link className="text-xl" href="/admin/users-hours">
          Historial de Horas por Usuario
        </Link>
      </div>
    </div>
  );
}
