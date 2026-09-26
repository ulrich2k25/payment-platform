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
    <div className="pb-10">
      <div className="max-w-2xl">
        <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[#9a7523]">
          Paramètres
        </div>

        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[#0a0e17]">
          Compte marchand
        </h1>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          Gérez les informations de votre entreprise et consultez les
          informations de sécurité liées à votre compte.
        </p>
      </div>

      <div className="mt-8 grid items-start gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-2xl border border-[#e7e2d8] bg-white p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#fff8e7] text-[#9a7523]">
              <Building2 size={18} />
            </div>

            <div>
              <h2 className="text-base font-semibold text-[#0a0e17]">
                Profil de l&apos;entreprise
              </h2>

              <p className="mt-1 text-sm leading-6 text-slate-500">
                Ces informations identifient votre organisation dans la
                plateforme.
              </p>
            </div>
          </div>

          <div className="mt-6 border-t border-[#eee9df] pt-6">
            <MerchantProfileForm
              initialName={session.merchant.name}
              initialEmail={session.merchant.email}
            />
          </div>
        </section>

        <section className="rounded-2xl border border-[#e7e2d8] bg-white p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#fff8e7] text-[#9a7523]">
              <ShieldCheck size={18} />
            </div>

            <div>
              <h2 className="text-base font-semibold text-[#0a0e17]">
                Compte et sécurité
              </h2>

              <p className="mt-1 text-sm leading-6 text-slate-500">
                Informations liées à votre accès au Merchant Dashboard.
              </p>
            </div>
          </div>

          <div className="mt-6 divide-y divide-[#eee9df] border-y border-[#eee9df]">
            {accountItems.map((item) => {
              const Icon = item.icon;

              return (
                <div key={item.label} className="flex items-start gap-3 py-4">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-400">
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

          <div className="mt-6">
            <h3 className="text-sm font-semibold text-[#0a0e17]">Session</h3>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              La déconnexion révoque la session actuelle sur cet appareil.
            </p>

            <form action={logoutMerchant} className="mt-4">
              <button
                type="submit"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#ded8cc] bg-white px-4 text-sm font-semibold text-[#0a0e17] transition hover:border-red-200 hover:bg-red-50 hover:text-red-700"
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
