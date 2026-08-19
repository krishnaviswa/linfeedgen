"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/", label: "Sources" },
  { href: "/drafts", label: "Drafts" },
  { href: "/queue", label: "Queue" },
  { href: "/settings", label: "Settings" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <div className="min-h-screen grid grid-cols-[220px_1fr]">
      <aside className="border-r border-ink-700 bg-ink-900 px-5 py-6 flex flex-col">
        <Link href="/" className="font-serif text-2xl leading-none">
          Linfeedgen
        </Link>
        <p className="text-[11px] tracking-[0.18em] uppercase text-brass mt-2">
          Approve only
        </p>
        <nav className="mt-10 space-y-1">
          {NAV.map((item) => {
            const active =
              item.href === "/"
                ? path === "/"
                : path === item.href || path.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block rounded-md px-3 py-2 text-sm ${
                  active
                    ? "bg-ink-700 text-paper"
                    : "text-[#b7aa98] hover:bg-ink-800"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <button
          onClick={logout}
          className="mt-auto text-left text-sm text-[#8a7d6d] hover:text-paper"
        >
          Sign out
        </button>
      </aside>
      <div className="min-h-screen">{children}</div>
    </div>
  );
}
