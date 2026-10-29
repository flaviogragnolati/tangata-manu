import { redirect } from 'next/navigation';

import C from '~/constants';
import Logo from '~/client/components/ui/Logo';
import GoogleSignInButton from '~/client/components/ui/GoogleSignInButton';
import { getServerAuthSession } from '~/server/auth';

type SearchParam = string | string[] | undefined;

const firstParam = (value: SearchParam) =>
  Array.isArray(value) ? value[0] : value;

// hasOwn keeps prototype keys like `?error=constructor` out of the lookup
const getAuthErrorMessage = (error: string) =>
  Object.hasOwn(C.authErrorsMap, error)
    ? C.authErrorsMap[error as keyof typeof C.authErrorsMap]
    : C.authErrorsMap.default;

export default async function Home({
  searchParams,
}: {
  searchParams: { error?: SearchParam; callbackUrl?: SearchParam };
}) {
  const session = await getServerAuthSession();

  if (!session?.user) {
    const error = firstParam(searchParams.error);
    const callbackUrl = firstParam(searchParams.callbackUrl) ?? '/';

    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-cyan-50 to-blue-100 px-4">
        <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl ring-1 ring-black/5">
          <div className="flex justify-center">
            <Logo />
          </div>
          <h1 className="mb-2 mt-8 text-center text-2xl font-bold text-gray-900">
            Iniciar sesión
          </h1>
          <p className="mb-6 mt-0 text-center text-sm text-gray-500">
            Ingrese con su cuenta de Google para cargar y consultar sus horas.
          </p>
          {error && (
            <div
              role="alert"
              className="mb-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {getAuthErrorMessage(error)}
            </div>
          )}
          <GoogleSignInButton callbackUrl={callbackUrl} />
        </div>
        <p className="mt-6 text-xs text-gray-600">
          © {new Date().getFullYear()} Consultorios Médicos
        </p>
      </main>
    );
  }

  if (session.user.role === 'SUPERADMIN' || session.user.role === 'ADMIN') {
    redirect('/admin');
  } else {
    redirect('/user');
  }
}
