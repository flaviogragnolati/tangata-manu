import Link from 'next/link';
import Image from 'next/image';
import { redirect } from 'next/navigation';

import logo from 'public/assets/consultorios-medicos.jpg';

import Title from '~/client/components/ui/Title';
import { getServerAuthSession } from '~/server/auth';

export default async function Home() {
  const session = await getServerAuthSession();

  if (!session?.user) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center text-black">
        <Title>Para empezar inicie sesión</Title>
        <Image
          className="mb-4"
          src={logo}
          alt="Consultorios médicos"
          width={250}
          height={200}
        />
        <Link href="/api/auth/signin">
          <button
            type="button"
            className="mb-2 me-2 rounded-lg bg-gradient-to-br from-green-400 to-blue-600 px-5 py-3 text-center text-3xl font-medium text-white hover:bg-gradient-to-bl focus:outline-none focus:ring-4 focus:ring-green-200 dark:focus:ring-green-800"
          >
            Iniciar sesión
          </button>
        </Link>
      </main>
    );
  }

  if (session.user.role === 'SUPERADMIN' || session.user.role === 'ADMIN') {
    redirect('/admin');
  } else {
    redirect('/user');
  }
}
