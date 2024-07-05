import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";

import logo from "public/assets/consultorios-medicos.jpg";

import Title from "~/components/Title";
import { getServerAuthSession } from "~/server/auth";

export default async function Home() {
  const session = await getServerAuthSession();

  console.log("SESSION", session);

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
        <Link href="/api/auth/signin" className="text-xl">
          Iniciar sesión
        </Link>
      </main>
    );
  }

  if (session.user.role === "SUPERADMIN") {
    redirect("/superadmin");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
      <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16 ">
        <Title>
          <Link href="/user-hour-log">Cargar horas</Link>
        </Title>
      </div>
    </main>
  );
}
