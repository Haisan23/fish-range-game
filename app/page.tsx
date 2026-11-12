import { redirect } from "next/navigation";
import Footer from "@/components/Footer";
import NavBar from "@/components/NavBar";
import ShootingGame from "@/components/ShootingGame";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const username = getSessionUser();
  if (!username) redirect("/login"); // the game requires a login

  return (
    <>
      <NavBar username={username} />
      <main className="px-4 py-5">
        <ShootingGame username={username} />
      </main>
      <Footer />
    </>
  );
}