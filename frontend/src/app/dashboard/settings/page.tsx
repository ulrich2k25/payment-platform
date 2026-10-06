import {
  Building2,
  CalendarDays,
  Clock3,
  LogOut,
  Mail,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import { requireMerchant } from "@/lib/merchant-auth";

import { logoutMerchant } from "./actions";
import { MerchantProfileForm } from "./merchant-profile-form";

export const dynamic = "force-dynamic";

function formatDateTime(value: string | null): string {
  if (!value) {
    return "Jamais";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Indisponible";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function statusLabel(status: string) {
  if (status === "ACTIVE") {
    return "Actif";
  }

  if (status === "DISABLED") {
    return "Désactivé";
  }

  if (status === "SUSPENDED") {
    return "Suspendu";
  }

  return status;
}

export default async function MerchantSettingsPage() {
  const session = await requireMerchant();

  const canManage =
    session.user.role === "OWNER" || session.user.role === "ADMIN";

  const accountItems = [
    {
      label: "E-mail de connexion",
      value: session.user.email,
      icon: Mail,
    },
    {
      label: "Rôle",
      value: session.user.role,
      icon: ShieldCheck,
    },
    {
      label: "Statut utilisateur",
      value: statusLabel(session.user.status),
      icon: UserRound,
    },
    {
      label: "Statut marchand",
      value: statusLabel(session.merchant.status),
      icon: Building2,
    },
    {
      label: "Dernière connexion",
      value: formatDateTime(session.user.lastLoginAt),
      icon: Clock3,
    },
    {
      label: "Compte créé",
      value: formatDateTime(session.merchant.createdAt),
      icon: CalendarDays,
    },
  ];

  return (
    <div className="mx-auto max-w-[1500px] space-y-6 pb-10">
      <section>
        <div className="mb-2 flex items-center gap-2">
          <span className="rounded-full border border-[#dbc47d] bg-[#fff8e7] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9a7523]">
            Paramètres
          </span>
        </div>

        <h1 className="text-2xl font-semibold tracking-[-0.035em] text-[#0a0e17] sm:text-3xl">
          Compte marchand
        </h1>

        <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
          Gérez les informations de votre entreprise et consultez les
          informations de sécurité liées à votre compte.
        </p>
      </section>

      <div className="grid items-start gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-2xl border border-[#e7e2d8] bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.02),0_8px_24px_rgba(15,23,42,0.035)] sm:p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#eee8da] bg-[#fffaf0] text-[#9a7523]">
              <Building2 size={18} />
            </div>

            <div>
              <h2 className="text-base font-semibold tracking-tight text-[#0a0e17]">
                Profil de l&apos;entreprise
              </h2>

              <p className="mt-1 text-sm leading-6 text-slate-500">
                Ces informations identifient votre organisation dans la
                plateforme.
              </p>
            </div>
          </div>

          <div className="mt-5 border-t border-[#eeeae2] pt-5">
            <MerchantProfileForm
              initialName={session.merchant.name}
              initialEmail={session.merchant.email}
              canManage={canManage}
            />
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-[#e7e2d8] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.02),0_8px_24px_rgba(15,23,42,0.035)]">
          <div className="border-b border-[#eeeae2] p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#eee8da] bg-[#fffaf0] text-[#9a7523]">
                <ShieldCheck size={18} />
              </div>

              <div>
                <h2 className="text-base font-semibold tracking-tight text-[#0a0e17]">
                  Compte et sécurité
                </h2>

                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Informations liées à votre accès au Merchant Dashboard.
                </p>
              </div>
            </div>
          </div>

          <div className="divide-y divide-[#f0ede6]">
            {accountItems.map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.label}
                  className="flex items-start gap-3 px-5 py-4 transition hover:bg-[#fdfbf6] sm:px-6"
                >
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#eeeae2] bg-[#faf9f6] text-slate-400">
                    <Icon size={15} />
                  </div>

                  <div className="min-w-0">
                    <div className="text-xs font-medium text-slate-400">
                      {item.label}
                    </div>

                    <div className="mt-1 break-words text-sm font-medium text-[#0a0e17]">
                      {item.value}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="border-t border-[#eeeae2] p-5 sm:p-6">
            <h3 className="text-sm font-semibold text-[#0a0e17]">Session</h3>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              La déconnexion révoque la session actuelle sur cet appareil.
            </p>

            <form action={logoutMerchant} className="mt-4">
              <button
                type="submit"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#e5e0d6] bg-white px-4 text-sm font-medium text-[#0a0e17] transition hover:border-red-200 hover:bg-red-50 hover:text-red-700"
              >
                <LogOut size={15} />
                Se déconnecter
              </button>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}
