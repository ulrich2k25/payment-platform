import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";

export default function PricingPage() {
  return (
    <main className="bg-[#f7f6f2]">
      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-10 lg:py-28">
        <div className="max-w-3xl">
          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9a7523]">
            Tarifs
          </div>

          <h1 className="mt-4 text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">
            Une tarification lisible pour démarrer simplement.
          </h1>

          <p className="mt-6 text-base leading-8 text-slate-500">
            Le modèle commercial définitif sera fixé avant l’ouverture aux
            marchands externes.
          </p>
        </div>

        <div className="mt-12 max-w-xl rounded-[26px] border border-[#dfd9cd] bg-white p-8 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[#9a7523]">
            Early access
          </div>

          <h2 className="mt-3 text-2xl font-semibold">Payment Platform</h2>

          <p className="mt-3 text-sm leading-7 text-slate-500">
            Accès à l’API de paiement et aux outils d’intégration pendant la
            phase de lancement.
          </p>

          <div className="mt-7 space-y-3">
            {[
              "Payment API",
              "Suivi des transactions",
              "Webhooks",
              "Réconciliation",
              "Clés API marchand",
            ].map((feature) => (
              <div
                key={feature}
                className="flex items-center gap-3 text-sm text-slate-600"
              >
                <Check size={16} className="text-emerald-600" />
                {feature}
              </div>
            ))}
          </div>

          <Link
            href="/signup"
            className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#0a0e17] px-5 py-3 text-sm font-semibold text-white"
          >
            Demander l’accès
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </main>
  );
}
