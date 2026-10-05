"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  ChevronDown,
  CircleDollarSign,
  CreditCard,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Menu,
  Network,
  Settings,
  ShieldCheck,
  Webhook,
  X,
} from "lucide-react";
import { useState, type ReactNode } from "react";

import { logoutMerchant } from "@/app/dashboard/actions";

type MerchantDashboardShellProps = {
  companyName: string;
  email: string;
  children: ReactNode;
};

const navigation = [
  {
    label: "Vue d’ensemble",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Paiements",
    href: "/dashboard/payments",
    icon: CreditCard,
  },
  {
    label: "Transactions",
    href: "/dashboard/transactions",
    icon: Activity,
  },
  {
    label: "Clés API",
    href: "/dashboard/api-keys",
    icon: KeyRound,
  },
  {
    label: "Providers",
    href: "/dashboard/providers",
    icon: Network,
  },
  {
    label: "Webhooks",
    href: "/dashboard/webhooks",
    icon: Webhook,
  },
  {
    label: "Paramètres",
    href: "/dashboard/settings",
    icon: Settings,
  },
];

function getInitials(companyName: string) {
  return companyName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function SidebarContent({
  companyName,
  onNavigate,
}: {
  companyName: string;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-20 items-center px-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#c8a24a] text-[#0a0e17] shadow-[0_8px_24px_rgba(200,162,74,0.22)]">
            <CircleDollarSign size={21} strokeWidth={2.2} />
          </div>

          <div>
            <div className="text-sm font-semibold tracking-tight text-white">
              Payment Platform
            </div>

            <div className="mt-0.5 text-xs text-slate-500">
              Merchant Console
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 pt-5">
        <div className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9f8650]">
          Workspace
        </div>

        <nav className="space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;

            const active =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={[
                  "group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-all duration-200",
                  active
                    ? "bg-[#c8a24a]/10 font-medium text-white shadow-[inset_0_0_0_1px_rgba(200,162,74,0.16)]"
                    : "text-slate-400 hover:bg-white/[0.05] hover:text-white",
                ].join(" ")}
              >
                <Icon
                  size={18}
                  strokeWidth={active ? 2.2 : 1.8}
                  className={
                    active
                      ? "text-[#e6c76d]"
                      : "text-slate-500 group-hover:text-slate-300"
                  }
                />

                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto p-4">
        <div className="mb-3 rounded-2xl border border-[#c8a24a]/10 bg-[#c8a24a]/[0.045] p-4">
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-[#e6c76d]" />

            <span className="text-xs font-medium text-slate-200">
              Environnement
            </span>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-white">Sandbox</div>

              <div className="mt-0.5 max-w-[120px] truncate text-[11px] text-slate-500">
                {companyName}
              </div>
            </div>

            <span className="flex items-center gap-1.5 rounded-full border border-emerald-400/15 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-semibold text-emerald-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Actif
            </span>
          </div>
        </div>

        <form action={logoutMerchant}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-400 transition hover:bg-white/[0.05] hover:text-white"
          >
            <LogOut size={18} />
            Déconnexion
          </button>
        </form>
      </div>
    </div>
  );
}

export function MerchantDashboardShell({
  companyName,
  email,
  children,
}: MerchantDashboardShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const initials = getInitials(companyName) || "ME";

  return (
    <div className="min-h-screen bg-[#f7f6f2]">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[260px] border-r border-white/[0.05] bg-[#0a0e17] lg:block">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_5%_0%,rgba(200,162,74,0.12),transparent_26rem)]" />

        <div className="relative h-full">
          <SidebarContent companyName={companyName} />
        </div>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Fermer le menu"
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />

          <aside className="relative h-full w-[280px] border-r border-white/[0.05] bg-[#0a0e17] shadow-2xl">
            <button
              type="button"
              aria-label="Fermer"
              onClick={() => setMobileOpen(false)}
              className="absolute right-4 top-5 z-10 flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-white/10 hover:text-white"
            >
              <X size={20} />
            </button>

            <SidebarContent
              companyName={companyName}
              onNavigate={() => setMobileOpen(false)}
            />
          </aside>
        </div>
      )}

      <div className="lg:pl-[260px]">
        <header className="sticky top-0 z-30 border-b border-[#e7e3da] bg-[#f7f6f2]/88 backdrop-blur-xl">
          <div className="flex h-[72px] items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <button
                type="button"
                aria-label="Ouvrir le menu"
                onClick={() => setMobileOpen(true)}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#ded9cd] bg-white text-slate-700 shadow-sm lg:hidden"
              >
                <Menu size={20} />
              </button>

              <div className="hidden sm:block">
                <div className="text-xs font-medium text-[#a48b53]">
                  Payment Platform
                </div>

                <div className="text-sm font-semibold text-slate-800">
                  Espace marchand
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden items-center gap-2 rounded-full border border-[#e3dfd5] bg-white px-3 py-2 shadow-sm sm:flex">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />

                <span className="text-xs font-medium text-slate-600">
                  API opérationnelle
                </span>
              </div>

              <details className="group relative">
                <summary className="flex cursor-pointer list-none items-center gap-2 rounded-xl border border-[#e3dfd5] bg-white px-2.5 py-2 shadow-sm transition hover:border-[#c8a24a]/50">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0a0e17] text-xs font-semibold text-[#e6c76d]">
                    {initials}
                  </div>

                  <div className="hidden max-w-[150px] text-left md:block">
                    <div className="truncate text-xs font-semibold text-slate-800">
                      {companyName}
                    </div>

                    <div className="text-[10px] text-slate-400">Merchant</div>
                  </div>

                  <ChevronDown
                    size={14}
                    className="hidden text-slate-400 transition group-open:rotate-180 md:block"
                  />
                </summary>

                <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-[#e7e2d8] bg-white p-2 shadow-[0_18px_50px_rgba(15,23,42,0.12)]">
                  <div className="px-3 py-2">
                    <div className="truncate text-xs font-semibold text-[#0a0e17]">
                      {companyName}
                    </div>

                    <div className="mt-1 truncate text-[11px] text-slate-400">
                      {email}
                    </div>
                  </div>

                  <div className="my-1 border-t border-[#eeeae2]" />

                  <form action={logoutMerchant}>
                    <button
                      type="submit"
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-xs font-medium text-slate-600 transition hover:bg-[#faf9f6] hover:text-[#0a0e17]"
                    >
                      <LogOut size={15} />
                      Déconnexion
                    </button>
                  </form>
                </div>
              </details>
            </div>
          </div>
        </header>

        <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
