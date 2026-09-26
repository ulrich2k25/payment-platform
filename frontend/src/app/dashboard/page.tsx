import { CheckCircle2, KeyRound, ShieldCheck, Webhook } from "lucide-react";

import { requireMerchant } from "@/lib/merchant-auth";

export const dynamic = "force-dynamic";

export default async function MerchantDashboardPage() {
  const session = await requireMerchant();

  const cards = [
    {
      label: "Compte marchand",
      value: "Actif",
      detail: session.merchant.name,
      icon: CheckCircle2,
    },
    {
      label: "Votre rôle",
      value: session.user.role,
      detail: session.user.email,
      icon: ShieldCheck,
    },
    {
      label: "Clés API",
      value: "À configurer",
      detail: "Prochaine étape",
      icon: KeyRound,
    },
    {
      label: "Webhook",
      value: "À configurer",
      detail: "Endpoint marchand",
      icon: Webhook,
    },
  ];

  return (
    <div>
      <div className="max-w-2xl">
        <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[#9a7523]">
          Merchant Dashboard
        </div>

        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[#0a0e17]">
          Bonjour, {session.merchant.name}
        </h1>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          Votre espace marchand est prêt. Nous allons maintenant connecter vos
          clés API, paiements, webhooks et providers.
        </p>
      </div>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <article
              key={card.label}
              className="rounded-2xl border border-[#e7e2d8] bg-white p-5 shadow-sm"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#fff8e7] text-[#9a7523]">
                <Icon size={18} />
              </div>

              <div className="mt-5 text-xs font-medium text-slate-400">
                {card.label}
              </div>

              <div className="mt-1 text-lg font-semibold text-[#0a0e17]">
                {card.value}
              </div>

              <div className="mt-1 truncate text-xs text-slate-400">
                {card.detail}
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}
