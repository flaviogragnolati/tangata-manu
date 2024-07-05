import Link from 'next/link';
import Title from '~/components/Title';

export default async function SuperAdminHome() {
  return (
    <div>
      <Title>Super Admin Home</Title>
      <div className="flex flex-col items-center space-y-8">
        <Link className="text-xl" href="/superadmin/site">
          Sitios
        </Link>
        <Link className="text-xl" href="/superadmin/site-rate">
          Valores por Hora de Sitios
        </Link>
      </div>
    </div>
  );
}
