'use client';

import Link from 'next/link';
import { Button } from '@mui/material';

export default function LogoutButton() {
  return (
    <Button component={Link} href="/api/auth/signout" variant="outlined">
      Cerrar sesión
    </Button>
  );
}
