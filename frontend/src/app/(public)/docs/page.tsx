import { Braces, KeyRound, Webhook } from "lucide-react";

const steps = [
  {
    icon: KeyRound,
    title: "1. Obtenir une clé API",
    description:
      "Après inscription, créez les identifiants nécessaires pour authentifier votre backend.",
  },
  {
    icon: Braces,
    title: "2. Créer un paiement",
    description:
      "Votre serveur appellera la Payment API avec le montant, la devise et la référence de commande.",
  },
  {
    icon: Webhook,
    title: "3. Recevoir le résultat",
    description:
      "Votre application pourra recevoir les changements de statut via webhook.",
  },
];

export default function DocsPage() {
  return (
    <main className="bg-[#f7f6f2]">
      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-10 lg:py-28">
        <div className="max-w-3xl">
          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9a7523]">
            Documentation
          </div>

          <h1 className="mt-4 text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">
            Une intégration conçue pour rester simple.
          </h1>

          <p className="mt-6 text-base leading-8 text-slate-500">
            Cette documentation évoluera avec les endpoints publics de la
            plateforme.
          </p>
        </div>

        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {steps.map((step) => {
            const Icon = step.icon;

            return (
              <article
                key={step.title}
                className="rounded-2xl border border-[#e6e1d7] bg-white p-6"
              >
                <Icon size={20} className="text-[#9a7523]" />

                <h2 className="mt-5 font-semibold">{step.title}</h2>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {step.description}
                </p>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
