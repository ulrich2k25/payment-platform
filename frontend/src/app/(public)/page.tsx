import Link from "next/link";
import {
  ArrowRight,
  CreditCard,
  RefreshCcw,
  ShieldCheck,
  Webhook,
} from "lucide-react";

const services = [
  {
    icon: CreditCard,
    title: "Payment API",
    description:
      "Une API unique pour connecter les moyens de paiement adaptés à vos marchés.",
  },
  {
    icon: Webhook,
    title: "Webhooks fiables",
    description:
      "Recevez automatiquement les événements de paiement dans votre application.",
  },
  {
    icon: RefreshCcw,
    title: "Réconciliation",
    description:
      "Un mécanisme de récupération vérifie les paiements lorsque les callbacks ne suffisent pas.",
  },
];

export default function PublicHomePage() {
  return (
    <main className="min-h-screen bg-[#f7f6f2] text-[#0a0e17]">
<section className="mx-auto max-w-7xl px-6 pb-24 pt-20 lg:px-10 lg:pt-28">
        <div className="max-w-4xl">
          <div className="mb-5 inline-flex rounded-full border border-[#dbc47d] bg-[#fff8e7] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-[#9a7523]">
            Infrastructure de paiement
          </div>

          <h1 className="max-w-4xl text-5xl font-semibold leading-[1.02] tracking-[-0.055em] sm:text-6xl lg:text-7xl">
            Une infrastructure simple pour accepter et suivre vos paiements.
          </h1>

          <p className="mt-7 max-w-2xl text-base leading-8 text-slate-500 sm:text-lg">
            Découvrez librement la plateforme. La création d’un compte devient
            nécessaire uniquement lorsque vous souhaitez configurer et utiliser
            nos services.
          </p>

          <div className="mt-9 flex flex-wrap gap-3">
            <a
              href="#services"
              className="inline-flex items-center gap-2 rounded-xl bg-[#0a0e17] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#171d2a]"
            >
              Découvrir les services
              <ArrowRight size={16} />
            </a>

            <div className="flex items-center px-3 text-xs text-slate-400">
              Aucun compte nécessaire pour découvrir la plateforme
            </div>
          </div>
        </div>
      </section>

      <section id="services" className="border-y border-[#e8e3da] bg-white">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-10">
          <div className="max-w-2xl">
            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[#9a7523]">
              Services
            </div>

            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">
              Les briques essentielles pour vos paiements.
            </h2>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {services.map((service) => {
              const Icon = service.icon;

              return (
                <article
                  key={service.title}
                  className="rounded-2xl border border-[#e8e3da] bg-[#fdfcf9] p-6"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#fff8e7] text-[#9a7523]">
                    <Icon size={20} />
                  </div>

                  <h3 className="mt-5 text-lg font-semibold">
                    {service.title}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {service.description}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-10">
        <div className="rounded-[28px] bg-[#0a0e17] px-7 py-10 text-white sm:px-10 lg:px-12">
          <div className="max-w-2xl">
            <div className="text-xs font-semibold uppercase tracking-[0.15em] text-[#c8a24a]">
              Bientôt
            </div>

            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">
              Activez seulement les services dont votre entreprise a besoin.
            </h2>

            <p className="mt-4 text-sm leading-7 text-slate-400">
              L’espace marchand permettra de créer vos clés API, configurer vos
              webhooks, suivre vos transactions et gérer vos providers.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
