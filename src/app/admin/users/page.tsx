import { api } from '~/trpc/server';
import { getServerAuthSession } from '~/server/auth';
import UsersAdminView from '~/components/admin/UsersAdminView';

export default async function UsersAdminPage() {
  const [users, session] = await Promise.all([
    api.user.getUsersOverview(),
    getServerAuthSession(),
  ]);
  return (
    <UsersAdminView users={users} currentUserId={session?.user.id ?? ''} />
  );
}
