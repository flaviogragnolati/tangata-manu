import Link from 'next/link';
import type { PropsWithChildren } from 'react';

export default function LinkButton({
  href,
  children,
}: PropsWithChildren<{ href: string }>) {
  return (
    <Link href={href}>
      <button
        type="button"
        className="mb-2 me-2 w-full rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 px-5 py-3 text-center text-2xl font-bold text-white hover:bg-gradient-to-bl focus:outline-none focus:ring-4 focus:ring-cyan-300 dark:focus:ring-cyan-800"
      >
        {children}
      </button>
    </Link>
  );
}
