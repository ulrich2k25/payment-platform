import { Fingerprint, KeyRound, ShieldCheck } from "lucide-react";

export default function SecurityPage() {
  return (
    <main className="bg-[#f7f6f2]">
      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-10 lg:py-28">
        <div className="max-w-3xl">
          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9a7523]">
            Sécurité
          </div>

          <h1 className="mt-4 text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">
            La sécurité fait partie de l’architecture.
          </h1>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {[
            {
              icon: KeyRound,
              title: "Secrets protégés",
              text: "Les credentials sensibles sont conservés et utilisés uniquement côté serveur.",
            },
            {
              icon: Fingerprint,
              title: "Sessions révocables",
              text: "Les espaces sensibles utilisent des sessions qui peuvent être expirées ou révoquées.",
            },
            {
              icon: ShieldCheck,
              title: "Webhooks contrôlés",
              text: "Signatures, retries et protections réseau renforcent la livraison des événements.",
            },
          ].map((item) => {
            const Icon = item.icon;

            return (
              <article
                key={item.title}
                className="rounded-2xl border border-[#e6e1d7] bg-white p-6"
              >
                <Icon size={21} className="text-[#9a7523]" />

                <h2 className="mt-5 font-semibold">{item.title}</h2>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {item.text}
                </p>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
