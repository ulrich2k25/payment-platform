"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, ShieldCheck } from "lucide-react";

const navigation = [
  {
    label: "Produits",
    href: "/services",
  },
  {
    label: "Tarifs",
    href: "/pricing",
  },
  {
    label: "Documentation",
    href: "/docs",
  },
  {
    label: "Sécurité",
    href: "/security",
  },
];

export function PublicHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-[#e8e3da]/80 bg-[#f7f6f2]/95 backdrop-blur">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-10">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0a0e17] text-[#e6c76d]">
            <ShieldCheck size={20} />
          </div>

          <div>
            <div className="text-sm font-semibold tracking-tight text-[#0a0e17]">
              Payment Platform
            </div>

            <div className="text-[9px] font-medium uppercase tracking-[0.14em] text-slate-400">
              Payment infrastructure
            </div>
          </div>
        </Link>

        <nav className="hidden items-center gap-7 lg:flex">
          {navigation.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm font-medium transition ${
                  active
                    ? "text-[#9a7523]"
                    : "text-slate-500 hover:text-[#0a0e17]"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="hidden px-3 py-2 text-sm font-medium text-slate-600 transition hover:text-[#0a0e17] sm:block"
          >
            Connexion
          </Link>

          <Link
            href="/signup"
            className="inline-flex items-center gap-2 rounded-xl bg-[#0a0e17] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#171d2a]"
          >
            Commencer
            <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </header>
  );
}
