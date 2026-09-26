import Link from "next/link";
import {
  CreditCard,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Settings,
  Webhook,
  Workflow,
} from "lucide-react";

import { logoutMerchant } from "@/app/dashboard/actions";

type MerchantDashboardShellProps = {
  companyName: string;
  email: string;
  children: React.ReactNode;
};

export function MerchantDashboardShell({
  companyName,
  email,
  children,
}: MerchantDashboardShellProps) {
  return (
    <div className="min-h-screen bg-[#f7f6f2]">
      <header className="border-b border-[#e7e2d8] bg-white">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-10">
          <div>
            <div className="text-sm font-semibold text-[#0a0e17]">
              {companyName}
            </div>

            <div className="text-xs text-slate-400">Merchant Dashboard</div>
          </div>

          <div className="flex items-center gap-4">
            <span className="hidden text-xs text-slate-400 sm:block">
              {email}
            </span>

            <form action={logoutMerchant}>
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-xl border border-[#e3dfd5] bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                <LogOut size={14} />
                Déconnexion
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-8 px-6 py-8 lg:grid-cols-[220px_minmax(0,1fr)] lg:px-10">
        <aside>
          <nav className="space-y-1">
            {[
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
                icon: Workflow,
              },
              {
                label: "Clés API",
                href: "/dashboard/api-keys",
                icon: KeyRound,
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
            ].map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-500 transition hover:bg-white hover:text-[#0a0e17]"
                >
                  <Icon size={16} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <main>{children}</main>
      </div>
    </div>
  );
}
