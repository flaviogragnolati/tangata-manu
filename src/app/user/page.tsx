import { redirect } from 'next/navigation';

import Title from '~/components/Title';
import LinkButton from '~/components/LinkButton';
import LogoutButton from '~/components/LogoutButton';
import { getServerAuthSession } from '~/server/auth';

export default async function AppHome() {
  const session = await getServerAuthSession();
  if (!session?.user) {
    redirect('/api/auth/signin');
  }
  const name = session.user.name;

  return (
    <div>
      <div className="flex justify-start py-4">
        <LogoutButton />
      </div>
      <Title>Hola, {name}</Title>
      <div className="flex flex-col space-y-8">
        <LinkButton href="/user/hour-log">Cargar horas</LinkButton>
        <LinkButton href="/user/hour-log-history">
          Ver Horas Cargadas
        </LinkButton>
      </div>
    </div>
  );
}
