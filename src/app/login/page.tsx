import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, verifySessionCookie } from "@/lib/auth";
import { LoginForm } from "@/components/LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const store = await cookies();
  if (await verifySessionCookie(store.get(SESSION_COOKIE)?.value)) {
    redirect("/");
  }
  const { next } = await searchParams;
  return (
    <main className="min-h-screen grid place-items-center px-6">
      <div className="w-full max-w-md">
        <p className="text-brass tracking-[0.28em] uppercase text-xs mb-3">
          Personal studio
        </p>
        <h1 className="font-serif text-5xl leading-none mb-3">Linfeedgen</h1>
        <p className="text-[#b7aa98] mb-10">
          This week&apos;s AI/data argument → poster → you approve → LinkedIn.
          Nothing posts without you.
        </p>
        <LoginForm nextPath={next || "/"} />
      </div>
    </main>
  );
}
