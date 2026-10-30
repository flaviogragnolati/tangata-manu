import { redirect } from 'next/navigation';
import { Button, Stack, Typography } from '@mui/material';
import AppShell from '~/client/components/ui/AppShell';
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
      <Stack
        component="main"
        spacing={3}
        sx={{
          minHeight: '100vh',
          alignItems: 'center',
          justifyContent: 'center',
          px: 2,
          textAlign: 'center',
        }}
      >
        <Typography variant="h5" component="h1">
          No tiene acceso a esta sección
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button href="/user">Ir al inicio</Button>
          <LogoutButton />
        </Stack>
      </Stack>
    );
  }

  return (
    <AppShell area="admin" user={session.user}>
      {children}
    </AppShell>
  );
}
