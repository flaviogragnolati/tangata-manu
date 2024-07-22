import Title from '~/components/Title';
import LinkButton from '~/components/LinkButton';
import LogoutButton from '~/components/LogoutButton';

export default async function AdminHome() {
  return (
    <div>
      <div className="flex justify-start py-4">
        <LogoutButton />
      </div>
      <Title>Admin Home</Title>
      <div className="flex flex-col space-y-8">
        <LinkButton href="/admin/site">Sitios</LinkButton>
        <LinkButton href="/admin/site-rate"> Tarifas de Sitios</LinkButton>
        <LinkButton href="/admin/users-hours">
          Historial de Horas por Usuario
        </LinkButton>
        <LinkButton href="/admin/salaries">Salarios</LinkButton>
      </div>
    </div>
  );
}
