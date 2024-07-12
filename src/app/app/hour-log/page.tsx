import Title from '~/components/Title';
import HourLogForm from '~/components/HourLogForm';

import { api } from '~/trpc/server';

export default async function HourLogPage() {
  const sites = await api.site.getAllSites();
  return (
    <div className="container flex flex-col items-center justify-center gap-12 px-4">
      <Title>Administrador de horas</Title>
      <HourLogForm sites={sites} />
    </div>
  );
}
