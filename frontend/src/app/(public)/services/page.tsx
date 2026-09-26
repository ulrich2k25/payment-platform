import Link from "next/link";
import {
  ArrowRight,
  CreditCard,
  Globe2,
  RefreshCcw,
  Webhook,
} from "lucide-react";

const services = [
  {
    icon: CreditCard,
    title: "Payment API",
    description:
      "Une interface unique pour créer, suivre et confirmer des paiements depuis vos applications.",
  },
  {
    icon: Globe2,
    title: "Mobile Money",
    description:
      "Connectez progressivement les providers adaptés aux différents marchés africains.",
  },
  {
    icon: Webhook,
    title: "Webhooks",
    description:
      "Recevez automatiquement les changements de statut de paiement dans votre backend.",
  },
  {
    icon: RefreshCcw,
    title: "Réconciliation",
    description:
      "Vérifiez automatiquement l’état réel des paiements lorsque les callbacks sont absents ou retardés.",
  },
];

export default function ServicesPage() {
  return (
    <main className="bg-[#f7f6f2]">
      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-10 lg:py-28">
        <div className="max-w-3xl">
          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9a7523]">
            Produits
          </div>

          <h1 className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-[#0a0e17] sm:text-5xl">
            Les briques nécessaires pour intégrer les paiements.
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-8 text-slate-500">
            Découvrez la plateforme librement. L’inscription devient nécessaire
            lorsque vous souhaitez commencer une intégration.
          </p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-2">
          {services.map((service) => {
            const Icon = service.icon;

            return (
              <article
                key={service.title}
                className="rounded-2xl border border-[#e6e1d7] bg-white p-7"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#fff8e7] text-[#9a7523]">
                  <Icon size={20} />
                </div>

                <h2 className="mt-5 text-xl font-semibold">{service.title}</h2>

                <p className="mt-2 text-sm leading-7 text-slate-500">
                  {service.description}
                </p>
              </article>
            );
          })}
        </div>

        <div className="mt-12">
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 rounded-xl bg-[#0a0e17] px-5 py-3 text-sm font-semibold text-white"
          >
            Commencer une intégration
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </main>
  );
}
